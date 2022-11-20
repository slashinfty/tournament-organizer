import cryptoRandomString from 'crypto-random-string';
import * as Pairings from 'tournament-pairings';
import { Match } from './Match.js';
import { Player } from './Player.js';
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
                            id: match.player1.toString()
                        },
                        player2: {
                            id: match.player2.toString()
                        }
                    };
                    this.matches.push(newMatch);
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
                        active: match.round === this.round,
                        player1: {
                            id: match.player1.toString()
                        },
                        player2: {
                            id: match.player2.toString()
                        }
                    };
                    this.matches.push(newMatch);
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
                                id: match.player2.toString()
                            },
                            player2: {
                                id: match.player1.toString()
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
                        active: match.player1 !== null && match.player2 !== null,
                        player1: {
                            id: match.player1.toString()
                        },
                        player2: {
                            id: match.player2.toString()
                        }
                    };
                    this.matches.push(newMatch);
                });
                this.matches.filter(match => match.round === this.round && match.player2.id === null).forEach(match => this.result(match.id, Math.ceil(this.scoring.bestOf), 0, 0, true));
                break;
        }
    }

    /**
     * Create a new player
     * @param name Alias of the player
     * @param id ID of the player (randomly assigned if omitted)
     * @returns The newly created player
     */
    createPlayer(name: string, id: string | undefined = undefined): Player {
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
        player.active = false;
    }

    /** Start the tournament */
    start(): void {
        if ((['single-elimination', 'double-elimination'].includes(this.stageOne.format) && this.players.length < 4) || this.players.length < 2) {
            throw `Insufficient number of players to start event`;
        }
        const players = this.players.filter(p => p.active === true);
        if (this.sorting !== 'none') {
            players.sort((a, b) => this.sorting === 'ascending' ? a.value - b.value : b.value - a.value);
        }
        this.status = 'stage-one';
        this.round++;
        this.#createMatches(players);
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
                    //standings
                }
                const players = this.players.filter(p => p.active === true);
                // sort with standings
                this.#createMatches(players);
            } else {
                this.end();
            }
        } else {
            if (['round-robin', 'double-round-robin'].includes(this.stageOne.format)) {
                const matches = this.matches.filter(m => m.round === this.round);
                matches.forEach(match => match.values = { active: true });
            } else {
                const players = this.players.filter(p => p.active === true);
                if (this.sorting !== 'none') {
                    players.sort((a, b) => this.sorting === 'ascending' ? a.value - b.value : b.value - a.value);
                }
                this.#createMatches(players);
            }
        }
    }

    result(id: string, player1Wins: number, player2Wins: number, draws: number = 0, bye: boolean = false): void {

    }

    standings(activeOnly: boolean = true) {

    }

    end(): void {

    }
}