'use strict';

/** Class representing a player. */
class Player {
    /**
     * Create a new player.
     * @param {String} id String to be the player ID.
     * @param {String} alias String to be the player's name.
     * @param {?Number} seed Number to be used as the seed.
     */
    constructor(alias, id, seed) {
        /**
         * Name of the player.
         * @type {String}
         */
        this.alias = alias;

        /**
         * Alphanumeric string ID.
         * @type {String}
         */
        this.id = id;

        /**
         * Value to sort players.
         * @type {?Number}
         */
        this.seed = seed;

        /**
         * Number of match points the player has.
         * @type {Number}
         */
        this.matchPoints = 0;

        /**
         * Number of matches played.
         * @type {Number}
         */
        this.matches = 0;
        
        /**
         * Number of game points the player has.
         * @type {Number}
         */
        this.gamePoints = 0;

        /**
         * Number of games played.
         * @type {Number}
         */
        this.games = 0;

        /**
         * Number of byes assigned.
         * @type {Number}
         */
        this.byes = 0;

        /**
         * Array of players played against.
         * @type {Player[]}
         */
        this.opponents = [];

        /**
         * If the player is paired in the current round.
         * @type {Boolean}
         */
        this.paired = false;

        /**
         * If the player is still in the tournament.
         * @type {Boolean}
         */
        this.active = true;

        /**
         * The round in which the player was dropped.
         * @type {?Number}
         */
        this.dropped = null;

        /**
         * Tiebreaker values.
         * @type {Object}
         */
        this.tiebreakers = {
            matchWinPctM: 0,
            matchWinPctP: 0,
            oppMatchWinPctM: 0,
            oppMatchWinPctP: 0,
            gameWinPct: 0,
            oppGameWinPct: 0,
            oppOppMatchWinPct: 0,
            oppMatchPoints: [],
            solkoff: 0,
            cutOne: 0,
            median: 0,
            neustadtl: 0,
            cumulative: 0,
            oppCumulative: 0
        }
    }
}

module.exports = Player;
