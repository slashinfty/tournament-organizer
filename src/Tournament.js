'use strict';

const Player = require("./Player");
const Pairings = require("./Pairings");

/** Class representing a tournament. */
class Tournament {
    /**
     * Create a new tournament.
     * @param {String} id String to be the event ID.
     * @param {Object} [options={}] Options that can be defined for a tournament.
     * @param {?String} [options.name=null] Name of the tournament.
     * @param {?Number} [options.numberOfRounds=null] Set number of rounds.
     * @param {Boolean} [options.seededPlayers=false] If players are seeded.
     * @param {('asc'|'des')} [options.seedOrder='asc'] Order of the seeding.
     * @param {('elim'|'2xelim'|'robin'|'2xrobin'|'swiss')} [options.firstFormat='elim'] Format for first stage.
     * @param {?('elim'|'2xelim')} [options.secondFormat=null] Format for second stage.
     * @param {Boolean} [options.thirdPlaceMatch=false] If there's a 3rd place match in elimination.
     * @param {?Number} [options.maxPlayers=null] If there's a maximum number of players.
     * @param {('rank'|'score')} [options.cutType='rank'] How to cut off players between stages.
     * @param {Number} [options.cutLimit=0] The cutoff limit.
     * @param {Number} [options.bestOf=1] Number of games in a match.
     * @param {Number} [options.winValue=1] Value of a win.
     * @param {Number} [options.drawValue=0.5] Value of a draw/tie.
     * @param {Number} [options.lossValue=0] Value of a loss.
     * @param {?String[]} [tiebreakers=null] Array of tiebreakers to use in round-robin and swiss formats.
     */
    constructor(id, options = {}, tiebreakers = null) {
        /**
         * Alphanumeric string ID.
         * @type {String}
         */
        this.eventID = id;

        /**
         * Name of the tournament.
         * @type {?String}
         * @default null
         */
        this.name = options.hasOwnProperty('name') && typeof options.name === 'string' ? options.name : null;

        /**
         * Number of rounds for the first phase of the tournament.
         * If null, the value is determined by the number of players and the format.
         * @type {?Number}
         * @default null
         */
        this.numberOfRounds = options.hasOwnProperty('numberOfRounds') && Number.isInteger(options.numberOfRounds) && options.numberOfRounds > 0 ? options.numberOfRounds : null;

        /**
         * Whether or not to organize players by seed when pairing.
         * @type {Boolean}
         * @default false
         */
        this.seededPlayers = options.hasOwnProperty('seededPlayers') && typeof options.seededPlayers === 'boolean' ? options.seededPlayers : false;

        /**
         * If the seeding should be sorted in ascending or descending order.
         * @type {('asc'|'des')}
         * @default 'asc'
         */
        this.seedOrder = options.hasOwnProperty('seedOrder') && options.seedOrder === 'des' ? 'des' : 'asc';

        /**
         * Format for the first stage of the tournament.
         * @type {('elim'|'2xelim'|'robin'|'2xrobin'|'swiss')}
         * @default 'elim'
         */
        this.mainFormat = options.hasOwnProperty('mainFormat') && ['elim', '2xelim', 'robin', '2xrobin', 'swiss'].includes(options.mainFormat) ? options.mainFormat : 'elim';

        /**
         * Format for the second stage of the tournament.
         * If null, there is only one stage.
         * @type {?('elim'|'2xelim')}
         * @default null
         */
        this.playoffFormat = options.hasOwnProperty('playoffFormat') && ['elim', '2xelim'].includes(options.playoffFormat) ? options.playoffFormat : null;

        /**
         * If there is a third place consolation match in the second stage of the tournament.
         * @type {Boolean}
         * @default false
         */
        this.thirdPlaceMatch = options.hasOwnProperty('thirdPlaceMatch') && options.thirdPlaceMatch ? true : false;

        /**
         * Maximum number of players allowed to register for the tournament (minimum 4).
         * If null, there is no maximum.
         * @type {?Number}
         * @default null
         */
        this.maxPlayers = options.hasOwnProperty('maxPlayers') && Number.isInteger(options.maxPlayers) && options.maxPlayers >= 4 ? options.maxPlayers : null;

        /**
         * Method to determine which players advance to the second stage of the tournament.
         * @type {('rank'|'points')}
         * @default 'rank'
         */
        this.cutType = options.hasOwnProperty('cutType') && options.cutType === 'points' ? 'points' : 'rank';

        /**
         * Breakpoint for determining how many players advance to the second stage of the tournament.
         * If 0, it will override the playoff format to null.
         * If -1, all players will advance.
         * @type {Number}
         * @default 0
         */
        this.cutLimit = options.hasOwnProperty('cutLimit') && Number.isInteger(options.cutLimit) && options.cutLimit >= -1 ? options.cutLimit : 0;
        if (this.cutLimit === 0) this.playoffFormat = null;

        /**
         * The number of games in a match, where the winner must win a majority of games up to (n + 1) / 2.
         * Must be an odd number.
         * @type {Number}
         * @default 1
         */
        this.bestOf = options.hasOwnProperty('bestOf') && Number.isInteger(options.bestOf) && options.bestOf >= 1 && options.bestOf % 2 === 1 ? options.bestOf : 1;

        /**
         * The value of a win.
         * Must be a positive integer.
         * @type {Number}
         * @default 1
         */
        this.winValue = options.hasOwnProperty('winValue') && Number.isInteger(options.winValue) && options.winValue > 0 ? options.winValue : 1;

        /**
         * The value of a draw/tie.
         * Must be 0 or greater.
         * @type {Number}
         * @default 0.5
         */
        this.drawValue = options.hasOwnProperty('drawValue') && typeof options.drawValue === 'number' && options.drawValue >= 0 ? options.drawValue : 0.5;

        /**
         * The value of a loss.
         * Must be an integer.
         * @type {Number}
         * @default 0
         */
        this.lossValue = options.hasOwnProperty('lossValue') && Number.isInteger(options.lossValue) ? options.lossValue : 0;

        /**
         * Array of tiebreakers to use in round-robin and swiss formats, in order of precedence.
         * Options include: buchholz-cut1, solkoff, median-buchholz, sonneborn-berger, baumbach, cumulative, versus, magic-tcg, pokemon-tcg.
         * Defaults for swiss are solkoff and cumulative.
         * Defaults for round-robin are sonneborn-berger and versus.
         * @type {String[]}
         * @default null
         */
        this.tiebreakers = tiebreakers;
        const tiebreakerOptions = ['buchholz-cut1', 'solkoff', 'median-buchholz', 'sonneborn-berger', 'baumbach', 'cumulative', 'versus', 'magic-tcg', 'pokemon-tcg'];
        if (this.tiebreakers === null) {
            if (this.mainFormat === 'swiss') this.tiebreakers = ['solkoff', 'cumulative'];
            else if (this.mainFormat === 'robin' || this.mainFormat === '2xrobin') this.tiebreakers = ['sonneborn-berger', 'versus'];
        } else {
            if (this.mainFormat === 'swiss' || this.mainFormat === 'robin' || this.mainFormat === '2xrobin') {
                const filtered = this.tiebreakers.filter(t => tiebreakerOptions.includes(t));
                if (filtered === []) {
                    if (this.mainFormat === 'swiss') this.tiebreakers = ['solkoff', 'cumulative'];
                    else if (this.mainFormat === 'robin' || this.mainFormat === '2xrobin') this.tiebreakers = ['sonneborn-berger', 'versus'];
                } else this.tiebreakers = filtered;
            }
        }

        /**
         * Creation date and time of the tournament.
         * @type {Date}
         */
        this.startTime = new Date(Date.now());

        /**
         * Array of all players in the tournament.
         * @type {Player[]}
         */
        this.players = [];

        /**
         * Array of all pairings in the tournament.
         * @type {Pairings[]}
         */
        this.rounds = [];

        /**
         * Current round number (0 if the tournament has not started, -1 if the tournament is finished).
         * @type {Number}
         */
        this.currentRound = 0;
    }

    /**
     * Create a new player and add them to the tournament.
     * @param {String} alias The name of the new player.
     * @param {String} id The ID of the new player. If null, one will be randomly generated.
     * @param {Number} seed The seed value of the player. Mandatory if seededPlayers is true.
     * @returns {Boolean} If the player was created and added.
     */
    addPlayer(alias, id, seed = null) {
        if (this.players.length === this.maxPlayers) return false;
        if (typeof alias !== 'string' || alias.length === 0) return false;
        let playerID;
        if (id === null) {
            playerID = Util.randomString(8);
            while (this.players.findIndex(p => p.id === playerID) > -1) {
                playerID = Util.randomString(16);
            }
        } else {
            if (this.players.findIndex(p => p.id === id) > -1) return false;
            else playerID = id;
        }
        if (seed === null && this.seededPlayers) return false;
        this.players.push(new Player(alias, playerID, seed));
        return true;
    }

    /**
     * Remove a player from the tournament.
     * If the tournament hasn't started, they are removed entirely.
     * If the tournament has started, they are dropped and marked inactive.
     * @param {String} id The ID of the player.
     * @returns {Boolean} If the player was removed or dropped.
     */
    removePlayer(id) {
        const playerIndex = this.players.findIndex(p => p.id === id);
        if (playerIndex > -1) {
            if (this.currentRound === 0) {
                this.players.splice(playerIndex, 1);
                return true;
            } else {
                const player = this.players.find(p => p.id === id);
                if (!player.active) return false;
                else {
                    player.active = false;
                    player.dropped = this.currentRound;
                    return true;
                }
            }
        } else return false;
    }

    // start event
    /**
     * Start the tournament.
     */
    start() {
        if (this.mainFormat === 'elim') {
            
        }
    }

    // get active matches

    // report results

    // get standings - tiebreakers in lib
}

module.exports = Tournament;
