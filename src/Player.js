'use strict';

/** Class representing a player. */
class Player {
    /**
     * Create a new player.
     * @param {String|Object} alias String to be the player's name. If an object, it is a player being reclassed.
     * @param {String} id String to be the player ID.
     * @param {?Number} seed Number to be used as the seed.
     */
    constructor(alias, id, seed) {
        if (arguments.length === 1) {
            Object.assign(this, arguments[0]);
        } else {
        
            /**
             * Name of the player.
             * @type {String}
             */
            this.alias = alias.toString();

            /**
             * Alphanumeric string ID.
             * @type {String}
             */
            this.id = id.toString();

            /**
             * Value to sort players.
             * @type {?Number}
             */
            this.seed = typeof seed === 'number' ? seed : null;

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
             * Number of initial byes assigned.
             * @type {Number}
             */
            this.initialByes = 0;

            /**
             * Number of byes assigned.
             * @type {Number}
             */
            this.byes = 0;

            /**
             * Array of results. Objects include match ID, opponent ID, and result ('w', 'l', or 'd').
             * @type {Object[]}
             */
            this.results = [];

            /**
             * Color preference for chess tournaments.
             * Add 1 for white (player one) and subtract 1 for black (player two).
             * @type {Number}
             */
            this.colorPref = 0;

            /**
             * Array of colors that player has played in a chess tournament.
             * @type {String[]}
             */
            this.colors = [];

            /**
             * If the player is still in the tournament.
             * @type {Boolean}
             */
            this.active = true;

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
                solkoff: 0,
                cutOne: 0,
                median: 0,
                neustadtl: 0,
                cumulative: 0,
                oppCumulative: 0
            }

            /**
             * An object to store any additional information.
             * @type {Object}
             * @default {}
             */
            this.etc = {};
        }
    }
}

module.exports = Player;
