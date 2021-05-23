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
     * @param {Player} comparator The player to compare to.
     * @param {Player[]} array The players to sort.
     */
    seedSort: (comparator, array) => array.sort((a, b) => Math.abs(comparator.seed - a.seed) - Math.abs(comparator.seed - b.seed)),
    /**
     * Sorts an array by byes point, match points e seed values.    
     * @param {Player[]} array The players to sort.
     */
    byesSort: (array) => {
        array.sort((p1,p2) => {
            let result = p1.byes - p2.byes;
            if (result == 0){
                result = p1.matchPoints - p2.matchPoints;
                if (result == 0){
                    result = p1.seed - p2.seed;
                }
            }
            return result;
        });
    }

};

module.exports = Utilities;