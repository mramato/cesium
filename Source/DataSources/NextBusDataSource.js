/*global define*/
define([
        '../Core/Cartesian3',
        '../Core/Color',
        '../Core/defined',
        '../Core/defineProperties',
        '../Core/Event',
        '../Core/ExtrapolationType',
        '../Core/getFilenameFromUri',
        '../Core/JulianDate',
        '../Core/loadXml',
        '../Core/Math',
        '../Core/Quaternion',
        '../Core/Transforms',
        './SampledProperty',
        './SampledPositionProperty',
        '../ThirdParty/when',
        './DataSource',
        './EntityCollection'
    ], function(
        Cartesian3,
        Color,
        defined,
        defineProperties,
        Event,
        ExtrapolationType,
        getFilenameFromUri,
        JulianDate,
        loadXml,
        CesiumMath,
        Quaternion,
        Transforms,
        SampledProperty,
        SampledPositionProperty,
        when,
        DataSource,
        EntityCollection) {
    "use strict";

    var NextBusDataSource = function(name) {
        this._name = name;
        this._changed = new Event();
        this._error = new Event();
        this._isLoading = false;
        this._loading = new Event();
        this._entityCollection = new EntityCollection();
        this._promises = [];
    };

    NextBusDataSource.load = function(data, options) {
        return new NextBusDataSource().load(data, options);
    };

    defineProperties(NextBusDataSource.prototype, {
        /**
         * Gets a human-readable name for this instance.
         * @memberof NextBusDataSource.prototype
         * @type {String}
         */
        name : {
            get : function() {
                return this._name;
            }
        },
        /**
         * This DataSource only defines static data, therefore this property is always undefined.
         * @memberof NextBusDataSource.prototype
         * @type {DataSourceClock}
         */
        clock : {
            value : undefined,
            writable : false
        },
        /**
         * Gets the collection of {@link Entity} instances.
         * @memberof NextBusDataSource.prototype
         * @type {EntityCollection}
         */
        entities : {
            get : function() {
                return this._entityCollection;
            }
        },
        /**
         * Gets a value indicating if the data source is currently loading data.
         * @memberof NextBusDataSource.prototype
         * @type {Boolean}
         */
        isLoading : {
            get : function() {
                return this._isLoading;
            }
        },
        /**
         * Gets an event that will be raised when the underlying data changes.
         * @memberof NextBusDataSource.prototype
         * @type {Event}
         */
        changedEvent : {
            get : function() {
                return this._changed;
            }
        },
        /**
         * Gets an event that will be raised if an error is encountered during processing.
         * @memberof NextBusDataSource.prototype
         * @type {Event}
         */
        errorEvent : {
            get : function() {
                return this._error;
            }
        },
        /**
         * Gets an event that will be raised when the data source either starts or stops loading.
         * @memberof NextBusDataSource.prototype
         * @type {Event}
         */
        loadingEvent : {
            get : function() {
                return this._loading;
            }
        }
    });

    //http://api-portal.anypoint.mulesoft.com/nextbus/api/nextbus-api/docs/reference
    var agencyList = 'http://webservices.nextbus.com/service/publicXMLFeed?command=agencyList';
    var routeList = 'http://webservices.nextbus.com/service/publicXMLFeed?command=routeList&a=<agency_tag>';

    function queryNumericAttribute(node, attributeName) {
        if (!defined(node)) {
            return undefined;
        }

        var value = node.getAttribute(attributeName);
        if (value !== null) {
            var result = parseFloat(value);
            return !isNaN(result) ? result : undefined;
        }
        return undefined;
    }

    function queryStringAttribute(node, attributeName) {
        if (!defined(node)) {
            return undefined;
        }
        var value = node.getAttribute(attributeName);
        return value !== null ? value : undefined;
    }

    var Agency = function(tag, title, regionTitle) {
        this.tag = tag;
        this.title = title;
        this.regionTitle = regionTitle;
    };

    NextBusDataSource.getAgencies = function() {
        var agencies = [];
        return loadXml(agencyList).then(function(xml) {
            var body = xml.documentElement;
            var childNodes = body.childNodes;
            var length = childNodes.length;
            for (var q = 0; q < length; q++) {
                var child = childNodes[q];
                if (child.localName === 'agency') {
                    agencies.push(new Agency(queryStringAttribute(child, 'tag'), queryStringAttribute(child, 'title'), queryStringAttribute(child, 'regionTitle')));
                }
            }
        });
    };

    NextBusDataSource.prototype.processUrl = function(url) {
        DataSource.setLoading(this, true);
        var that = this;

        var milliseconds = getFilenameFromUri(url);
        milliseconds = parseFloat(milliseconds.substring(0, milliseconds.length - 4));
        var time = JulianDate.fromDate(new Date(milliseconds*1000));

        return when(loadXml(url), function(xml) {

            var body = xml.documentElement;
            var childNodes = body.childNodes;
            var length = childNodes.length;
            for (var q = 0; q < length; q++) {
                var child = childNodes[q];
                if (child.localName === 'vehicle') {
                    var id = queryStringAttribute(child, 'id');
                    var routeTag = queryStringAttribute(child, 'routeTag');
                    var dirTag = queryStringAttribute(child, 'dirTag');
                    var lat = queryNumericAttribute(child, 'lat');
                    var lon = queryNumericAttribute(child, 'lon');
                    var secSinceReport = queryNumericAttribute(child, 'secsSinceReport');
                    var predictable = queryStringAttribute(child, 'predictable');
                    if(predictable !== 'true'){
                        continue;
                    }
                    var heading = queryNumericAttribute(child, 'heading');
                    var speedKmHr = queryNumericAttribute(child, 'speedKmHr');
                    var leadingVehicleId = queryNumericAttribute(child, 'leadingVehicleId');

                    var entity = that._entityCollection.getOrCreateEntity(id + ' ' + routeTag + ' ' + dirTag);
                    if (!defined(entity.position)) {
                        entity.position = new SampledPositionProperty();
                        entity.position.backwardExtrapolationType = ExtrapolationType.NONE;
                        entity.position.forwardExtrapolationType = ExtrapolationType.NONE;

                        entity.orientation = new SampledProperty(Quaternion);
                        entity.orientation.backwardExtrapolationType = ExtrapolationType.NONE;
                        entity.orientation.forwardExtrapolationType = ExtrapolationType.NONE;

                        entity.model = {
                            uri : '/Apps/SampleData/models/CesiumGround/Cesium_Ground.gltf',
                            minimumPixelSize : 24
                        };
                    }

                    var samplePosition = Cartesian3.fromDegrees(lon, lat);
                    var sampleTime = JulianDate.addSeconds(time, -secSinceReport, new JulianDate());
                    if (heading >= 0) {
                        var sampleOrientation = Transforms.headingPitchRollQuaternion(samplePosition, CesiumMath.toRadians(heading - 90), 0, 0);
                        entity.orientation.addSample(sampleTime, sampleOrientation);
                    }
                    entity.position.addSample(sampleTime, samplePosition);
                }
            }

            DataSource.setLoading(that, false);
            return that;
        }).otherwise(function(error) {
            DataSource.setLoading(that, false);
            that._error.raiseEvent(that, error);
            window.console.log(error);
            return when.reject(error);
        });
    };
//
//    NextBusDataSource.prototype.load = function(agency, options) {
//        //>>includeStart('debug', pragmas.debug);
//        if (!defined(agency)) {
//            throw new DeveloperError('agency is required.');
//        }
//        //>>includeEnd('debug');
//
//        DataSource.setLoading(this, true);
//        this._entityCollection.removeAll();
//
//        var that = this;
//        var promise;
//        return when(promise, function(xml) {
//            return when.all(that._promises, function() {
//                that._promises.length = 0;
//                DataSource.setLoading(that, false);
//                return that;
//            });
//        }).otherwise(function(error) {
//            DataSource.setLoading(that, false);
//            that._error.raiseEvent(that, error);
//            window.console.log(error);
//            return when.reject(error);
//        });
//    };

    return NextBusDataSource;
});
