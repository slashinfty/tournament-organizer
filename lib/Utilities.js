'use strict';

/**
 * Utility functions.
 * @namespace
 */
const Utilities = {
    /**
     * Creates a random alphanumeric string.
     * @param {Number} length Character length of generated string.
     * @return {String}
     */
    randomString: length => {
        let str = '';
        const char = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < length; i++) str += char.charAt(Math.floor(Math.random() * char.length));
        return str;
    },
    /**
     * Shuffles an array into a random order.
     * @param {Array.<*>} array An array of any objects.
     */
    shuffle: array => {
        for (let i = array.length - 1; i > 0; i--) {
            let r = Math.floor(Math.random() * (i + 1));
            let a = array[r];
            array[r] = array[i];
            array[i] = a;
        }
    },
    /**
     * Sorts an array by shortest distance to comparator's seed.
     * @param {Player[]} array The players to sort.
     * @param {('asc'|'des')} order The order in which to sort players.
     */
    seedSort: (array, order) => array.sort((a, b) => order === 'asc' ? a - b : b - a)
};

module.exports = Utilities;