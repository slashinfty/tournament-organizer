var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _Tournament_instances, _Tournament_createMatches, _Tournament_computeScores;
import randomstring from 'randomstring';
import * as Pairings from 'tournament-pairings';
import { Match } from './Match.js';
import { Player } from './Player.js';
/**
 * Class representing a tournament.
 *
 * See {@link TournamentValues} for detailed descriptions of properties.
 */
export class Tournament {
    /**
     * Create a new tournament.
     * @param id Unique ID of the tournament
     * @param name Name of the tournament
     */
    constructor(id, name) {
        _Tournament_instances.add(this);
        this.id = id;
        this.name = name;
        this.status = 'setup';
        this.round = 0;
        this.players = [];
        this.matches = [];
        this.colored = false;
        this.sorting = 'none';
        this.scoring = {
            bestOf: 1,
            win: 1,
            draw: 0.5,
            loss: 0,
            bye: 1,
            tiebreaks: []
        };
        this.stageOne = {
            format: 'single-elimination',
            consolation: false,
            rounds: 0,
            initialRound: 1,
            maxPlayers: 0
        };
        this.stageTwo = {
            format: null,
            consolation: false,
            advance: {
                value: 0,
                method: 'all'
            }
        };
        this.meta = {};
    }
    /** Set tournament options (only changes in options need to be included in the object) */
    set settings(options) {
        if (options.hasOwnProperty('players')) {
            options.players = [...this.players, ...options.players];
        }
        if (options.hasOwnProperty('matches')) {
            options.matches = [...this.matches, ...options.matches];
        }
        if (options.hasOwnProperty('scoring')) {
            options.scoring = Object.assign(this.scoring, options.scoring);
        }
        if (options.hasOwnProperty('stageOne')) {
            options.stageOne = Object.assign(this.stageOne, options.stageOne);
        }
        if (options.hasOwnProperty('stageTwo')) {
            options.stageTwo = Object.assign(this.stageTwo, options.stageTwo);
        }
        Object.assign(this, options);
    }
    /**
     * Create a new player.
     *
     * Throws an error if ID is specified and already exists, if the specified maximum number of players has been reached, if the tournament is in stage one and not Swiss format, or if the tournament is in stage two or complete.
     * @param name Alias of the player
     * @param id ID of the player (randomly assigned if omitted)
     * @returns The newly created player
     */
    createPlayer(name, id = undefined) {
        if ((this.status === 'stage-one' && this.stageOne.format !== 'swiss') || this.status === 'stage-two' || this.status === 'complete') {
            throw `Players can only be added during setup or stage one (if Swiss format)`;
        }
        if (this.stageOne.maxPlayers > 0 && this.players.length === this.stageOne.maxPlayers) {
            throw `Maximum number of players (${this.stageOne.maxPlayers}) are enrolled`;
        }
        let ID = id;
        if (ID === undefined) {
            do {
                ID = randomstring.generate({
                    length: 12,
                    charset: 'alphanumeric'
                });
            } while (this.players.some(p => p.id === ID));
        }
        else {
            if (this.players.some(p => p.id === ID)) {
                throw `Player with ID ${ID} already exists`;
            }
        }
        const player = new Player(ID, name);
        this.players.push(player);
        return player;
    }
    /**
     * Remove a player.
     *
     * Throws an error if no player has the ID specified or if the player is already inactive.
     *
     * In active elimination and stepladder formats, adjusts paths for any matches that interact with the match the player is in.
     *
     * In active round-robin formats, replaces the player in all future matches with a bye.
     * @param id ID of the player
     */
    removePlayer(id) {
        const player = this.players.find(p => p.id === id);
        if (player === undefined) {
            throw `Player with ID ${id} does not exist`;
        }
        if (player.active === false) {
            throw `Player is already marked inactive`;
        }
        player.active = false;
        if ((this.status === 'stage-one' && ['single-elimination', 'double-elimination', 'stepladder'].includes(this.stageOne.format) || this.status === 'stage-two' && ['single-elimination', 'double-elimination', 'stepladder'].includes(this.stageTwo.format))) {
            const activeMatch = this.matches.find(match => match.active === true && (match.player1.id === player.id || match.player2.id === player.id));
            if (activeMatch !== undefined) {
                const opponent = this.players.find(p => p.id === (activeMatch.player1.id === player.id ? activeMatch.player2.id : activeMatch.player1.id));
                activeMatch.values = {
                    active: false,
                    player1: activeMatch.player1.id === player.id ? {
                        win: 0,
                        loss: Math.ceil(this.scoring.bestOf / 2)
                    } : {
                        win: Math.ceil(this.scoring.bestOf / 2),
                        loss: 0
                    },
                    player2: activeMatch.player1.id === player.id ? {
                        win: Math.ceil(this.scoring.bestOf / 2),
                        loss: 0
                    } : {
                        win: 0,
                        loss: Math.ceil(this.scoring.bestOf / 2)
                    }
                };
                player.updateMatch(activeMatch.id, {
                    loss: Math.ceil(this.scoring.bestOf / 2)
                });
                opponent.updateMatch(activeMatch.id, {
                    win: Math.ceil(this.scoring.bestOf / 2)
                });
                if (activeMatch.path.win !== null) {
                    const winMatch = this.matches.find(match => match.id === activeMatch.path.win);
                    if (winMatch.player1.id === null) {
                        winMatch.values = {
                            player1: {
                                id: opponent.id
                            }
                        };
                    }
                    else {
                        winMatch.values = {
                            player2: {
                                id: opponent.id
                            }
                        };
                    }
                    if (winMatch.player1.id !== null && winMatch.player2.id !== null) {
                        winMatch.values = {
                            active: true
                        };
                        this.players.find(p => p.id === winMatch.player1.id).addMatch({
                            id: winMatch.id,
                            opponent: winMatch.player2.id
                        });
                        this.players.find(p => p.id === winMatch.player2.id).addMatch({
                            id: winMatch.id,
                            opponent: winMatch.player1.id
                        });
                    }
                }
                if (activeMatch.path.loss !== null) {
                    const lossMatch = this.matches.find(match => match.id === activeMatch.path.loss);
                    if (lossMatch.player1.id === null && lossMatch.player2.id === null) {
                        const prevMatch = this.matches.find(match => (match.path.win === lossMatch.id || match.path.loss === lossMatch.id) && match.player1.id !== player.id && match.player2.id !== player.id);
                        prevMatch.values = {
                            path: {
                                win: prevMatch.path.win === lossMatch.id ? lossMatch.path.win : prevMatch.path.win,
                                loss: prevMatch.path.loss === lossMatch.id ? lossMatch.path.win : prevMatch.path.loss
                            }
                        };
                    }
                    else {
                        const waitingPlayer = this.players.find(player => player.id === (lossMatch.player1.id === null ? lossMatch.player2.id : lossMatch.player1.id));
                        const winMatch = this.matches.find(match => match.id === lossMatch.path.win);
                        if (winMatch.player1.id === null) {
                            winMatch.values = {
                                player1: {
                                    id: waitingPlayer.id
                                }
                            };
                        }
                        else {
                            winMatch.values = {
                                player2: {
                                    id: waitingPlayer.id
                                }
                            };
                        }
                        if (winMatch.player1.id !== null && winMatch.player2.id !== null) {
                            winMatch.values = {
                                active: true
                            };
                            this.players.find(p => p.id === winMatch.player1.id).addMatch({
                                id: winMatch.id,
                                opponent: winMatch.player2.id
                            });
                            this.players.find(p => p.id === winMatch.player2.id).addMatch({
                                id: winMatch.id,
                                opponent: winMatch.player1.id
                            });
                        }
                    }
                }
            }
            const waitingMatch = this.matches.find(match => (match.player1.id === player.id && match.player2.id === null) || (match.player2.id === player.id && match.player1.id === null));
            if (waitingMatch !== undefined && waitingMatch.path.win !== null) {
                const prevMatch = this.matches.find(match => (match.path.win === waitingMatch.id || match.path.loss === waitingMatch.id) && match.player1.id !== player.id && match.player2.id !== player.id);
                prevMatch.values = {
                    path: {
                        win: prevMatch.path.win === waitingMatch.id ? waitingMatch.path.win : prevMatch.path.win,
                        loss: prevMatch.path.loss === waitingMatch.id ? waitingMatch.path.win : prevMatch.path.loss
                    }
                };
                if (waitingMatch.path.loss !== undefined) {
                    const prevLossMatch = this.matches.find(match => (match.path.win === waitingMatch.path.loss || match.path.loss === waitingMatch.path.loss) && match.player1.id !== player.id && match.player2.id !== player.id);
                    const currLossMatch = this.matches.find(match => match.id === waitingMatch.path.loss);
                    prevLossMatch.values = {
                        path: {
                            win: prevLossMatch.path.win === currLossMatch.id ? currLossMatch.path.win : prevLossMatch.path.win,
                            loss: prevLossMatch.path.loss === currLossMatch.id ? currLossMatch.path.win : prevLossMatch.path.loss
                        }
                    };
                }
            }
        }
        else if (['round-robin', 'double-round-robin'].includes(this.stageOne.format)) {
            const byeMatches = this.matches.filter(match => match.round > this.round && (match.player1.id === player.id || match.player2.id === player.id));
            byeMatches.forEach(match => {
                match.values = {
                    player1: {
                        id: match.player1.id === player.id ? null : match.player1.id
                    },
                    player2: {
                        id: match.player2.id === player.id ? null : match.player2.id
                    }
                };
            });
        }
    }
    /**
     * Start the tournament.
     *
     * Throws an error if there are an insufficient number of players (4 if double elimination, otherwise 2).
     */
    start() {
        const players = this.players.filter(p => p.active === true);
        if ((this.stageOne.format === 'double-elimination' && players.length < 4) || players.length < 2) {
            throw `Insufficient number of players (${players.length}) to start event`;
        }
        if (this.sorting !== 'none') {
            players.sort((a, b) => this.sorting === 'ascending' ? a.value - b.value : b.value - a.value);
        }
        this.status = 'stage-one';
        this.round = this.stageOne.initialRound;
        __classPrivateFieldGet(this, _Tournament_instances, "m", _Tournament_createMatches).call(this, players);
        if (this.stageOne.format === 'swiss' && this.stageOne.rounds === 0) {
            this.stageOne.rounds = Math.ceil(Math.log2(this.players.length));
        }
        else if (this.stageOne.format !== 'swiss') {
            this.stageOne.rounds = this.matches.reduce((max, curr) => Math.max(max, curr.round), 0);
        }
    }
    /**
     * Progress to the next round in the tournament.
     *
     * Throws an error if there are active matches, if the current format is elimination or stepladder, or when attempting to create matches for stage two and there are an insufficient number of players.
     */
    next() {
        if (this.status !== 'stage-one') {
            throw `Can only advance rounds during stage one`;
        }
        if (['single-elimination', 'double-elimination', 'stepladder'].includes(this.stageOne.format)) {
            throw `Can not advance rounds in elimination or stepladder`;
        }
        if (this.matches.filter(match => match.active === true).length > 0) {
            throw `Can not advance rounds with active matches`;
        }
        this.round++;
        if (this.round > this.stageOne.rounds + this.stageOne.initialRound - 1) {
            if (this.stageTwo.format !== null) {
                this.status = 'stage-two';
                if (this.stageTwo.advance.method === 'points') {
                    this.players.filter(player => player.matches.reduce((sum, match) => match.win > match.loss ? sum + this.scoring.win : match.loss > match.win ? sum + this.scoring.loss : this.scoring.draw, 0) < this.stageTwo.advance.value).forEach(player => player.active = false);
                }
                else if (this.stageTwo.advance.method === 'rank') {
                    const standings = this.standings();
                    standings.splice(0, this.stageTwo.advance.value);
                    standings.forEach(s => this.players.find(p => p.id === s.player.id).active = false);
                }
                if ((this.stageTwo.format === 'double-elimination' && this.players.filter(player => player.active === true).length < 4) || this.players.filter(player => player.active === true).length < 2) {
                    throw `Insufficient number of players (${this.players.filter(player => player.active === true).length}) to create stage two matches`;
                }
                __classPrivateFieldGet(this, _Tournament_instances, "m", _Tournament_createMatches).call(this, this.standings().map(s => s.player).filter(p => p.active === true));
            }
            else {
                this.end();
            }
        }
        else {
            if (['round-robin', 'double-round-robin'].includes(this.stageOne.format)) {
                const matches = this.matches.filter(m => m.round === this.round);
                matches.forEach(match => {
                    if (match.player1.id === null || match.player2.id === null) {
                        this.players.find(p => p.id === (match.player1.id === null ? match.player2.id : match.player1.id)).addMatch({
                            id: match.id,
                            opponent: null,
                            bye: true,
                            win: Math.ceil(this.scoring.bestOf / 2)
                        });
                        match.values = {
                            bye: true,
                            player1: {
                                win: match.player2.id === null ? Math.ceil(this.scoring.bestOf / 2) : 0
                            },
                            player2: {
                                win: match.player1.id === null ? Math.ceil(this.scoring.bestOf / 2) : 0
                            }
                        };
                    }
                    else {
                        match.values = { active: true };
                        this.players.find(p => p.id === match.player1.id).addMatch({
                            id: match.id,
                            opponent: match.player2.id
                        });
                        this.players.find(p => p.id === match.player2.id).addMatch({
                            id: match.id,
                            opponent: match.player1.id
                        });
                    }
                });
            }
            else {
                const players = this.players.filter(p => p.active === true);
                if (this.sorting !== 'none') {
                    players.sort((a, b) => this.sorting === 'ascending' ? a.value - b.value : b.value - a.value);
                }
                __classPrivateFieldGet(this, _Tournament_instances, "m", _Tournament_createMatches).call(this, players);
            }
        }
    }
    /**
     * Updates the result of a match.
     *
     * Throws an error if no match has the ID specified.
     *
     * In elimination and stepladder formats, moves players to their appropriate next matches.
     * @param id ID of the match
     * @param player1Wins Number of wins for player one
     * @param player2Wins Number of wins for player two
     * @param draws Number of draws
     */
    enterResult(id, player1Wins, player2Wins, draws = 0) {
        const match = this.matches.find(m => m.id === id);
        if (match === undefined) {
            throw `Match with ID ${id} does not exist`;
        }
        match.values = {
            active: false,
            player1: {
                win: player1Wins,
                loss: player2Wins,
                draw: draws
            },
            player2: {
                win: player2Wins,
                loss: player1Wins,
                draw: draws
            }
        };
        const player1 = this.players.find(p => p.id === match.player1.id);
        player1.updateMatch(match.id, {
            win: player1Wins,
            loss: player2Wins,
            draw: draws
        });
        const player2 = this.players.find(p => p.id === match.player2.id);
        player2.updateMatch(match.id, {
            win: player2Wins,
            loss: player1Wins,
            draw: draws
        });
        if (match.path.win !== null) {
            const winID = player1Wins > player2Wins ? match.player1.id : match.player2.id;
            const winMatch = this.matches.find(m => m.id === match.path.win);
            if (winMatch.player1.id === null) {
                winMatch.values = {
                    player1: {
                        id: winID
                    }
                };
            }
            else {
                winMatch.values = {
                    player2: {
                        id: winID
                    }
                };
            }
            if (winMatch.player1.id !== null && winMatch.player2.id !== null) {
                winMatch.values = {
                    active: true
                };
                this.players.find(p => p.id === winMatch.player1.id).addMatch({
                    id: winMatch.id,
                    opponent: winMatch.player2.id
                });
                this.players.find(p => p.id === winMatch.player2.id).addMatch({
                    id: winMatch.id,
                    opponent: winMatch.player1.id
                });
            }
        }
        const lossID = player1Wins > player2Wins ? match.player2.id : match.player1.id;
        if (match.path.loss !== null) {
            const lossMatch = this.matches.find(m => m.id === match.path.loss);
            if (lossMatch.player1.id === null) {
                lossMatch.values = {
                    player1: {
                        id: lossID
                    }
                };
            }
            else {
                lossMatch.values = {
                    player2: {
                        id: lossID
                    }
                };
            }
            if (lossMatch.player1.id !== null && lossMatch.player2.id !== null) {
                lossMatch.values = {
                    active: true
                };
                this.players.find(p => p.id === lossMatch.player1.id).addMatch({
                    id: lossMatch.id,
                    opponent: lossMatch.player2.id
                });
                this.players.find(p => p.id === lossMatch.player2.id).addMatch({
                    id: lossMatch.id,
                    opponent: lossMatch.player1.id
                });
            }
        }
        else if ((this.status === 'stage-one' && ['single-elimination', 'double-elimination', 'stepladder'].includes(this.stageOne.format)) || this.status === 'stage-two') {
            this.players.find(p => p.id === lossID).values = { active: false };
        }
    }
    /**
     * Clears the results of a match.
     *
     * Throws an error if no match has the ID specified or if the match is still active.
     *
     * In elimination and stepladder formats, it reverses the progression of players in the bracket.
     * @param id The ID of the match
     */
    clearResult(id) {
        const match = this.matches.find(m => m.id === id);
        if (match === undefined) {
            throw `Match with ID ${id} does not exist`;
        }
        match.values = {
            active: true,
            player1: {
                win: 0,
                loss: 0,
                draw: 0
            },
            player2: {
                win: 0,
                loss: 0,
                draw: 0
            }
        };
        const player1 = this.players.find(player => player.id === match.player1.id);
        const player2 = this.players.find(player => player.id === match.player2.id);
        player1.values = { active: true };
        player1.updateMatch(match.id, {
            win: 0,
            loss: 0,
            draw: 0
        });
        player2.values = { active: true };
        player2.updateMatch(match.id, {
            win: 0,
            loss: 0,
            draw: 0
        });
        if (match.path.win !== null) {
            const winMatch = this.matches.find(m => m.id === match.path.win);
            if (winMatch.active === true) {
                this.players.find(player => player.id === winMatch.player1.id).removeMatch(winMatch.id);
                this.players.find(player => player.id === winMatch.player2.id).removeMatch(winMatch.id);
            }
            winMatch.values = {
                active: false,
                player1: {
                    id: winMatch.player1.id === player1.id || winMatch.player1.id === player2.id ? null : winMatch.player1.id
                },
                player2: {
                    id: winMatch.player2.id === player1.id || winMatch.player2.id === player2.id ? null : winMatch.player2.id
                }
            };
        }
        if (match.path.loss !== null) {
            const lossMatch = this.matches.find(m => m.id === match.path.loss);
            if (lossMatch.active === true) {
                this.players.find(player => player.id === lossMatch.player1.id).removeMatch(lossMatch.id);
                this.players.find(player => player.id === lossMatch.player2.id).removeMatch(lossMatch.id);
            }
            lossMatch.values = {
                active: false,
                player1: {
                    id: lossMatch.player1.id === player1.id || lossMatch.player1.id === player2.id ? null : lossMatch.player1.id
                },
                player2: {
                    id: lossMatch.player2.id === player1.id || lossMatch.player2.id === player2.id ? null : lossMatch.player2.id
                }
            };
        }
    }
    /**
     * Assigns a bye to a player in a specified round.
     *
     * Throws an error if it is not actively Swiss pairings, no player has the ID specified, if the player is already inactive, or if the player already has a match in the round.
     * @param id The ID of the player
     * @param round The round number
     */
    assignBye(id, round) {
        if (this.status !== 'stage-one' || this.stageOne.format !== 'swiss') {
            throw `Can only assign losses during Swiss pairings`;
        }
        const player = this.players.find(p => p.id === id);
        if (player === undefined) {
            throw `Player with ID ${id} does not exist`;
        }
        if (player.active === false) {
            throw `Player is currently inactive`;
        }
        if (player.matches.some(match => this.matches.find(m => m.id === match.id).round === round)) {
            throw `Player already has a match in round ${round}`;
        }
        let byeID;
        do {
            byeID = randomstring.generate({
                length: 12,
                charset: 'alphanumeric'
            });
        } while (this.matches.some(m => m.id === byeID));
        const bye = new Match(byeID, round, 0);
        bye.values = {
            bye: true,
            player1: {
                id: player.id,
                win: Math.ceil(this.scoring.bestOf / 2)
            }
        };
        player.addMatch({
            id: byeID,
            opponent: null,
            bye: true,
            win: Math.ceil(this.scoring.bestOf / 2)
        });
        this.matches.push(bye);
    }
    /**
     * Assigns a loss to a player in a specified round.
     *
     * Throws an error if it is not actively Swiss pairings, no player has the ID specified, or if the player is already inactive.
     *
     * If the player has a match in the specified round, it is removed, they are assigned a loss, and the opponent is assigned a bye.
     * @param id The ID of the player
     * @param round The round number
     */
    assignLoss(id, round) {
        if (this.status !== 'stage-one' || this.stageOne.format !== 'swiss') {
            throw `Can only assign losses during Swiss pairings`;
        }
        const player = this.players.find(p => p.id === id);
        if (player === undefined) {
            throw `Player with ID ${id} does not exist`;
        }
        if (player.active === false) {
            throw `Player is currently inactive`;
        }
        if (player.matches.some(match => this.matches.find(m => m.id === match.id).round === round)) {
            const currentMatch = this.matches.filter(match => match.round === round).find(match => match.player1.id === player.id || match.player2.id === player.id);
            this.matches.splice(this.matches.findIndex(match => match.id === currentMatch.id), 1);
            player.removeMatch(currentMatch.id);
            const opponent = this.players.find(p => p.id === (currentMatch.player1.id === player.id ? currentMatch.player2.id : currentMatch.player1.id));
            if (opponent !== undefined) {
                opponent.removeMatch(currentMatch.id);
                this.assignBye(opponent.id, round);
            }
        }
        let lossID;
        do {
            lossID = randomstring.generate({
                length: 12,
                charset: 'alphanumeric'
            });
        } while (this.matches.some(m => m.id === lossID));
        const loss = new Match(lossID, round, 0);
        loss.values = {
            player1: {
                id: player.id,
                loss: Math.ceil(this.scoring.bestOf / 2)
            },
            player2: {
                win: Math.ceil(this.scoring.bestOf / 2)
            }
        };
        player.addMatch({
            id: lossID,
            opponent: null,
            loss: Math.ceil(this.scoring.bestOf / 2)
        });
        this.matches.push(loss);
    }
    /**
     * Computes tiebreakers for all players and ranks the players by points and tiebreakers.
     * @param activeOnly If the array contains only active players
     * @returns A sorted array of players with scores and tiebreaker values
     */
    standings(activeOnly = true) {
        let players = __classPrivateFieldGet(this, _Tournament_instances, "m", _Tournament_computeScores).call(this);
        if (activeOnly === true) {
            players = players.filter(p => p.player.active === true);
        }
        players.sort((a, b) => {
            if (a.matchPoints !== b.matchPoints) {
                return b.matchPoints - a.matchPoints;
            }
            for (let i = 0; i < this.scoring.tiebreaks.length; i++) {
                switch (this.scoring.tiebreaks[i]) {
                    case 'median buchholz':
                        if (a.tiebreaks.medianBuchholz !== b.tiebreaks.medianBuchholz) {
                            return b.tiebreaks.medianBuchholz - a.tiebreaks.medianBuchholz;
                        }
                        else
                            continue;
                    case 'solkoff':
                        if (a.tiebreaks.solkoff !== b.tiebreaks.solkoff) {
                            return b.tiebreaks.solkoff - a.tiebreaks.solkoff;
                        }
                        else
                            continue;
                    case 'sonneborn berger':
                        if (a.tiebreaks.sonnebornBerger !== b.tiebreaks.sonnebornBerger) {
                            return b.tiebreaks.sonnebornBerger - a.tiebreaks.sonnebornBerger;
                        }
                        else
                            continue;
                    case 'cumulative':
                        if (a.tiebreaks.cumulative !== b.tiebreaks.cumulative) {
                            return b.tiebreaks.cumulative - a.tiebreaks.cumulative;
                        }
                        else if (a.tiebreaks.oppCumulative !== b.tiebreaks.oppCumulative) {
                            return b.tiebreaks.oppCumulative - a.tiebreaks.oppCumulative;
                        }
                        else
                            continue;
                    case 'versus':
                        const matchIDs = a.player.matches.filter(m => m.opponent === b.player.id).map(m => m.id);
                        if (matchIDs.length === 0) {
                            continue;
                        }
                        const pointsA = a.player.matches.filter(m => matchIDs.some(i => i === m.id)).reduce((sum, curr) => curr.win > curr.loss ? sum + this.scoring.win : curr.loss > curr.win ? sum + this.scoring.loss : sum + this.scoring.draw, 0);
                        const pointsB = b.player.matches.filter(m => matchIDs.some(i => i === m.id)).reduce((sum, curr) => curr.win > curr.loss ? sum + this.scoring.win : curr.loss > curr.win ? sum + this.scoring.loss : sum + this.scoring.draw, 0);
                        if (pointsA !== pointsB) {
                            return pointsB - pointsA;
                        }
                        else
                            continue;
                    case 'game win percentage':
                        if (a.tiebreaks.gameWinPct !== b.tiebreaks.gameWinPct) {
                            return b.tiebreaks.gameWinPct - a.tiebreaks.gameWinPct;
                        }
                        else
                            continue;
                    case 'opponent game win percentage':
                        if (a.tiebreaks.oppGameWinPct !== b.tiebreaks.oppGameWinPct) {
                            return b.tiebreaks.oppGameWinPct - a.tiebreaks.oppGameWinPct;
                        }
                        else
                            continue;
                    case 'opponent match win percentage':
                        if (a.tiebreaks.oppMatchWinPct !== b.tiebreaks.oppMatchWinPct) {
                            return b.tiebreaks.oppMatchWinPct - a.tiebreaks.oppMatchWinPct;
                        }
                        else
                            continue;
                    case 'opponent opponent match win percentage':
                        if (a.tiebreaks.oppOppMatchWinPct !== b.tiebreaks.oppOppMatchWinPct) {
                            return b.tiebreaks.oppOppMatchWinPct - a.tiebreaks.oppOppMatchWinPct;
                        }
                        else
                            continue;
                }
            }
            return parseInt(b.player.id, 36) - parseInt(a.player.id, 36);
        });
        return players;
    }
    /**
     * Ends the tournament and marks all players and matches as inactive.
     */
    end() {
        this.status = 'complete';
        this.players.forEach(player => player.active = false);
        this.matches.forEach(match => match.active = false);
    }
}
_Tournament_instances = new WeakSet(), _Tournament_createMatches = function _Tournament_createMatches(players) {
    const format = this.status === 'stage-one' ? this.stageOne.format : this.stageTwo.format;
    let matches = [];
    switch (format) {
        case 'single-elimination':
        case 'double-elimination':
        case 'stepladder':
            if (format === 'single-elimination') {
                matches = Pairings.SingleElimination(players.map(p => p.id), this.round, this.stageOne.consolation, this.status === 'stage-one' ? this.sorting !== 'none' : true);
            }
            else if (format === 'double-elimination') {
                matches = Pairings.DoubleElimination(players.map(p => p.id), this.round, this.status === 'stage-one' ? this.sorting !== 'none' : true);
            }
            else if (format === 'stepladder') {
                matches = Pairings.Stepladder(players.map(p => p.id), this.round, this.status === 'stage-one' ? this.sorting !== 'none' : true);
            }
            const newMatches = [];
            matches.forEach(match => {
                let id;
                do {
                    id = randomstring.generate({
                        length: 12,
                        charset: 'alphanumeric'
                    });
                } while (this.matches.some(m => m.id === id) || newMatches.some(m => m.id === id));
                const newMatch = new Match(id, match.round, match.match);
                newMatch.values = {
                    active: match.player1 !== null && match.player2 !== null,
                    player1: {
                        id: match.player1 === null ? null : match.player1.toString()
                    },
                    player2: {
                        id: match.player2 === null ? null : match.player2.toString()
                    }
                };
                newMatches.push(newMatch);
                if (newMatch.player1.id !== null && newMatch.player2.id !== null) {
                    this.players.find(p => p.id === match.player1.toString()).addMatch({
                        id: id,
                        opponent: match.player2.toString()
                    });
                    this.players.find(p => p.id === match.player2.toString()).addMatch({
                        id: id,
                        opponent: match.player1.toString()
                    });
                }
            });
            newMatches.forEach(match => {
                const origMatch = matches.find(m => m.round === match.round && m.match === match.match);
                const winPath = origMatch.hasOwnProperty('win') ? newMatches.find(m => m.round === origMatch.win.round && m.match === origMatch.win.match).id : null;
                const lossPath = origMatch.hasOwnProperty('loss') ? newMatches.find(m => m.round === origMatch.loss.round && m.match === origMatch.loss.match).id : null;
                match.values = {
                    path: {
                        win: winPath,
                        loss: lossPath
                    }
                };
            });
            this.matches = [...this.matches, ...newMatches];
            break;
        case 'round-robin':
        case 'double-round-robin':
            matches = Pairings.RoundRobin(players.map(p => p.id), this.round, this.status === 'stage-one' ? this.sorting !== 'none' : true);
            matches.forEach(match => {
                let id;
                do {
                    id = randomstring.generate({
                        length: 12,
                        charset: 'alphanumeric'
                    });
                } while (this.matches.some(m => m.id === id));
                const newMatch = new Match(id, match.round, match.match);
                newMatch.values = {
                    active: match.round === this.round && match.player1 !== null && match.player2 !== null,
                    player1: {
                        id: match.player1 === null ? null : match.player1.toString()
                    },
                    player2: {
                        id: match.player2 === null ? null : match.player2.toString()
                    }
                };
                this.matches.push(newMatch);
                if (match.round === this.round) {
                    if (newMatch.player1.id === null || newMatch.player2.id === null) {
                        this.players.find(p => p.id === (newMatch.player1.id === null ? newMatch.player2.id : newMatch.player1.id)).addMatch({
                            id: id,
                            opponent: null,
                            bye: true,
                            win: Math.ceil(this.scoring.bestOf / 2)
                        });
                        newMatch.values = {
                            bye: true,
                            player1: {
                                win: Math.ceil(this.scoring.bestOf / 2)
                            }
                        };
                    }
                    else {
                        this.players.find(p => p.id === newMatch.player1.id).addMatch({
                            id: id,
                            opponent: newMatch.player2.id
                        });
                        this.players.find(p => p.id === newMatch.player2.id).addMatch({
                            id: id,
                            opponent: newMatch.player1.id
                        });
                    }
                }
            });
            if (format === 'double-round-robin') {
                matches = Pairings.RoundRobin(players.map(p => p.id), this.matches.reduce((max, curr) => Math.max(max, curr.round), 0) + 1, this.status === 'stage-one' ? this.sorting !== 'none' : true);
                matches.forEach(match => {
                    let id;
                    do {
                        id = randomstring.generate({
                            length: 12,
                            charset: 'alphanumeric'
                        });
                    } while (this.matches.some(m => m.id === id));
                    const newMatch = new Match(id, match.round, match.match);
                    newMatch.values = {
                        active: match.round === this.round,
                        player1: {
                            id: match.player2 === null ? null : match.player2.toString()
                        },
                        player2: {
                            id: match.player1 === null ? null : match.player1.toString()
                        }
                    };
                    this.matches.push(newMatch);
                });
            }
            break;
        case 'swiss':
            const playerArray = players.map(player => ({
                id: player.id,
                score: player.matches.reduce((sum, match) => match.win > match.loss ? sum + this.scoring.win : match.loss > match.win ? sum + this.scoring.loss : this.scoring.draw, 0),
                pairedUpDown: player.matches.some(match => match.pairUpDown === true),
                receivedBye: player.matches.some(match => match.bye === true),
                avoid: player.matches.map(match => match.opponent).filter(opp => opp !== null),
                colors: player.matches.map(match => match.color).filter(color => color !== null),
                rating: player.value
            }));
            matches = Pairings.Swiss(playerArray, this.round, this.sorting !== 'none', this.colored);
            matches.forEach(match => {
                let id;
                do {
                    id = randomstring.generate({
                        length: 12,
                        charset: 'alphanumeric'
                    });
                } while (this.matches.some(m => m.id === id));
                const newMatch = new Match(id, match.round, match.match);
                newMatch.values = {
                    active: match.player2 !== null,
                    player1: {
                        id: match.player1.toString()
                    },
                    player2: {
                        id: match.player2 === null ? null : match.player2.toString()
                    }
                };
                this.matches.push(newMatch);
                if (newMatch.player2.id !== null) {
                    const player1Points = this.players.find(p => p.id === newMatch.player1.id).matches.reduce((sum, curr) => this.matches.find(m => m.id === curr.id).active === true ? sum : curr.win > curr.loss ? sum + this.scoring.win : curr.loss > curr.win ? sum + this.scoring.loss : sum + this.scoring.draw, 0);
                    const player2Points = this.players.find(p => p.id === newMatch.player2.id).matches.reduce((sum, curr) => this.matches.find(m => m.id === curr.id).active === true ? sum : curr.win > curr.loss ? sum + this.scoring.win : curr.loss > curr.win ? sum + this.scoring.loss : sum + this.scoring.draw, 0);
                    this.players.find(p => p.id === match.player1.toString()).addMatch({
                        id: id,
                        opponent: match.player2.toString(),
                        pairUpDown: player1Points !== player2Points,
                        color: this.colored ? 'w' : null
                    });
                    this.players.find(p => p.id === match.player2.toString()).addMatch({
                        id: id,
                        opponent: match.player1.toString(),
                        pairUpDown: player1Points !== player2Points,
                        color: this.colored ? 'b' : null
                    });
                }
                else {
                    this.players.find(p => p.id === match.player1.toString()).addMatch({
                        id: id,
                        opponent: null,
                        bye: true,
                        win: Math.ceil(this.scoring.bestOf / 2)
                    });
                    newMatch.values = {
                        bye: true,
                        player1: {
                            win: Math.ceil(this.scoring.bestOf / 2)
                        }
                    };
                }
            });
            break;
    }
}, _Tournament_computeScores = function _Tournament_computeScores() {
    const playerScores = this.players.map(player => ({
        player: player,
        gamePoints: 0,
        games: 0,
        matchPoints: 0,
        matches: 0,
        tiebreaks: {
            medianBuchholz: 0,
            solkoff: 0,
            sonnebornBerger: 0,
            cumulative: 0,
            oppCumulative: 0,
            matchWinPct: 0,
            oppMatchWinPct: 0,
            oppOppMatchWinPct: 0,
            gameWinPct: 0,
            oppGameWinPct: 0
        }
    }));
    for (let i = 0; i < playerScores.length; i++) {
        const player = playerScores[i];
        if (player.player.matches.length === 0) {
            continue;
        }
        player.player.matches.sort((a, b) => {
            const matchA = this.matches.find(m => m.id === a.id);
            const matchB = this.matches.find(m => m.id === b.id);
            return matchA.round - matchB.round;
        });
        player.player.matches.filter(match => this.matches.find(m => m.id === match.id && m.active === false)).forEach(match => {
            player.gamePoints += (this.scoring.win * match.win) + (this.scoring.loss * match.loss) + (this.scoring.draw * match.draw);
            player.games += match.win + match.loss + match.draw;
            player.matchPoints += match.win > match.loss ? this.scoring.win : match.loss > match.win ? this.scoring.loss : this.scoring.draw;
            player.tiebreaks.cumulative += player.matchPoints;
            player.matches++;
        });
        player.tiebreaks.gameWinPct = player.games === 0 ? 0 : player.gamePoints / (player.games * this.scoring.win);
        player.tiebreaks.matchWinPct = player.matches === 0 ? 0 : player.matchPoints / (player.matches * this.scoring.win);
    }
    for (let i = 0; i < playerScores.length; i++) {
        const player = playerScores[i];
        const opponents = playerScores.filter(p => player.player.matches.some(match => match.opponent === p.player.id));
        if (opponents.length === 0) {
            continue;
        }
        player.tiebreaks.oppMatchWinPct = opponents.reduce((sum, opp) => sum + opp.tiebreaks.matchWinPct, 0) / opponents.length;
        player.tiebreaks.oppGameWinPct = opponents.reduce((sum, opp) => sum + opp.tiebreaks.gameWinPct, 0) / opponents.length;
        const oppMatchPoints = opponents.map(opp => opp.matchPoints);
        player.tiebreaks.solkoff = oppMatchPoints.reduce((sum, curr) => sum + curr, 0);
        if (oppMatchPoints.length > 2) {
            const max = oppMatchPoints.reduce((max, curr) => Math.max(max, curr), 0);
            const min = oppMatchPoints.reduce((min, curr) => Math.min(min, curr), max);
            oppMatchPoints.splice(oppMatchPoints.indexOf(max), 1);
            oppMatchPoints.splice(oppMatchPoints.indexOf(min), 1);
            player.tiebreaks.medianBuchholz = oppMatchPoints.reduce((sum, curr) => sum + curr, 0);
        }
        player.tiebreaks.sonnebornBerger = opponents.reduce((sum, opp) => {
            const match = player.player.matches.find(m => m.opponent === opp.player.id);
            if (this.matches.find(m => m.id === match.id).active === true) {
                return sum;
            }
            return match.win > match.loss ? sum + opp.matchPoints : sum + (0.5 * opp.matchPoints);
        }, 0);
        player.tiebreaks.oppCumulative = opponents.reduce((sum, opp) => sum + opp.tiebreaks.cumulative, 0);
    }
    for (let i = 0; i < playerScores.length; i++) {
        const player = playerScores[i];
        const opponents = playerScores.filter(p => player.player.matches.some(match => match.opponent === p.player.id));
        if (opponents.length === 0) {
            continue;
        }
        player.tiebreaks.oppOppMatchWinPct = opponents.reduce((sum, opp) => sum + opp.tiebreaks.oppMatchWinPct, 0) / opponents.length;
    }
    return playerScores;
};
//# sourceMappingURL=Tournament.js.map