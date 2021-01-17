'use strict';

const Match = require("./Match");
const Player = require("./Player");
const Utilities = require("../lib/Utilities");
const Algorithms = require("../lib/Algorithms");
const Tiebreakers = require("../lib/Tiebreakers");

/** Class representing a tournament. */
class Tournament {
    /**
     * Create a new tournament.
     * @param {String} id String to be the event ID.
     * @param {Object} options Options that can be defined for a tournament.
     */
    constructor(id, options) {
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
         * @type {('elim'|'robin'|'swiss')}
         * @default 'elim'
         */
        this.format = options.hasOwnProperty('format') && ['elim', 'robin', 'swiss'].includes(options.format) ? options.format : 'elim';

        /**
         * If there is a third place consolation match.
         * Only used if single elimination is the format (or playoffs format).
         * @type {Boolean}
         * @default false
         */
        this.thirdPlaceMatch = (options.format === 'elim' || options.playoffs === 'elim') && options.hasOwnProperty('thirdPlaceMatch') && options.thirdPlaceMatch ? true : false;

        /**
         * Maximum number of players allowed to register for the tournament (minimum 4).
         * If null, there is no maximum.
         * @type {?Number}
         * @default null
         */
        this.maxPlayers = options.hasOwnProperty('maxPlayers') && Number.isInteger(options.maxPlayers) && options.maxPlayers >= 4 ? options.maxPlayers : null;

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
         * Creation date and time of the tournament.
         * @type {Date}
         */
        this.startTime = new Date(Date.now());

        /**
         * Array of all players in the tournament.
         * @type {Player[]}
         * @default []
         */
        this.players = [];

        /**
         * Array of all matches in the tournament.
         * @type {Match[]}
         * @default []
         */
        this.matches = [];

        /**
         * If the tournament is active.
         * @type {Boolean}
         * @default false
         */
        this.active = false;
    }

    /**
     * Create a new player and add them to the tournament.
     * @param {String} alias The name of the new player.
     * @param {String} id The ID of the new player. If null, one will be randomly generated.
     * @param {Number} seed The seed value of the player. Mandatory if seededPlayers is true.
     * @returns {Boolean} If the player was created and added.
     */
    addPlayer(alias, id = null, seed = null) {
        if (this.players.length === this.maxPlayers) return false;
        if (typeof alias !== 'string' || alias.length === 0) return false;
        let playerID;
        if (id === null) {
            do {
                playerID = Utilities.randomString(8);
            } while (this.players.findIndex(p => p.id === playerID) > -1);
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
                    if (this.format.includes('elim')) {
                        const m = this.activeMatches().find(x => x.playerOne.id === player.id || x.playerTwo.id === player.id);
                        m.playerOne.id === player.id ? this.result(m, 0, 2) : this.result(m, 2, 0);
                    } else if (this.format === 'robin') {
                        const now = this.activeMatches(this.currentRound).find(x => x.playerOne.id === player.id || x.playerTwo.id === player.id);
                        if (now !== undefined && now.active) now.playerOne.id === player.id ? this.result(now, 0, 2) : this.result(now, 2, 0);
                        for (let i = this.currentRound + 1; i < this.rounds.length; i++) {
                            const curr = this.rounds.find(r => r.round === i).find(x => x.playerOne.id === player.id || x.playerTwo.id === player.id);
                            if (curr.playerOne.id === player.id) curr.playerOne = null;
                            else curr.playerTwo = null;
                        }
                    }
                    return true;
                }
            }
        } else return false;
    }

    /**
     * Get the active matches in the tournament.
     * If no round is specified, it returns all active matches for all rounds.
     * @param {?Number} round Optional round selector.
     * @return {Match[]}
     */
    activeMatches(round = null) {
        return round === null ? this.matches.filter(m => m.active) : this.matches.filter(r => r.round === round).filter(m => m.active);
    }

    /**
     * Get the current standings of the tournament.
     * @param {Boolean} [active=true] Filtering only active players.
     * @return {Player[]}
     */
    standings(active = true) {
        this.players.forEach(p => Tiebreakers.compute(p, this.winValue, this.lossValue, this.drawValue));
        let thesePlayers = active ? this.players.filter(p => p.active) : [...this.players];
        thesePlayers.sort((a, b) => {
            for (let i = 0; i < this.tiebreakers.length; i++) {
                const prop = this.tiebreakers[i].replace('-', '');
                const eqCheck = Tiebreakers[prop].equal(a, b);
                if (eqCheck === true) {
                    if (i === this.tiebreakers.length - 1) return Math.random() * 2 - 1;
                    else continue;
                } else if (typeof eqCheck === 'number') return Tiebreakers[prop].diff(a, b, eqCheck);
                else return Tiebreakers[prop].diff(a, b);
            }
        });
        return thesePlayers;
    }
}

/** 
 * Class representing a Swiss pairing tournament. 
 * @extends Tournament
 */
class Swiss extends Tournament {
    /**
     * Create a new Swiss pairing tournament.
     * @param {String} id String to be the event ID.
     * @param {Object} [options={}] Options that can be defined for a tournament.
     */
    constructor(id, options = {}) {
        super(id, options);

        /**
         * Number of rounds for the first phase of the tournament.
         * If null, the value is determined by the number of players and the format.
         * @type {?Number}
         * @default null
         */
        this.numberOfRounds = options.hasOwnProperty('numberOfRounds') && Number.isInteger(options.numberOfRounds) && options.numberOfRounds > 0 ? options.numberOfRounds : null;

        /**
         * Format for the second stage of the tournament.
         * If null, there is only one stage.
         * @type {?('elim'|'2xelim')}
         * @default null
         */
        this.playoffs = options.hasOwnProperty('playoffs') && ['elim', '2xelim'].includes(options.playoffs) ? options.playoffs : null;

        /**
         * Number of possible games for a match, where the winner must win the majority of games up to 1 + x/2 (used for byes).
         * @type {Number}
         * @default 1
         */
        this.bestOf = options.hasOwnProperty('bestOf') && Number.isInteger(options.bestOf) && options.bestOf % 2 === 1 ? options.bestOf : 1;

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

        const tiebreakerOptions = ['buchholz-cut1', 'solkoff', 'median-buchholz', 'sonneborn-berger', 'cumulative', 'versus', 'magic-tcg', 'pokemon-tcg'];
        /**
         * Array of tiebreakers to use, in order of precedence.
         * Options include: buchholz-cut1, solkoff, median-buchholz, sonneborn-berger, cumulative, versus, magic-tcg, pokemon-tcg.
         * Defaults for Swiss and Dutch are solkoff and cumulative.
         * @type {String[]}
         * @default null
         */
        this.tiebreakers = options.hasOwnProperty('tiebreakers') && Array.isArray(options.tiebreakers) ? options.tiebreakers.filter(t => tiebreakerOptions.includes(t)) : null;

        // Validating tiebreakers.
        if (this.tiebreakers === null || this.tiebreakers.length === 0) this.tiebreakers = ['solkoff', 'cumulative'];
        this.tiebreakers.unshift('match-points');

        /**
         * If the Dutch variant of Swiss pairings should be used.
         * @type {Boolean}
         * @default false
         */
        this.dutch = options.hasOwnProperty('dutch') && typeof options.dutch === 'boolean' ? options.dutch : false;

        /**
         * Current round number.
         * 0 if the tournament has not started, -1 if the tournament is finished.
         * @type {Number}
         * @default 0
         */
        this.currentRound = 0;
    }
    
    /**
     * Starts the tournament.
     */
    startEvent() {
        if (this.numberOfRounds === null) this.numberOfRounds = Math.ceil(Math.log2(this.players.length));
        this.currentRound++;
        if (this.dutch) this.matches = this.matches.concat(Algorithms.dutch(this.matches, this.players, this.currentRound, 0));
        else this.matches = this.matches.concat(Algorithms.swiss(this.matches, this.players, this.currentRound, 0, this.seededPlayers));
        const bye = this.matches.filter(r => r.round === this.currentRound).find(m => m.playerTwo === null);
        if (bye !== undefined) this.result(bye, this.bestOf, 0);
    }

    /**
     * Storing results of a match.
     * @param {Match} match The match being reported.
     * @param {Number} playerOneWins Number of wins for player one.
     * @param {Number} playerTwoWins Number of wins for player two.
     * @param {Number} [draws=0] Number of draws.
     */
    result(match, playerOneWins, playerTwoWins, draws = 0) {
        if (!match.active && match.playerOne !== null && match.playerTwo !== null) {
            match.resetResults(this.winValue, this.lossValue, this.drawValue);
            match.playerOneWins = 0;
            match.playerTwoWins = 0;
            match.draws = 0;
        }
        match.playerOneWins = playerOneWins;
        if (match.playerTwo === null) {
            match.assignBye(1, this.winValue);
            return;
        }
        match.playerTwoWins = playerTwoWins;
        match.draws = draws;
        match.active = false;
        match.resultForPlayers(this.winValue, this.lossValue, this.drawValue);
        const active = this.activeMatches();
        if (active.length === 0) {
            if (this.currentRound === this.numberOfRounds && this.playoffs !== null) {
                if (this.cutType === 'rank' && this.cutLimit > 0) {
                    const rankedPlayers = this.standings();
                    for (let i = this.cutLimit; i < rankedPlayers.length; i++) rankedPlayers[i].active = false;
                } else if (this.cutType === 'points' && this.cutLimit > 0) this.players.filter(p => p.matchPoints < this.cutLimit).forEach(p => p.active = false);
                this.currentRound++;
                if (this.playoffs === 'elim') Algorithms.elim(this.matches, this.players.filter(p => p.active), this.thirdPlaceMatch, this.currentRound);
                else Algorithms.doubleElim(this.matches, this.players.filter(p => p.active), this.currentRound);
            } else {
                this.currentRound++;
                if (this.dutch) this.matches = this.matches.concat(Algorithms.dutch(this.matches, this.players, this.currentRound, this.winValue * this.currentRound));
                else this.matches = this.matches.concat(Algorithms.swiss(this.matches, this.players, this.currentRound, this.winValue * this.currentRound, this.seededPlayers));
                const bye = this.matches.filter(r => r.round === this.currentRound).find(m => m.playerTwo === null);
                if (bye !== undefined) this.result(bye, this.bestOf, 0);
            }
        }
        this.players.forEach(p => Tiebreakers.compute(p, this.winValue, this.lossValue, this.drawValue));
    }
}

/** 
 * Class representing a round-robin pairing tournament. 
 * @extends Tournament
 */
class RoundRobin extends Tournament {
    /**
     * Create a new round-robin pairing tournament.
     * @param {String} id String to be the event ID.
     * @param {Object} [options={}] Options that can be defined for a tournament.
     */
    constructor(id, options = {}) {
        super(id, options);

        /**
         * Format for the second stage of the tournament.
         * If null, there is only one stage.
         * @type {?('elim'|'2xelim')}
         * @default null
         */
        this.playoffs = options.hasOwnProperty('playoffs') && ['elim', '2xelim'].includes(options.playoffs) ? options.playoffs : null;

        /**
         * Number of possible games for a match, where the winner must win the majority of games up to 1 + x/2 (used for byes).
         * @type {Number}
         * @default 1
         */
        this.bestOf = options.hasOwnProperty('bestOf') && Number.isInteger(options.bestOf) && options.bestOf % 2 === 1 ? options.bestOf : 1;

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
         * Either the maximum size of each group, or the number of groups (minimum 2).
         * If null, there are no groups.
         * @type {?Number}
         * @default null
         */
        this.groupNumber = options.hasOwnProperty('groupNumber') && Number.isInteger(options.groupNumber) && options.groupNumber >= 2 ? options.groupNumber : null;

        /**
         * Whether to institute the cut limit for each group.
         * @type {Boolean}
         * @default false
         */
        this.cutEachGroup = options.hasOwnProperty('cutEachGroup') && typeof options.cutEachGroup === 'boolean' ? options.cutEachGroup : false;

        const tiebreakerOptions = ['buchholz-cut1', 'solkoff', 'median-buchholz', 'sonneborn-berger', 'cumulative', 'versus', 'magic-tcg', 'pokemon-tcg'];
        /**
         * Array of tiebreakers to use, in order of precedence.
         * Options include: buchholz-cut1, solkoff, median-buchholz, sonneborn-berger, cumulative, versus, magic-tcg, pokemon-tcg.
         * Defaults for round-robin are sonneborn-berger and versus.
         * @type {String[]}
         * @default null
         */
        this.tiebreakers = options.hasOwnProperty('tiebreakers') && Array.isArray(options.tiebreakers) ? options.tiebreakers.filter(t => tiebreakerOptions.includes(t)) : null;

        // Validating tiebreakers.
        if (this.tiebreakers === null || this.tiebreakers.length === 0) this.tiebreakers = ['sonneborn-berger', 'versus'];
        this.tiebreakers.unshift('match-points');

        /**
         * If the format is double round-robin.
         * @type {Boolean}
         * @default false
         */
        this.doubleRR = options.hasOwnProperty('doubleRR') && typeof options.doubleRR === 'boolean' ? options.doubleRR : false;

        /**
         * Array of groups of players.
         * @type {Array[]}
         * @default []
         */
        this.groups = [];

        /**
         * Current round number.
         * 0 if the tournament has not started, -1 if the tournament is finished.
         * @type {Number}
         * @default 0
         */
        this.currentRound = 0;
    }

    /**
     * Starts the tournament.
     */
    startEvent() {
        if (this.seededPlayers) this.players.sort((a, b) => this.seedOrder === 'asc' ? a.seed - b.seed : b.seed - a.seed);
        else Utilities.shuffle(this.players);
        if (typeof this.groupNumber === 'number') {
            const numberOfGroups = Math.ceil(this.players.length / this.groupNumber);
            let j = 0;
            let k = 0;
            for (let i = 0; i < numberOfGroups; i++) {
                if (j < numberOfGroups - (this.groupNumber * numberOfGroups - this.players.length)) {
                    const a = [];
                    for (let l = 0; l < this.groupNumber; l++) {
                        a.push(this.players[k]);
                        k++;
                    }
                    this.groups.push(a);
                    j++;
                } else if (j < numberOfGroups) {
                    const a = [];
                    for (let l = 0; l < this.groupNumber - 1; l++) {
                        a.push(this.players[k]);
                        k++;
                    }
                    this.groups.push(a);
                    j++;
                }
            }
            this.matches = Algorithms.robin(this.groups, true, this.doubleRR);
        } else this.matches = Algorithms.robin(this.players, false, this.doubleRR);
        this.currentRound++;
        const byes = this.matches.filter(r => r.round === this.currentRound && (m => m.playerOne === null || m.playerTwo === null));
        byes.forEach(b => b.playerOne === null ? this.result(b, 0, Math.ceil(this.bestOf / 2)) : this.result(b, Math.ceil(this.bestOf / 2), 0));
    }

    /**
     * Storing results of a match.
     * @param {Match} match The match being reported.
     * @param {Number} playerOneWins Number of wins for player one.
     * @param {Number} playerTwoWins Number of wins for player two.
     * @param {Number} [draws=0] Number of draws.
     */
    result(match, playerOneWins, playerTwoWins, draws = 0) {
        if (!match.active && match.playerOne !== null && match.playerTwo !== null) {
            match.resetResults(this.winValue, this.lossValue, this.drawValue);
            match.playerOneWins = 0;
            match.playerTwoWins = 0;
            match.draws = 0;
        }
        if (match.playerOne === null) {
            match.assignBye(2, this.winValue);
            return;
        }
        match.playerOneWins = playerOneWins;
        if (match.playerTwo === null) {
            match.assignBye(1, this.winValue);
            return;
        }
        match.playerTwoWins = playerTwoWins;
        match.draws = draws;
        match.active = false;
        match.resultForPlayers(this.winValue, this.lossValue, this.drawValue);
        const active = this.activeMatches();
        if (active.length === 0) {
            if (this.currentRound === this.matches.reduce((x, y) => Math.max(x, y.round), 0) && this.playoffs !== null) {
                if (this.cutType === 'rank' && this.cutLimit > 0) {
                    const rankedPlayers = this.standings();
                    for (let i = this.cutLimit; i < rankedPlayers.length; i++) rankedPlayers[i].active = false;
                } else if (this.cutType === 'points' && this.cutLimit > 0) this.players.filter(p => p.matchPoints < this.cutLimit).forEach(p => p.active = false);
                this.currentRound++;
                if (this.playoffs === 'elim') Algorithms.elim(this.matches, this.players.filter(p => p.active), this.thirdPlaceMatch, this.currentRound);
                else Algorithms.doubleElim(this.matches, this.players.filter(p => p.active), this.currentRound);
            } else {
                this.currentRound++;
                const nextRound = this.matches.filter(p => p.round === this.currentRound);
                nextRound.forEach(m => {
                    if (m.playerOne !== null && m.playerTwo !== null) m.active === true;
                });
                const byes = nextRound.filter(m => m.playerOne === null || m.playerTwo === null);
                byes.forEach(b => b.playerOne === null ? this.result(b, 0, Math.ceil(this.bestOf / 2)) : this.result(b, Math.ceil(this.bestOf / 2), 0));
            }
        }
        this.players.forEach(p => Tiebreakers.compute(p, this.winValue, this.lossValue, this.drawValue));
    }
}

/** 
 * Class representing an elimination tournament. 
 * @extends Tournament
 */
class Elimination extends Tournament {
    /**
     * Create a new elimination tournament.
     * @param {String} id String to be the event ID.
     * @param {Object} [options={}] Options that can be defined for a tournament.
     */
    constructor(id, options = {}) {
        super(id, options);
        
        /**
         * If the format is double elimination.
         * @type {Boolean}
         * @default false
         */
        this.doubleElim = options.hasOwnProperty('doubleElim') && typeof options.doubleElim === 'boolean' ? options.doubleElim : false;
    }

    /**
     * Starts the tournament.
     */
    startEvent() {
        this.active = true;
        if (this.seededPlayers) this.players.sort((a, b) => this.seedOrder === 'asc' ? a.seed - b.seed : b.seed - a.seed);
        else Utilities.shuffle(this.players);
        this.doubleElim ? Algorithms.doubleElim(this.matches, this.players) : Algorithms.elim(this.matches, this.players, this.thirdPlaceMatch);
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
        match.playerTwoWins = playerTwoWins;
        match.draws = draws;
        match.active = false;
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
        if (match.loserPath === null) {
            if (playerOneWins > playerTwoWins) this.removePlayer(match.playerTwo);
            else if (playerTwoWins > playerOneWins) this.removePlayer(match.playerOne);
        }
    }
}

module.exports = {
    Tournament,
    Swiss,
    RoundRobin,
    Elimination
}
