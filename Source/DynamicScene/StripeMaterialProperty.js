/*global define*/
define(['../Core/Color',
        '../Core/defaultValue',
        '../Core/defined',
        '../Core/defineProperties',
        '../Core/DeveloperError',
        '../Core/Event',
        './createDynamicPropertyDescriptor',
        './ConstantProperty',
        './Property'
    ], function(
        Color,
        defaultValue,
        defined,
        defineProperties,
        DeveloperError,
        Event,
        createDynamicPropertyDescriptor,
        ConstantProperty,
        Property) {
    "use strict";

    /**
     * A {@link MaterialProperty} that maps to stripe {@link Material} uniforms.
     *
     * @alias StripeMaterialProperty
     * @constructor
     */
    var StripeMaterialProperty = function() {
        this._definitionChanged = new Event();

        this._horizontal = undefined;
        this._horizontalSubscription = undefined;

        this._evenColor = undefined;
        this._evenColorSubscription = undefined;

        this._oddColor = undefined;
        this._oddColorSubscription = undefined;

        this._offset = undefined;
        this._offsetSubscription = undefined;

        this._repeat = undefined;
        this._repeatSubscription = undefined;

        this.horizontal = new ConstantProperty(true);
        this.evenColor = new ConstantProperty(Color.WHITE);
        this.oddColor = new ConstantProperty(Color.BLACK);
        this.offset = new ConstantProperty(0);
        this.repeat = new ConstantProperty(1);
    };

    defineProperties(StripeMaterialProperty.prototype, {
        /**
         * Gets a value indicating if this property is constant.  A property is considered
         * constant if getValue always returns the same result for the current definition.
         * @memberof StripeMaterialProperty.prototype
         * @type {Boolean}
         */
        isConstant : {
            get : function() {
                return Property.isConstant(this._horizontal) && //
                       Property.isConstant(this._evenColor) && //
                       Property.isConstant(this._oddColor) && //
                       Property.isConstant(this._offset) && //
                       Property.isConstant(this._repeat);
            }
        },
        /**
         * Gets the event that is raised whenever the definition of this property changes.
         * The definition is considered to have changed if a call to getValue would return
         * a different result for the same time.
         * @memberof StripeMaterialProperty.prototype
         * @type {Event}
         */
        definitionChanged : {
            get : function() {
                return this._definitionChanged;
            }
        },
        /**
         * Gets or sets the boolean property which determines if the stripes are horizontal or vertical.
         * @memberof StripeMaterialProperty.prototype
         * @type {Property}
         */
        horizontal : createDynamicPropertyDescriptor('horizontal'),
        /**
         * Gets or sets the {@link Color} property which determines the first color.
         * @memberof StripeMaterialProperty.prototype
         * @type {Property}
         */
        evenColor : createDynamicPropertyDescriptor('evenColor'),
        /**
         * Gets or sets the {@link Color} property which determines the second color.
         * @memberof StripeMaterialProperty.prototype
         * @type {Property}
         */
        oddColor : createDynamicPropertyDescriptor('oddColor'),
        /**
         * Gets or sets the numeric property which determines at which point into the pattern
         * to begin drawing; with 0.0 being the beginning of the even color, 1.0 the beginning
         * of the odd color, 2.0 being the even color again, and any multiple or fractional values
         * being in between.
         * @memberof StripeMaterialProperty.prototype
         * @type {Property}
         */
        offset : createDynamicPropertyDescriptor('offset'),
        /**
         * A numeric property which determines how many times the stripe pattern repeats.
         * @memberof StripeMaterialProperty.prototype
         * @type {Property}
         */
        repeat : createDynamicPropertyDescriptor('repeat')
    });

    /**
     * Gets the {@link Material} type at the provided time.
     * @memberof StripeMaterialProperty
     *
     * @param {JulianDate} time The time for which to retrieve the type.
     * @type {String} The type of material.
     */
    StripeMaterialProperty.prototype.getType = function(time) {
        return 'Stripe';
    };

    /**
     * Gets the value of the property at the provided time.
     * @memberof StripeMaterialProperty
     *
     * @param {JulianDate} time The time for which to retrieve the value.
     * @param {Object} [result] The object to store the value into, if omitted, a new instance is created and returned.
     * @returns {Object} The modified result parameter or a new instance if the result parameter was not supplied.
     */
    StripeMaterialProperty.prototype.getValue = function(time, result) {
        if (!defined(result)) {
            result = {};
        }
        result.horizontal = defined(this._horizontal) ? this._horizontal.getValue(time) : undefined;
        result.evenColor = defined(this._evenColor) ? this._evenColor.getValue(time, result.evenColor) : undefined;
        result.oddColor = defined(this._oddColor) ? this._oddColor.getValue(time, result.oddColor) : undefined;
        result.offset = defined(this._offset) ? this._offset.getValue(time) : undefined;
        result.repeat = defined(this._repeat) ? this._repeat.getValue(time) : undefined;
        return result;
    };

    /**
     * Compares this property to the provided property and returns
     * <code>true</code> if they are equal, <code>false</code> otherwise.
     * @memberof StripeMaterialProperty
     *
     * @param {Property} [other] The other property.
     * @returns {Boolean} <code>true</code> if left and right are equal, <code>false</code> otherwise.
     */
    StripeMaterialProperty.prototype.equals = function(other) {
        return this === other || //
               (other instanceof StripeMaterialProperty && //
                       Property.equals(this._horizontal, other._horizontal) && //
                       Property.equals(this._evenColor, other._evenColor) && //
                       Property.equals(this._oddColor, other._oddColor) && //
                       Property.equals(this._offset, other._offset) && //
                       Property.equals(this._repeat, other._repeat));
    };

    /**
     * @private
     */
    StripeMaterialProperty.prototype._raiseDefinitionChanged = function() {
        this._definitionChanged.raiseEvent(this);
    };

    return StripeMaterialProperty;
});
