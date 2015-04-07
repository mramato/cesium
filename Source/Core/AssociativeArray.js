/*global define*/
define([
        './defined',
        './defineProperties',
        './DeveloperError'
    ], function(
        defined,
        defineProperties,
        DeveloperError) {
    "use strict";

    /**
     * A collection of key-value pairs that is stored as a hash for easy
     * lookup but also provides an array for fast iteration.
     * @alias AssociativeArray
     * @constructor
     */
    var AssociativeArray = function() {
        this._array = [];
        this._hash = new Map();
    };

    defineProperties(AssociativeArray.prototype, {
        /**
         * Gets the number of items in the collection.
         * @memberof AssociativeArray.prototype
         *
         * @type {Number}
         */
        length : {
            get : function() {
                return this._array.length;
            }
        },
        /**
         * Gets an unordered array of all values in the collection.
         * This is a live array that will automatically reflect the values in the collection,
         * it should not be modified directly.
         * @memberof AssociativeArray.prototype
         *
         * @type {Array}
         */
        values : {
            get : function() {
                return this._array;
            }
        }
    });

    /**
     * Determines if the provided key is in the array.
     *
     * @param {String|Number} key The key to check.
     * @returns {Boolean} <code>true</code> if the key is in the array, <code>false</code> otherwise.
     */
    AssociativeArray.prototype.contains = function(key) {
        //>>includeStart('debug', pragmas.debug);
        if (typeof key !== 'string' && typeof key !== 'number') {
            throw new DeveloperError('key is required to be a string or number.');
        }
        //>>includeEnd('debug');
        return this._hash.has(key);
    };

    /**
     * Associates the provided key with the provided value.  If the key already
     * exists, it is overwritten with the new value.
     *
     * @param {String|Number} key A unique identifier.
     * @param {Object} value The value to associate with the provided key.
     */
    AssociativeArray.prototype.set = function(key, value) {
        //>>includeStart('debug', pragmas.debug);
        if (typeof key !== 'string' && typeof key !== 'number') {
            throw new DeveloperError('key is required to be a string or number.');
        }
        //>>includeEnd('debug');

        var hash = this._hash;

        if (hash.has(key)) {
            var oldValue = hash.get(key);
            if (value !== oldValue) {
                this.remove(key);
                hash.set(key, value);
                this._array.push(value);
            }
        } else {
            hash.set(key, value);
            this._array.push(value);
        }
    };

    /**
     * Retrieves the value associated with the provided key.
     *
     * @param {String|Number} key The key whose value is to be retrieved.
     * @returns {Object} The associated value, or undefined if the key does not exist in the collection.
     */
    AssociativeArray.prototype.get = function(key) {
        //>>includeStart('debug', pragmas.debug);
        if (typeof key !== 'string' && typeof key !== 'number') {
            throw new DeveloperError('key is required to be a string or number.');
        }
        //>>includeEnd('debug');
        return this._hash.get(key);
    };

    /**
     * Removes a key-value pair from the collection.
     *
     * @param {String|Number} key The key to be removed.
     * @returns {Boolean} True if it was removed, false if the key was not in the collection.
     */
    AssociativeArray.prototype.remove = function(key) {
        //>>includeStart('debug', pragmas.debug);
        if (defined(key) && typeof key !== 'string' && typeof key !== 'number') {
            throw new DeveloperError('key is required to be a string or number.');
        }
        //>>includeEnd('debug');

        var value = this._hash.get(key);
        var hasValue = this._hash.delete(key);
        if (hasValue) {
            var array = this._array;
            array.splice(array.indexOf(value), 1);
        }
        return hasValue;
    };

    /**
     * Clears the collection.
     */
    AssociativeArray.prototype.removeAll = function() {
        var array = this._array;
        if (array.length > 0) {
            this._hash.clear();
            array.length = 0;
        }
    };

    return AssociativeArray;
});
