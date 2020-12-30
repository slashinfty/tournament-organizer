'use strict';

const Match = require("./Match");

/** Class representing pairings. */
class Pairings {
    /**
     * Create new pairings.
     * @param {Number} round Round number of pairings.
     * @param {('elim'|'2xelim'|'robin'|'2xrobin'|'swiss')} format Pairing algorithm to use.
     * @param {?Number} players Number of blank matches to create.
     */
    constructor(round, format, players = null) {
        /**
         * The round number.
         * @type {Number}
         */
        this.round = round;

        /**
         * Array of matches for the round.
         * @type {Match[]}
         */
        this.matches = [];

        // Creating matches based on format.
        if (typeof players === 'number') {
            for (let i = 0; i < players; i++) this.matches.push(new Match(this.round, i + 1));
        }
    }
}

module.exports = Pairings;
