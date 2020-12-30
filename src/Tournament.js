'use strict';

const Match = require("./Match");
const Player = require("./Player");
const Pairings = require("./Pairings");
const Utilities = require("../lib/Utilities");
const Algorithms = require("../lib/Algorithms");

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
     * @param {('elim'|'2xelim'|'robin'|'2xrobin'|'swiss')} [options.format='elim'] Format for first stage.
     * @param {?('elim'|'2xelim')} [options.playoffs=null] Format for second stage.
     * @param {Boolean} [options.thirdPlaceMatch=false] If there's a 3rd place match in elimination.
     * @param {Number} [options.bestOf=1] Number of possible games for a match.
     * @param {?Number} [options.maxPlayers=null] If there's a maximum number of players.
     * @param {('rank'|'score')} [options.cutType='rank'] How to cut off players between stages.
     * @param {Number} [options.cutLimit=0] The cutoff limit.
     * @param {Number} [options.winValue=1] Value of a win.
     * @param {Number} [options.drawValue=0.5] Value of a draw/tie.
     * @param {Number} [options.lossValue=0] Value of a loss.
     * @param {?String[]} [options.tiebreakers=null] Array of tiebreakers to use in round-robin and swiss formats.
     */
    constructor(id, options = {}) {
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
        this.format = options.hasOwnProperty('format') && ['elim', '2xelim', 'robin', '2xrobin', 'swiss'].includes(options.format) ? options.format : 'elim';

        /**
         * Format for the second stage of the tournament.
         * If null, there is only one stage.
         * @type {?('elim'|'2xelim')}
         * @default null
         */
        this.playoffs = options.hasOwnProperty('playoffs') && ['elim', '2xelim'].includes(options.playoffs) ? options.playoffs : null;

        /**
         * If there is a third place consolation match in the second stage of the tournament.
         * @type {Boolean}
         * @default false
         */
        this.thirdPlaceMatch = options.hasOwnProperty('thirdPlaceMatch') && options.thirdPlaceMatch ? true : false;

        /**
         * Number of possible games for a match, where the winner must win the majority of games up to 1 + x/2.
         * Used for byes in Swiss and round-robin formats.
         * @type {Number}
         * @default 1
         */
        this.bestOf = options.hasOwnProperty('bestOf') && Number.isInteger(options.bestOf) && options.bestOf % 2 === 1 ? options.bestOf : 1;

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
        if (this.cutLimit === 0) this.playoffs = null;

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

        const tiebreakerOptions = ['buchholz-cut1', 'solkoff', 'median-buchholz', 'sonneborn-berger', 'baumbach', 'cumulative', 'versus', 'magic-tcg', 'pokemon-tcg'];
        /**
         * Array of tiebreakers to use in round-robin and swiss formats, in order of precedence.
         * Options include: buchholz-cut1, solkoff, median-buchholz, sonneborn-berger, baumbach, cumulative, versus, magic-tcg, pokemon-tcg.
         * Defaults for swiss are solkoff and cumulative.
         * Defaults for round-robin are sonneborn-berger and versus.
         * @type {String[]}
         * @default null
         */
        this.tiebreakers = options.hasOwnProperty('tiebreakers') && Array.isArray(options.tiebreakers) ? options.tiebreakers.filter(t => tiebreakerOptions.includes(t)) : null;

        // Validating tiebreakers.
        if (this.tiebreakers === null || this.tiebreakers.length === 0) {
            if (this.format === 'swiss') this.tiebreakers = ['solkoff', 'cumulative'];
            else if (this.format.includes('robin')) this.tiebreakers = ['sonneborn-berger', 'versus'];
            else this.tiebreakers = null;
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
         * If the tournament is active.
         * @type {Boolean}
         * @default false
         */
        this.active = false;

        /**
         * Current round number, used by round-robin and Swiss tournaments.
         * 0 if the tournament has not started, -1 if the tournament is finished.
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
            playerID = Utilities.randomString(8);
            while (this.players.findIndex(p => p.id === playerID) > -1) {
                playerID = Utilities.randomString(16);
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
     * @param {Player} player The player to be removed.
     * @returns {Boolean} If the player was removed or dropped.
     */
    removePlayer(player) {
        const playerIndex = this.players.findIndex(p => p.id === player.id);
        if (playerIndex > -1) {
            if (!this.active) {
                this.players.splice(playerIndex, 1);
                return true;
            } else {
                if (!player.active) return false;
                else {
                    player.active = false;
                    return true;
                }
            }
        } else return false;
    }

    /**
     * Start the tournament.
     */
    startEvent() {
        this.active = true;
        if (this.format === 'elim') {
            if (this.seededPlayers) this.players.sort((a, b) => this.seedOrder === 'asc' ? a.seed - b.seed : b.seed - a.seed);
            else Utilities.shuffle(this.players);
            this.rounds = Algorithms.elim(this.players, this.thirdPlaceMatch);
        } else if (this.format === '2xelim') {
            if (this.seededPlayers) this.players.sort((a, b) => this.seedOrder === 'asc' ? a.seed - b.seed : b.seed - a.seed);
            else Utilities.shuffle(this.players);
            this.rounds = Algorithms.doubleElim(this.players);
        } else if (this.format === 'robin') {

        } else if (this.format === '2xrobin') {

        } else if (this.format === 'swiss') {
            if (this.numberOfRounds === null) this.numberOfRounds = Math.ceil(Math.log2(this.players.length));
            this.currentRound++;
            this.rounds.push(Algorithms.swiss(this.players, this.currentRound, 0, this.seededPlayers));
            const bye = this.rounds.find(r => r.round === this.currentRound).matches.find(m => m.playerTwo === null);
            if (bye !== undefined) this.result(bye, this.bestOf, 0);
        }
    }

    /**
     * Get the active matches in the tournament.
     * If no round is specified, it returns all active matches for all rounds.
     * @param {?Number} round Optional round selector.
     * @return {Match[]}
     */
    getActiveMatches(round = null) {
        let a = [];
        if (round !== null) a = this.rounds.find(p => p.round === round).matches.filter(m => m.active);
        else {
            this.rounds.forEach(p => {
                const m = p.matches.filter(m => m.active);
                a = a.concat(m);
            });
        }
        return a;
    }

    /**
     * Storing results of a match.
     * @param {Match} match The match being reported.
     * @param {Number} playerOneWins Number of wins for player one.
     * @param {Number} playerTwoWins Number of wins for player two.
     * @param {Number} [draws=0] Number of draws.
     */
    result(match, playerOneWins, playerTwoWins, draws = 0) {
        match.playerOneWins = playerOneWins;
        match.active = false;
        if (match.playerTwo === null) {
            match.assignBye(this.winValue);
            return;
        }
        match.playerTwoWins = playerTwoWins;
        match.draws = draws;
        match.resultForPlayers(this.winValue, this.lossValue, this.drawValue);
        if (match.winnerPath !== null) {
            if (match.winnerPath.playerOne === null) match.winnerPath.playerOne = playerOneWins >= playerTwoWins ? match.playerOne : match.playerTwo;
            else if (match.winnerPath.playerTwo === null) match.winnerPath.playerTwo = playerOneWins >= playerTwoWins ? match.playerOne : match.playerTwo;
            if (match.winnerPath.playerOne !== null && match.winnerPath.playerTwo !== null) match.winnerPath.active = true;
        }
        if (match.loserPath !== null) {
            if (match.loserPath.playerOne === null) match.loserPath.playerOne = playerOneWins < playerTwoWins ? match.playerOne : match.playerTwo;
            else if (match.loserPath.playerTwo === null) match.loserPath.playerTwo = playerOneWins < playerTwoWins ? match.playerOne : match.playerTwo;
            if (match.loserPath.playerOne !== null && match.loserPath.playerTwo !== null) match.loserPath.active = true;
        }
        if (match.loserPath === null && this.format.includes('elim')) {
            if (playerOneWins > playerTwoWins) this.removePlayer(match.playerTwo);
            else if (playerTwoWins > playerOneWins) this.removePlayer(match.playerOne);
        }
        if (this.format === 'swiss') {
            const active = this.getActiveMatches();
            if (active.length === 0) { // check to see if moving to playoffs
                this.currentRound++;
                this.rounds.push(Algorithms.swiss(this.players, this.currentRound, this.winValue * this.currentRound, this.seededPlayers));
                const bye = this.rounds.find(r => r.round === this.currentRound).matches.find(m => m.playerTwo === null);
                if (bye !== undefined) this.result(bye, this.bestOf, 0);
            }
        }
        // If Swiss or round-robin, compute tiebreakers
    }

    // get standings - tiebreakers in lib
}

module.exports = Tournament;
