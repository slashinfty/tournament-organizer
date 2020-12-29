'use strict';

const Match = require("./Match");

/** Class representing pairings. */
class Pairings {
    /**
     * Create new pairings.
     * @param {Number} round Round number of pairings.
     * @param {('elim'|'2xelim'|'robin'|'2xrobin'|'swiss')} format Pairing algorithm to use.
     * @param {Player[]|Number} players Array of players to pair, or number of blank matches to create.
     */
    constructor(round, format, players) {
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
        if (typeof players === 'number' && (format === 'elim' || format === '2xelim')) {
            for (let i = 0; i < players; i++) this.matches.push(new Match(this.round, i + 1));
        } // get other formats
    }
}

module.exports = Pairings;
