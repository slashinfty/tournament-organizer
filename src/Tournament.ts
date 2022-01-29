import cryptoRandomString from 'crypto-random-string';
import { Match } from './Match';
import { Player } from './Player';
// import * as Pairings from './Pairings';
// import * as Tiebreakers from './Tiebreakers';

interface Structure {
    id: string;
    name: string;
    format: 'Single Elimination' | 'Double Elimination' | 'Swiss' | 'Round-Robin' | 'Double Round-Robin';
    sorting: 'none' | 'ascending' | 'descending';
    consolation: boolean;
    playerLimit: number;
    pointsForWin: number;
    pointsForLoss: number;
    pointsForDraw: number;
    startTime: Date;
    players: Array<Player>;
    matches: Array<Match>;
    status: 'Registration' | 'Active' | 'Playoffs' | 'Aborted' | 'Finished';
}

/** Class representing a tournament. */
class Tournament implements Structure {
    id: string;
    name: string;
    format: 'Single Elimination' | 'Double Elimination' | 'Swiss' | 'Round-Robin' | 'Double Round-Robin';
    sorting: 'none' | 'ascending' | 'descending';
    consolation: boolean;
    playerLimit: number;
    pointsForWin: number;
    pointsForLoss: number;
    pointsForDraw: number;
    startTime: Date;
    players: Player[];
    matches: Match[];
    status: 'Registration' | 'Active' | 'Playoffs' | 'Aborted' | 'Finished';

    constructor(opt: {
        id: string,
        name: string,
        format: 'Single Elimination' | 'Double Elimination' | 'Swiss' | 'Round-Robin' | 'Double Round-Robin',
        sorting?: 'none' | 'ascending' | 'descending',
        consolation?: boolean,
        playerLimit?: number,
        pointsForWin?: number,
        pointsForLoss?: number,
        pointsForDraw?: number
    }) {
        
        // Default values
        let options = Object.assign({
            sorting: 'none',
            consolation: false,
            playerLimit: 0,
            pointsForWin: 1,
            pointsForLoss: 0,
            pointsForDraw: 0
        }, opt);
        
        /** Unique ID of the tournament. */
        this.id = options.id;

        /** Name of the tournament. */
        this.name = options.name;
        
        /** Format for the first stage of the tournament. */
        this.format = options.format;

        /** If players are sorted by a seed value, and the direction in which to sort them. */
        this.sorting = options.sorting;

        /** If there is a third place consolation match. Only used in elimination formats/playoffs. */
        this.consolation = options.consolation;

        /** Maximum number of players allowed to register for the tournament. If equal to 0, then there is no maximum. */
        this.playerLimit = options.playerLimit;

        /** Number of points assigned to a match win. */
        this.pointsForWin = options.pointsForWin;

        /** Number of points assigned to a match loss. */
        this.pointsForLoss = options.pointsForLoss;

        /** Number of points assigned to a drawn match. */
        this.pointsForDraw = options.pointsForDraw;

        /** Creation date and time of the tournament. */
        this.startTime = new Date(Date.now());

        /** Array of all players in the tournament. */
        this.players = [];

        /** Array of all matches in the tournament. */
        this.matches = [];

        /** The current status of the tournament. */
        this.status = 'Registration';
    }

    /**
     * Create a new player and add them to the tournament.
     * @param options User-defined options for a new tournament.
     * @returns If the player was created and added.
     */
    addPlayer(opt: {
        alias: string,
        id?: string,
        seed?: number,
        initialByes?: number,
        missingResults?: 'Byes' | 'Losses'
    }): boolean {

        // Times when players can not be added to the tournament
        if ((this.playerLimit > 0 && this.players.length === this.playerLimit) || 
            ['Playoffs', 'Aborted', 'Finished'].some(str => str === this.status)) {
            return false;
        }

        // Disallow duplicate players as determined by user-defined ID
        if (opt.hasOwnProperty('id') && this.players.some(player => player.id === opt.id)) {
            return false;
        }

        // Default values
        let options = Object.assign({
            id: cryptoRandomString({length: 10, type: 'alphanumeric'}),
            missingResults: 'Losses'
        }, opt);

        // No duplicate IDs
        while (this.players.some(player => player.id === opt.id)) {
            opt.id = cryptoRandomString({length: 10, type: 'alphanumeric'});
        }

        // Create new player
        const newPlayer = new Player(options);
        this.players.push(newPlayer);

        // Handling missed rounds due to tardiness
        if (this.status === 'Active') {
            //TODO
        }

        return true;
    }

    /**
     * Remove a player from the tournament.
     * If the tournament hasn't started, they are removed entirely.
     * If the tournament has started, they are dropped and marked inactive.
     * @param {Player} player The player to be removed.
     * @returns {?Match[]|Boolean} True, null, or array of new matches if player is removed, else false.
     */
    removePlayer(player) {
        if (player.id === undefined) return false;
        const playerIndex = this.players.findIndex(p => p.id === player.id);
        if (playerIndex > -1) {
            if (!this.active) {
                this.players.splice(playerIndex, 1);
                return true;
            } else {
                if (!player.active) return false;
                player.active = false;
                let newMatches = null;
                if (this.format.includes('elim') || this.currentRound > this.numberOfRounds) {
                    const m = this.activeMatches().find(x => x.playerOne.id === player.id || x.playerTwo.id === player.id);
                    if (m !== undefined) {
                        if (this.doubleElim) {
                            newMatches = m.playerOne.id === player.id ? this.result(m, 0, Math.ceil(this.bestOf / 2), 0, false) : this.result(m, Math.ceil(this.bestOf / 2), 0, 0, false);
                            m.loserPath.playerTwo = undefined;
                            if (m.loserPath.playerOne !== null) newMatches = newMatches.concat(this.result(m.loserPath, Math.ceil(this.bestOf / 2), 0));
                        }
                        else newMatches = m.playerOne.id === player.id ? this.result(m, 0, Math.ceil(this.bestOf / 2)) : this.result(m, Math.ceil(this.bestOf / 2), 0);
                    }
                } else if (this.format === 'robin') {
                    const now = this.activeMatches(this.currentRound).find(x => x.playerOne.id === player.id || x.playerTwo.id === player.id);
                    if (now !== undefined && now.active) newMatches = now.playerOne.id === player.id ? this.result(now, 0, Math.ceil(this.bestOf / 2)) : this.result(now, Math.ceil(this.bestOf / 2), 0);
                    for (let i = this.currentRound + 1; i < this.matches.reduce((x, y) => Math.max(x, y.round), 0); i++) {
                        const curr = this.matches.filter(r => r.round === i).find(x => x.playerOne.id === player.id || x.playerTwo.id === player.id);
                        if (curr.playerOne.id === player.id) curr.playerOne = null;
                        else curr.playerTwo = null;
                    }
                } else if (this.format === 'swiss') {
                    const m = this.activeMatches().find(x => x.playerOne.id === player.id || x.playerTwo.id === player.id);
                    if (m !== undefined && m.active) newMatches = m.playerOne.id === player.id ? this.result(m, 0, Math.ceil(this.bestOf / 2)) : this.result(m, Math.ceil(this.bestOf / 2), 0);
                }
                return newMatches;
            }
        } else return false;
    }

    /**
     * Deletes the results from a match.
     * If the player was dropped as a result (elimination format), they are made active again.
     * @param {Match} match Match to have results undone.
     */
    undoResults(match) {
        if (match.playerOne === null || match.playerTwo === null || match.active) return;
        match.resetResults(this.winValue, this.lossValue, this.drawValue);
        match.playerOneWins = 0;
        match.playerTwoWins = 0;
        match.draws = 0;
        match.playerOne.active = true;
        match.playerTwo.active = true;
        match.active = true;
        if (this.hasOwnProperty('nextRoundReady') && this.nextRoundReady === true) this.nextRoundReady = false;
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
        this.players.forEach(p => Tiebreakers.compute(p, this));
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

        /**
         * If the event is ready to proceed to the next round.
         * @type {Boolean}
         * @default false
         */
        this.nextRoundReady = false;
    }

    /**
     * Starts the tournament.
     */
    startEvent() {
        if (this.players.length < 2) return;
        this.active = true;
        if (this.numberOfRounds === null) this.numberOfRounds = Math.ceil(Math.log2(this.players.length));
        this.currentRound++;
        if (this.dutch) this.matches = this.matches.concat(Algorithms.dutch(this.matches, this.players, this.currentRound, 0));
        else {
            const seedPref = this.seededPlayers ? this.seedOrder : null;
            this.matches = this.matches.concat(Algorithms.swiss(this.matches, this.players, this.currentRound, 0, seedPref));
        }
        const bye = this.matches.filter(r => r.round === this.currentRound).find(m => m.playerTwo === null);
        if (bye !== undefined) this.result(bye, Math.ceil(this.bestOf / 2), 0);
    }

    /**
     * Storing results of a match.
     * @param {Match} match The match being reported.
     * @param {Number} playerOneWins Number of wins for player one.
     * @param {Number} playerTwoWins Number of wins for player two.
     * @param {Number} [draws=0] Number of draws.
     * @returns {?Match[]} Array of new matches, or null if result failed.
     */
    result(match, playerOneWins, playerTwoWins, draws = 0) {
        if (!this.active) return null;
        if (!match.active && match.playerOne !== null && match.playerTwo !== null) {
            match.resetResults(this.winValue, this.lossValue, this.drawValue);
            match.playerOneWins = 0;
            match.playerTwoWins = 0;
            match.draws = 0;
        }
        match.playerOneWins = playerOneWins;
        if (match.playerTwo === null) {
            match.assignBye(1, this.winValue);
            return null;
        }
        match.playerTwoWins = playerTwoWins;
        match.draws = draws;
        match.active = false;
        match.resultForPlayers(this.winValue, this.lossValue, this.drawValue);
        let active = this.activeMatches();
        let newMatches = [];
        if (this.currentRound > this.numberOfRounds) {
            if (match.winnerPath !== null) {
                if (match.winnerPath.playerOne === null) match.winnerPath.playerOne = playerOneWins >= playerTwoWins ? match.playerOne : match.playerTwo;
                else if (match.winnerPath.playerTwo === null) match.winnerPath.playerTwo = playerOneWins >= playerTwoWins ? match.playerOne : match.playerTwo;
                if (match.winnerPath.playerOne !== null && match.winnerPath.playerTwo !== null) {
                    match.winnerPath.active = true;
                    newMatches.push(match.winnerPath);
                }
            }
            if (match.loserPath !== null) {
                if (match.loserPath.playerOne === null) match.loserPath.playerOne = playerOneWins < playerTwoWins ? match.playerOne : match.playerTwo;
                else if (match.loserPath.playerTwo === null) match.loserPath.playerTwo = playerOneWins < playerTwoWins ? match.playerOne : match.playerTwo;
                if (match.loserPath.playerOne !== null && match.loserPath.playerTwo !== null) {
                    match.loserPath.active = true;
                    newMatches.push(match.loserPath);
                }
            }
            if (match.loserPath === null) {
                if (playerOneWins > playerTwoWins) this.removePlayer(match.playerTwo);
                else if (playerTwoWins > playerOneWins) this.removePlayer(match.playerOne);
            }
            active = this.activeMatches();
            this.currentRound = active.length === 0 ? -1 : active.reduce((x, y) => Math.min(x, y.round), active[0].round);
        }
        if (active.length === 0) this.nextRoundReady = true;
        this.players.forEach(p => Tiebreakers.compute(p, this));
        return newMatches;
    }

    /**
     * Starts the next round, if there are no active matches
     * @return {(Match[]|Boolean)} Array of new matches, or false if not ready to start the new round.
     */
    nextRound() {
        if (!this.nextRoundReady) return false;
        let newMatches = [];
        this.nextRoundReady = false;
        if (this.currentRound === this.numberOfRounds) {
            if (this.playoffs !== null) {
                this.currentRound++;
                if (this.cutType === 'rank' && this.cutLimit > 0) {
                    const rankedPlayers = this.standings();
                    for (let i = this.cutLimit; i < rankedPlayers.length; i++) this.removePlayer(rankedPlayers[i]);
                } else if (this.cutType === 'points' && this.cutLimit > 0) this.players.filter(p => p.matchPoints < this.cutLimit).forEach(p => this.removePlayer(p));
                if (this.playoffs === 'elim') Algorithms.elim(this.matches, this.players.filter(p => p.active), this.thirdPlaceMatch, this.currentRound);
                else Algorithms.doubleElim(this.matches, this.players.filter(p => p.active), this.currentRound);
                newMatches = this.activeMatches();
            } else this.active = false;
        } else if (this.currentRound > this.numberOfRounds || this.currentRound === -1) this.active = false;
        else {
            this.currentRound++;
            if (this.dutch) this.matches = this.matches.concat(Algorithms.dutch(this.matches, this.players.filter(p => p.active), this.currentRound, this.winValue * (this.currentRound - 1)));
            else {
                const seedPref = this.seededPlayers ? this.seedOrder : null;
                this.matches = this.matches.concat(Algorithms.swiss(this.matches, this.players.filter(p => p.active), this.currentRound, this.winValue * (this.currentRound - 1), seedPref));
            }
            const bye = this.matches.filter(r => r.round === this.currentRound).find(m => m.playerTwo === null);
            if (bye !== undefined) this.result(bye, Math.ceil(this.bestOf / 2), 0);
            newMatches = this.activeMatches();
        }
        return newMatches;
    }
}

/**
 * Class recreating a Swiss pairing tournament from an existing object.
 * @extends Swiss
 */
 class SwissReloaded extends Swiss {
    constructor(tournament) {
        super(tournament.id);
        ['players', 'matches'].forEach(prop => tournament[prop] = tournament.hasOwnProperty(prop) ? tournament[prop] : []);
        Object.assign(this, tournament);
        this.players = this.players.map(p => new Player(p));
        this.matches = this.matches.map(m => new Match(m))
        this.matches.forEach(m => {
            if (m.playerOne !== undefined && m.playerOne !== null) {
                const p1 = this.players.find(p => m.playerOne.id === p.id);
                if (p1 !== undefined) m.playerOne = p1;
            }
            if (m.playerTwo !== undefined && m.playerTwo !== null) {
                const p2 = this.players.find(p => m.playerTwo.id === p.id);
                if (p2 !== undefined) m.playerTwo = p2;
            }
        });
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
         * Only applies if cutType is rank.
         * @type {Boolean}
         * @default false
         */
        this.cutEachGroup = this.cutType === 'rank' && options.hasOwnProperty('cutEachGroup') && typeof options.cutEachGroup === 'boolean' ? options.cutEachGroup : false;

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

        /**
         * If the event is ready to proceed to the next round.
         * @type {Boolean}
         * @default false
         */
         this.nextRoundReady = false;
    }

    /**
     * Starts the tournament.
     */
    startEvent() {
        if (this.players.length < 2) return;
        this.active = true;
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
        const byes = this.matches.filter(r => r.round === this.currentRound && (r.playerOne === null || r.playerTwo === null));
        byes.forEach(b => b.playerOne === null ? this.result(b, 0, Math.ceil(this.bestOf / 2)) : this.result(b, Math.ceil(this.bestOf / 2), 0));
        this.numberOfRounds = this.matches.reduce((x, y) => Math.max(x, y.round), 0);
    }

    /**
     * Storing results of a match.
     * @param {Match} match The match being reported.
     * @param {Number} playerOneWins Number of wins for player one.
     * @param {Number} playerTwoWins Number of wins for player two.
     * @param {Number} [draws=0] Number of draws.
     * @returns {?Match[]} Array of new matches, or null if result failed.
     */
    result(match, playerOneWins, playerTwoWins, draws = 0) {
        if (!this.active) return null;
        if (!match.active && match.playerOne !== null && match.playerTwo !== null) {
            match.resetResults(this.winValue, this.lossValue, this.drawValue);
            match.playerOneWins = 0;
            match.playerTwoWins = 0;
            match.draws = 0;
        }
        if (match.playerOne === null) {
            match.assignBye(2, this.winValue);
            return null;
        }
        match.playerOneWins = playerOneWins;
        if (match.playerTwo === null) {
            match.assignBye(1, this.winValue);
            return null;
        }
        match.playerTwoWins = playerTwoWins;
        match.draws = draws;
        match.active = false;
        match.resultForPlayers(this.winValue, this.lossValue, this.drawValue);
        let active = this.activeMatches();
        let newMatches = [];
        if (this.currentRound > this.numberOfRounds) {
            if (match.winnerPath !== null) {
                if (match.winnerPath.playerOne === null) match.winnerPath.playerOne = playerOneWins >= playerTwoWins ? match.playerOne : match.playerTwo;
                else if (match.winnerPath.playerTwo === null) match.winnerPath.playerTwo = playerOneWins >= playerTwoWins ? match.playerOne : match.playerTwo;
                if (match.winnerPath.playerOne !== null && match.winnerPath.playerTwo !== null) {
                    match.winnerPath.active = true;
                    newMatches.push(match.winnerPath);
                }
            }
            if (match.loserPath !== null) {
                if (match.loserPath.playerOne === null) match.loserPath.playerOne = playerOneWins < playerTwoWins ? match.playerOne : match.playerTwo;
                else if (match.loserPath.playerTwo === null) match.loserPath.playerTwo = playerOneWins < playerTwoWins ? match.playerOne : match.playerTwo;
                if (match.loserPath.playerOne !== null && match.loserPath.playerTwo !== null) {
                    match.loserPath.active = true;
                    newMatches.push(match.loserPath);
                }
            }
            if (match.loserPath === null) {
                if (playerOneWins > playerTwoWins) this.removePlayer(match.playerTwo);
                else if (playerTwoWins > playerOneWins) this.removePlayer(match.playerOne);
            }
            active = this.activeMatches();
            this.currentRound = active.length === 0 ? -1 : active.reduce((x, y) => Math.min(x, y.round), active[0].round);
        }
        if (active.length === 0) this.nextRoundReady = true;
        this.players.forEach(p => Tiebreakers.compute(p, this));
        return newMatches;
    }

    /**
     * Starts the next round, if there are no active matches
     * @return {(Match[]|Boolean)} Array of new matches, or false if not ready to start the new round.
     */
     nextRound() {
        if (!this.nextRoundReady) return false;
        let newMatches = [];
        this.nextRoundReady = false;
        if (this.currentRound === this.numberOfRounds) {
            if (this.playoffs !== null) {
                this.currentRound++;
                if (this.cutType === 'rank' && this.cutLimit > 0) {
                    if (this.cutEachGroup) {
                        this.groups.forEach(g => {
                            const rankedGroup = this.groupStandings(g);
                            for (let i = this.cutLimit; i < g.length; i++) this.removePlayer(rankedGroup[i]);
                        });
                    } else {
                        const rankedPlayers = this.standings();
                        for (let i = this.cutLimit; i < rankedPlayers.length; i++) this.removePlayer(rankedPlayers[i]);
                    }
                } else if (this.cutType === 'points' && this.cutLimit > 0) this.players.filter(p => p.matchPoints < this.cutLimit).forEach(p => this.removePlayer(p));
                if (this.playoffs === 'elim') Algorithms.elim(this.matches, this.standings(), this.thirdPlaceMatch, this.currentRound);
                else Algorithms.doubleElim(this.matches, this.standings(), this.currentRound);
                newMatches = this.activeMatches();
            } else this.active = false;
        } else if (this.currentRound > this.numberOfRounds || this.currentRound === -1) this.active = false;
        else {
            this.currentRound++;
            const nextRound = this.matches.filter(p => p.round === this.currentRound);
            nextRound.forEach(m => {
                if (m.playerOne !== null && m.playerTwo !== null) m.active = true;
            });
            const byes = nextRound.filter(m => m.playerOne === null || m.playerTwo === null);
            byes.forEach(b => b.playerOne === null ? this.result(b, 0, Math.ceil(this.bestOf / 2)) : this.result(b, Math.ceil(this.bestOf / 2), 0));
            newMatches = this.activeMatches();
        }
        return newMatches;
    }

    /**
     * Get the current standings for a group of players in the tournament.
     * @param {Player[]} group A group of players.
     * @param {Boolean} [active=true] Filtering only active players.
     * @return {Player[]}
     */
    groupStandings(group, active = true) {
        group.forEach(p => Tiebreakers.compute(p, this));
        let thesePlayers = active ? group.filter(p => p.active) : [...group];
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
 * Class recreating a round-robin pairing tournament from an existing object.
 * @extends RoundRobin
 */
 class RoundRobinReloaded extends RoundRobin {
    constructor(tournament) {
        super(tournament.id);
        ['players', 'matches', 'groups'].forEach(prop => tournament[prop] = tournament.hasOwnProperty(prop) ? tournament[prop] : []);
        Object.assign(this, tournament);
        this.players = this.players.map(p => new Player(p));
        this.matches = this.matches.map(m => new Match(m));
        this.matches.forEach(m => {
            if (m.playerOne !== undefined && m.playerOne !== null) {
                const p1 = this.players.find(p => m.playerOne.id === p.id);
                if (p1 !== undefined) m.playerOne = p1;
            }
            if (m.playerTwo !== undefined && m.playerTwo !== null) {
                const p2 = this.players.find(p => m.playerTwo.id === p.id);
                if (p2 !== undefined) m.playerTwo = p2;
            }
        });
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

        this.tiebreakers = ['match-points'];
    }

    /**
     * Starts the tournament.
     */
    startEvent() {
        if (this.players.length < 2) return;
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
     * @param {Boolean} [dropdown=true] Whether or not to drop the player into loser's bracket in double elimination.
     * @returns {?Match[]} Array of new matches, or null if result failed.
     */
    result(match, playerOneWins, playerTwoWins, draws = 0, dropdown = true) {
        if (!this.active) return null;
        if (match.playerTwo === undefined) match.assignBye(1, this.winValue);
        else {
            match.playerOneWins = playerOneWins;
            match.playerTwoWins = playerTwoWins;
            match.draws = draws;
            match.active = false;
            match.resultForPlayers(this.winValue, this.lossValue, this.drawValue);
        }
        let newMatches = [];
        if (match.winnerPath !== null) {
            if (match.winnerPath.playerOne === null) match.winnerPath.playerOne = playerOneWins >= playerTwoWins ? match.playerOne : match.playerTwo;
            else if (match.winnerPath.playerTwo === null) match.winnerPath.playerTwo = playerOneWins >= playerTwoWins ? match.playerOne : match.playerTwo;
            if (match.winnerPath.playerOne !== null && match.winnerPath.playerTwo !== null) {
                match.winnerPath.active = true;
                newMatches.push(match.winnerPath);
            }
        }
        if (match.loserPath !== null && dropdown) {
            if (match.loserPath.playerOne === null) match.loserPath.playerOne = playerOneWins < playerTwoWins ? match.playerOne : match.playerTwo;
            else if (match.loserPath.playerTwo === null) match.loserPath.playerTwo = playerOneWins < playerTwoWins ? match.playerOne : match.playerTwo;
            if (match.loserPath.playerTwo === undefined) {
                let matchesFromDrop = this.result(match.loserPath, 2, 0);
                matchesFromDrop.forEach(m => newMatches.push(m));
            }
            if (match.loserPath.playerOne !== null && match.loserPath.playerTwo !== null && match.loserPath.playerTwo !== undefined) {
                match.loserPath.active = true;
                newMatches.push(match.loserPath);
            }
        }
        if (match.loserPath === null && match.playerTwo !== undefined) {
            if (playerOneWins > playerTwoWins) this.removePlayer(match.playerTwo);
            else if (playerTwoWins > playerOneWins) this.removePlayer(match.playerOne);
        }
        if (this.activeMatches().length === 0) this.active = false;
        return newMatches;
    }
}

/**
 * Class recreating an elimination tournament from an existing object.
 * @extends Elimination
 */
 class EliminationReloaded extends Elimination {
    constructor(tournament) {
        super(tournament.id);
        Object.assign(this, tournament);
        this.players = this.players.map(p => new Player(p));
        this.matches = this.matches.map(m => new Match(m));
        this.matches.forEach(m => {
            if (m.playerOne !== undefined && m.playerOne !== null) {
                const p1 = this.players.find(p => m.playerOne.id === p.id);
                if (p1 !== undefined) m.playerOne = p1;
            }
            if (m.playerTwo !== undefined && m.playerTwo !== null) {
                const p2 = this.players.find(p => m.playerTwo.id === p.id);
                if (p2 !== undefined) m.playerTwo = p2;
            }
        });
    }
 }

export { Structure, Tournament };
