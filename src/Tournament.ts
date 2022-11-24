import cryptoRandomString from 'crypto-random-string';
import * as Pairings from 'tournament-pairings';
import { Match } from './Match.js';
import { Player } from './Player.js';
import { StandingsValues } from './interfaces/StandingsValues.js';
import { TournamentValues } from './interfaces/TournamentValues.js';
import { SettableTournamentValues } from './interfaces/SettableTournamentValues.js';

/** Class representing a tournament */
export class Tournament {
    /** Unique ID of the tournament */
    id: TournamentValues['id'];

    /** Name of the tournament */
    name: TournamentValues['name'];

    /** Current state of the tournament */
    status: TournamentValues['status'];

    /** Current round of the tournament */
    round: TournamentValues['round'];

    /** All players in the tournament */
    players: TournamentValues['players'];

    /** All matches of the tournament */
    matches: TournamentValues['matches'];

    /** Sorting method, if players are rated/seeded */
    sorting: TournamentValues['sorting'];

    /** Details regarding scoring */
    scoring: TournamentValues['scoring'];

    /** Details regarding the tournament */
    stageOne: TournamentValues['stageOne'];

    /** Details regarding playoffs */
    stageTwo: TournamentValues['stageTwo'];

    /**
     * Create a new tournament
     * @param id Unique ID of the tournament
     * @param name Name of the tournament
     */
    constructor(id: string, name: string) {
        this.id = id;
        this.name = name;
        this.status = 'setup';
        this.round = 0;
        this.players = [];
        this.matches = [];
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
            maxPlayers: 0
        };
        this.stageTwo = {
            format: null,
            consolation: false,
            advance: {
                value: 0,
                method: 'rank'
            }
        };
    }

    /** Set tournament options (only changes in options need to be included in the object) */
    set settings(options: SettableTournamentValues) {
        this.name = options.name || this.name;
        this.status = options.status || this.status;
        this.round = options.round || this.round;
        if (options.hasOwnProperty('players')) {
            this.players = [...this.players, ...options.players];
        }
        if (options.hasOwnProperty('matches')) {
            this.matches = [...this.matches, ...options.matches];
        }
        this.sorting = options.sorting || this.sorting;
        if (options.hasOwnProperty('scoring')) {
            this.scoring.bestOf = options.scoring.bestOf || this.scoring.bestOf;
            this.scoring.win = options.scoring.win || this.scoring.win;
            this.scoring.draw = options.scoring.draw || this.scoring.draw;
            this.scoring.loss = options.scoring.loss || this.scoring.loss;
            this.scoring.bye = options.scoring.bye || this.scoring.bye;
            this.scoring.tiebreaks = options.scoring.tiebreaks || this.scoring.tiebreaks;
        }
        if (options.hasOwnProperty('stageOne')) {
            this.stageOne.format = options.stageOne.format || this.stageOne.format;
            this.stageOne.consolation = options.stageOne.consolation || this.stageOne.consolation;
            this.stageOne.rounds = options.stageOne.rounds || this.stageOne.rounds;
            this.stageOne.maxPlayers = options.stageOne.maxPlayers || this.stageOne.maxPlayers;
        }
        if (options.hasOwnProperty('stageTwo')) {
            this.stageTwo.format = options.stageTwo.format || this.stageTwo.format;
            this.stageTwo.consolation = options.stageTwo.consolation || this.stageTwo.consolation;
            if (options.stageTwo.hasOwnProperty('advance')) {
                this.stageTwo.advance.value = options.stageTwo.advance.value || this.stageTwo.advance.value;
                this.stageTwo.advance.method = options.stageTwo.advance.method || this.stageTwo.advance.method;
            }
        }
    }

    #createMatches(players: Array<Player>) {
        const format = this.status === 'stage-one' ? this.stageOne.format : this.stageTwo.format
        let matches = [];
        switch (format) {
            case 'single-elimination':
            case 'double-elimination':
            case 'stepladder':
                if (format === 'single-elimination') {
                    matches = Pairings.SingleElimination(players.map(p => p.id), this.round, this.stageOne.consolation, this.status === 'stage-one' ? this.sorting !== 'none' : true);
                } else if (format === 'double-elimination') {
                    matches = Pairings.DoubleElimination(players.map(p => p.id), this.round, this.status === 'stage-one' ? this.sorting !== 'none' : true);
                } else if (format === 'stepladder') {
                    matches = Pairings.Stepladder(players.map(p => p.id), this.round, this.status === 'stage-one' ? this.sorting !== 'none' : true);
                }
                matches.forEach(match => {
                    let id: string;
                    do {
                        id = cryptoRandomString({
                            length: 12,
                            type: 'base64'
                        });
                    } while (this.matches.some(m => m.id === id));
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
                    this.matches.push(newMatch);
                    if (match.round === this.round) {
                        this.players.find(p => p.id === match.player1.toString()).addMatch({
                            id: id,
                            opponent: match.player2.toString(),
                            pairUpDown: false,
                            bye: false,
                            win: 0,
                            loss: 0,
                            draw: 0
                        });
                        this.players.find(p => p.id === match.player2.toString()).addMatch({
                            id: id,
                            opponent: match.player1.toString(),
                            pairUpDown: false,
                            bye: false,
                            win: 0,
                            loss: 0,
                            draw: 0
                        });
                    }
                });
                this.matches.forEach(match => {
                    const origMatch = matches.find(m => m.round === match.round && m.match === match.match);
                    const winPath = origMatch.hasOwnProperty('win') ? this.matches.find(m => m.round === origMatch.win.round && m.match === origMatch.win.match).id : null;
                    const lossPath = origMatch.hasOwnProperty('loss') ? this.matches.find(m => m.round === origMatch.loss.round && m.match === origMatch.loss.match).id : null;
                    match.values = {
                        path: {
                            win: winPath,
                            loss: lossPath
                        }
                    };
                });
                break;
            case 'round-robin':
            case 'double-round-robin':
                matches = Pairings.RoundRobin(players.map(p => p.id), this.round, this.status === 'stage-one' ? this.sorting !== 'none' : true);
                matches.forEach(match => {
                    let id: string;
                    do {
                        id = cryptoRandomString({
                            length: 12,
                            type: 'base64'
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
                                pairUpDown: false,
                                bye: true,
                                win: Math.ceil(this.scoring.bestOf / 2),
                                loss: 0,
                                draw: 0
                            });
                            newMatch.values = {
                                bye: true,
                                player1: {
                                    win: Math.ceil(this.scoring.bestOf / 2)
                                }
                            };
                        } else {
                            this.players.find(p => p.id === match.player1.toString()).addMatch({
                                id: id,
                                opponent: match.player2.toString(),
                                pairUpDown: false,
                                bye: false,
                                win: 0,
                                loss: 0,
                                draw: 0
                            });
                            this.players.find(p => p.id === match.player2.toString()).addMatch({
                                id: id,
                                opponent: match.player1.toString(),
                                pairUpDown: false,
                                bye: false,
                                win: 0,
                                loss: 0,
                                draw: 0
                            });
                        }
                    }
                });
                if (format === 'double-round-robin') {
                    matches = Pairings.RoundRobin(players.map(p => p.id), this.matches.reduce((max, curr) => Math.max(max, curr.round), 0) + 1, this.status === 'stage-one' ? this.sorting !== 'none' : true);
                    matches.forEach(match => {
                        let id: string;
                        do {
                            id = cryptoRandomString({
                                length: 12,
                                type: 'base64'
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
                    rating: player.value
                }));
                matches = Pairings.Swiss(playerArray, this.round, this.sorting !== 'none');
                matches.forEach(match => {
                    let id: string;
                    do {
                        id = cryptoRandomString({
                            length: 12,
                            type: 'base64'
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
                        const player1Points = this.players.find(p => p.id === match.player1.toString()).matches.reduce((sum, curr) => curr.win > curr.loss ? sum + this.scoring.win : curr.loss > curr.win ? sum + this.scoring.loss : sum + this.scoring.draw, 0);
                        const player2Points = this.players.find(p => p.id === match.player2.toString()).matches.reduce((sum, curr) => curr.win > curr.loss ? sum + this.scoring.win : curr.loss > curr.win ? sum + this.scoring.loss : sum + this.scoring.draw, 0);
                        this.players.find(p => p.id === match.player1.toString()).addMatch({
                            id: id,
                            opponent: match.player2.toString(),
                            pairUpDown: player1Points !== player2Points,
                            bye: false,
                            win: 0,
                            loss: 0,
                            draw: 0
                        });
                        this.players.find(p => p.id === match.player2.toString()).addMatch({
                            id: id,
                            opponent: match.player1.toString(),
                            pairUpDown: player1Points !== player2Points,
                            bye: false,
                            win: 0,
                            loss: 0,
                            draw: 0
                        });
                    } else {
                        this.players.find(p => p.id === match.player1.toString()).addMatch({
                            id: id,
                            opponent: null,
                            pairUpDown: false,
                            bye: true,
                            win: Math.ceil(this.scoring.bestOf / 2),
                            loss: 0,
                            draw: 0
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
    }

    #computeScores(): Array<StandingsValues> {
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
            player.player.matches.forEach(match => {
                player.gamePoints += (this.scoring.win * match.win) + (this.scoring.loss * match.loss) + (this.scoring.draw + match.draw);
                player.games += match.win + match.loss + match.draw;
                player.matchPoints += match.win > match.loss ? this.scoring.win : match.loss > match.win ? this.scoring.loss : this.scoring.draw;
                player.tiebreaks.cumulative += player.matchPoints;
                player.matches++;
            });
            player.tiebreaks.gameWinPct = player.gamePoints / (player.games * this.scoring.win);
            player.tiebreaks.matchWinPct = player.matchPoints / (player.matches * this.scoring.win);
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
    }

    /**
     * Create a new player
     * @param name Alias of the player
     * @param id ID of the player (randomly assigned if omitted)
     * @returns The newly created player
     */
    createPlayer(name: string, id: string | undefined = undefined): Player {
        if (this.status !== 'setup') {
            throw `Players can only be added during setup`;
        }
        if (this.stageOne.maxPlayers > 0 && this.players.length === this.stageOne.maxPlayers) {
            throw `Maximum number of players (${this.stageOne.maxPlayers}) are enrolled`;
        }
        let ID = id;
        if (ID === undefined) {
            do {
                ID = cryptoRandomString({
                    length: 12,
                    type: 'base64'
                });
            } while (this.players.some(p => p.id === ID));
        } else {
            if (this.players.some(p => p.id === ID)) {
                throw `Player with ID ${ID} already exists`;
            }
        }
        const player = new Player(ID, name);
        this.players.push(player);
        return player;
    }

    /**
     * Remove a player
     * @param id ID of the player
     */
    removePlayer(id: string): void {
        const player = this.players.find(p => p.id === id);
        if (player === undefined) {
            throw `Player with ID ${id} does not exist`;
        }
        if (player.active === false) {
            throw `Player is already marked inactive`;
        }
        player.active = false;
        if ((this.status === 'stage-one' && ['single-elimination', 'double-elimination', 'stepladder'].includes(this.stageOne.format) || this.status === 'stage-two' && ['single-elimination', 'double-elimination', 'stepladder'].includes(this.stageTwo.format))) {
            // check for active match, remove player and move opponent forward - move loss path forward
            const activeMatch = this.matches.find(match => match.active === true && (match.player1.id === player.id || match.player2.id === player.id));
            if (activeMatch !== undefined) {
                const opponent = this.players.find(p => p.id === (activeMatch.player1.id === player.id ? activeMatch.player2.id : activeMatch.player1.id));
                // update active match
                // add result to players
                // check for win path
                // move opponent forward
                // check for loss path
                // either move players in loss match, or change path for previous
            }
            // check if in a match without an opponent, and move path forward
            const waitingMatch = this.matches.find(match => (match.player1.id === player.id && match.player2.id === null) || (match.player2.id === player.id && match.player1.id === null));
            if (waitingMatch !== undefined) {
                // find match that pushes to waiting match
                // adjust path
                // repeat for possible loss path
            }
        } else if (['round-robin', 'double-round-robin'].includes(this.stageOne.format)) {
            // replace player with bye for all rounds beyond the current round
        }
    }

    /** Start the tournament */
    start(): void {
        if ((['single-elimination', 'double-elimination'].includes(this.stageOne.format) && this.players.length < 4) || this.players.length < 2) {
            throw `Insufficient number of players (${this.players.length}) to start event`;
        }
        const players = this.players.filter(p => p.active === true);
        if (this.sorting !== 'none') {
            players.sort((a, b) => this.sorting === 'ascending' ? a.value - b.value : b.value - a.value);
        }
        this.status = 'stage-one';
        this.round++;
        this.#createMatches(players);
        if (this.stageOne.format === 'swiss' && this.stageOne.rounds === 0) {
            this.stageOne.rounds = Math.ceil(Math.log2(this.players.length));
        } else {
            this.stageOne.rounds = this.matches.reduce((max, curr) => Math.max(max, curr.round), 0);
        }
    }

    /** Progress to the next round in the tournament */
    next(): void {
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
        if (this.round > this.stageOne.rounds) {
            if (this.stageTwo.format !== null) {
                this.status = 'stage-two';
                if (this.stageTwo.advance.method === 'points') {
                    this.players.filter(player => player.matches.reduce((sum, match) => match.win > match.loss ? sum + this.scoring.win : match.loss > match.win ? sum + this.scoring.loss : this.scoring.draw, 0) < this.stageTwo.advance.value).forEach(player => player.active = false);
                } else {
                    const standings = this.standings();
                    standings.splice(0, this.stageTwo.advance.value - 1);
                    standings.forEach(s => this.players.find(p => p.id === s.player.id).active = false);
                }
                this.#createMatches(this.standings().map(s => s.player));
            } else {
                this.end();
            }
        } else {
            if (['round-robin', 'double-round-robin'].includes(this.stageOne.format)) {
                const matches = this.matches.filter(m => m.round === this.round);
                matches.forEach(match => {
                    if (match.player1.id === null || match.player2.id === null) {
                        this.players.find(p => p.id === (match.player1.id === null ? match.player2.id : match.player1.id)).addMatch({
                            id: match.id,
                            opponent: null,
                            pairUpDown: false,
                            bye: true,
                            win: Math.ceil(this.scoring.bestOf / 2),
                            loss: 0,
                            draw: 0
                        });
                    } else {
                        match.values = { active: true }
                        this.players.find(p => p.id === match.player1.toString()).addMatch({
                            id: match.id,
                            opponent: match.player2.toString(),
                            pairUpDown: false,
                            bye: false,
                            win: 0,
                            loss: 0,
                            draw: 0
                        });
                        this.players.find(p => p.id === match.player2.toString()).addMatch({
                            id: match.id,
                            opponent: match.player1.toString(),
                            pairUpDown: false,
                            bye: false,
                            win: 0,
                            loss: 0,
                            draw: 0
                        });
                    }
                });
            } else {
                const players = this.players.filter(p => p.active === true);
                if (this.sorting !== 'none') {
                    players.sort((a, b) => this.sorting === 'ascending' ? a.value - b.value : b.value - a.value);
                }
                this.#createMatches(players);
            }
        }
    }

    enterResult(id: string, player1Wins: number, player2Wins: number, draws: number = 0): void {
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
            } else {
                winMatch.values = {
                    player2: {
                        id: winID
                    }
                }
            }
            if (winMatch.player1.id !== null && winMatch.player2.id !== null) {
                winMatch.values = {
                    active: true
                };
                this.players.find(p => p.id === winMatch.player1.id).addMatch({
                    id: winMatch.id,
                    opponent: winMatch.player2.id,
                    pairUpDown: false,
                    bye: false,
                    win: 0,
                    loss: 0,
                    draw: 0
                });
                this.players.find(p => p.id === winMatch.player2.id).addMatch({
                    id: winMatch.id,
                    opponent: winMatch.player1.id,
                    pairUpDown: false,
                    bye: false,
                    win: 0,
                    loss: 0,
                    draw: 0
                });
            }
        }
        if (match.path.loss !== null) {
            const lossID = player1Wins > player2Wins ? match.player2.id : match.player1.id;
            const lossMatch = this.matches.find(m => m.id === match.path.loss);
            if (lossMatch.player1.id === null) {
                lossMatch.values = {
                    player1: {
                        id: lossID
                    }
                };
            } else {
                lossMatch.values = {
                    player2: {
                        id: lossID
                    }
                }
            }
            if (lossMatch.player1.id !== null && lossMatch.player2.id !== null) {
                lossMatch.values = {
                    active: true
                };

                this.players.find(p => p.id === lossMatch.player1.id).addMatch({
                    id: lossMatch.id,
                    opponent: lossMatch.player2.id,
                    pairUpDown: false,
                    bye: false,
                    win: 0,
                    loss: 0,
                    draw: 0
                });
                this.players.find(p => p.id === lossMatch.player2.id).addMatch({
                    id: lossMatch.id,
                    opponent: lossMatch.player1.id,
                    pairUpDown: false,
                    bye: false,
                    win: 0,
                    loss: 0,
                    draw: 0
                });
            }
        }
    }

    clearResult(id: string): void {

    }

    standings(activeOnly: boolean = true): Array<StandingsValues> {
        let players = this.#computeScores();
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
                        } else continue;
                    case 'solkoff':
                        if (a.tiebreaks.solkoff !== b.tiebreaks.solkoff) {
                            return b.tiebreaks.solkoff - a.tiebreaks.solkoff;
                        } else continue;
                    case 'sonneborn berger':
                        if (a.tiebreaks.sonnebornBerger !== b.tiebreaks.sonnebornBerger) {
                            return b.tiebreaks.sonnebornBerger - a.tiebreaks.sonnebornBerger;
                        } else continue;
                    case 'cumulative':
                        if (a.tiebreaks.cumulative !== b.tiebreaks.cumulative) {
                            return b.tiebreaks.cumulative - a.tiebreaks.cumulative;
                        } else if (a.tiebreaks.oppCumulative !== b.tiebreaks.oppCumulative) {
                            return b.tiebreaks.oppCumulative - a.tiebreaks.oppCumulative;
                        } else continue;
                    case 'versus':
                        const matchIDs = a.player.matches.filter(m => m.opponent === b.player.id).map(m => m.id);
                        if (matchIDs.length === 0) {
                            continue;
                        }
                        const pointsA = a.player.matches.filter(m => matchIDs.some(i => i === m.id)).reduce((sum, curr) => curr.win > curr.loss ? sum + this.scoring.win : curr.loss > curr.win ? sum + this.scoring.loss : sum + this.scoring.draw, 0);
                        const pointsB = b.player.matches.filter(m => matchIDs.some(i => i === m.id)).reduce((sum, curr) => curr.win > curr.loss ? sum + this.scoring.win : curr.loss > curr.win ? sum + this.scoring.loss : sum + this.scoring.draw, 0);
                        if (pointsA !== pointsB) {
                            return pointsB - pointsA;
                        } else continue;
                    case 'game win percentage':
                        if (a.tiebreaks.gameWinPct !== b.tiebreaks.gameWinPct) {
                            return b.tiebreaks.gameWinPct - a.tiebreaks.gameWinPct;
                        } else continue;
                    case 'opponent game win percentage':
                        if (a.tiebreaks.oppGameWinPct !== b.tiebreaks.oppGameWinPct) {
                            return b.tiebreaks.oppGameWinPct - a.tiebreaks.oppGameWinPct;
                        } else continue;
                    case 'opponent match win percentage':
                        if (a.tiebreaks.oppMatchWinPct !== b.tiebreaks.oppMatchWinPct) {
                            return b.tiebreaks.oppMatchWinPct - a.tiebreaks.oppMatchWinPct;
                        } else continue;
                    case 'opponent opponent match win percentage':
                        if (a.tiebreaks.oppOppMatchWinPct !== b.tiebreaks.oppOppMatchWinPct) {
                            return b.tiebreaks.oppOppMatchWinPct - a.tiebreaks.oppOppMatchWinPct;
                        } else continue;
                }
            }
            return parseInt(b.player.id, 64) - parseInt(a.player.id, 64);
        });
        return players;
    }

    end(): void {
        this.status = 'complete';
        this.players.forEach(player => player.active = false);
        this.matches.forEach(match => match.active = false);
    }
}