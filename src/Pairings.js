'use strict';

const Match = require("./Match");

/** Class representing pairings. */
class Pairings {
    /**
     * Create new pairings.
     * @param {Number} round Round number of pairings.
     * @param {('elim'|'2xelim'|'robin'|'2xrobin'|'swiss')} format Pairing algorithm to use.
     * @param {Player[]} players Array of players to pair.
     */
    constructor(round, format, players) {


        /**
         * Array of matches for the round.
         * @type {Match[]}
         */
        this.matches = [];
    }
}

module.exports = Pairings;
