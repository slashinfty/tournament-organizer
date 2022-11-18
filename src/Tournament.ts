import cryptoRandomString from 'crypto-random-string';
import * as Pairings from 'tournament-pairings';
import { SettableTournamentSettings } from './interfaces/SettableTournamentSettings.js';
import { TournamentSettings } from './interfaces/TournamentSettings.js';
import { Match } from './Match.js';
import { Player } from './Player.js';

/** Class representing a tournament */
export class Tournament {
    /** Unique ID of the tournament */
    id: TournamentSettings.id;

    /** Name of the tournament */
    name: TournamentSettings.name;

    /** Current state of the tournament */
    status: TournamentSettings.status;

    /** Current round of the tournament */
    round: TournamentSettings.number;

    /** All players in the tournament */
    players: TournamentSettings.players;

    /** All matches of the tournament */
    matches: TournamentSettings.matches;

    /** Sorting method, if players are rated/seeded */
    sorting: TournamentSettings.sorting;

    /** Details regarding scoring */
    scoring: TournamentSettings.scoring;

    /** Details regarding the tournament */
    stageOne: TournamentSettings.stageOne;

    /** Details regarding playoffs */
    stageTwo: TournamentSettings.stageTwo;

    /**
     * Create a new tournament
     * @param id Unique ID of the tournament
     * @param name Name of the tournament
     * @param format Format of the tournament
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
            rounds: 0,
            maxPlayers: 0
        }
        this.stageTwo = null;
    }

    /** Set tournament options (only changes in options need to be included in the object) */
    set settings(options: SettableTournamentSettings) {
        this.name = options.name || this.name;
        this.status = options.status || this.status;
        this.round = options.round || this.round;
        this.players = options.players || this.players;
        this.matches = options.matches || this.matches;
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
            if (options.stageTwo === null) {
                this.stageTwo = options.stageTwo;
            } else {
                if (this.stageTwo === null) {
                    this.stageTwo = {
                        format: 'single-elimination',
                        consolation: false,
                        advance: {
                            value: 8,
                            method: 'rank'
                        }
                    };
                }
                this.stageTwo.format = options.stageTwo.format || this.stageTwo.format;
                this.stageTwo.consolation = options.stageTwo.consolation || this.stageTwo.consolation;
                if (options.stageTwo.hasOwnProperty('advance')) {
                    this.stageTwo.advance.value = options.stageTwo.advance.value || this.stageTwo.advance.value;
                    this.stageTwo.advance.method = options.stageTwo.advance.method || this.stageTwo.advance.method;
                }
            }
        }
    }

    /**
     * Load existing set of players
     * @param players Array of player objects
     */
    loadPlayers(players: Array<{
        id: string,
        alias: string,
        active: boolean,
        results: Array<{
            id: string,
            round: number,
            match: number,
            opponent: string,
            result: {
                win: number,
                draw: number,
                loss: number,
                pairUpDown: boolean,
                bye: boolean
            } | undefined
        }>
    }>) {
        players.forEach(p => {
            const player = new Player(p.id, p.alias);
            player.data = {
                active: p.active,
                results: p.results
            };
            this.players.push(player);
        });
    }

    /**
     * Create a new player
     * @param alias Alias of the player
     * @param id ID of the player (randomly assigned if omitted)
     * @returns The newly created player
     */
    createPlayer(alias: string, id: string | undefined = undefined): Player {
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
        const player = new Player(ID, alias);
        this.players.push(player);
        return player;
    }

    /**
     * Remove a player
     * @param id ID of the player
     */
    removePlayer(id: string) {
        const player = this.players.find(p => p.id === id);
        if (player === undefined) {
            throw `Player with ID ${id} does not exist`;
        }
        player.active = false;
    }

    // load matches

    /** Create matches for the round/tournament */
    nextRound(): Array<Match> {
        if (this.rounds.current === 0) {
            if (this.players.length < 2) {
                throw 'Insufficient number of players (minimum: 2)';
            }
            this.#createMatches();
        }
        return;
    }

    #createMatches(method: 'single-elimination' | 'double-elimination' | 'swiss' | 'round-robin' | 'double-round-robin') {
        this.rounds.current++;
        if (this.sorting !== 'none') {
            this.players.sort((a, b) => this.sorting === 'ascending' ? a.value - b.value : b.value - a.value);
        }
        if (method === 'single-elimination' || method === 'double-elimination') {
            const matches = method === 'single-elimination' ? Pairings.SingleElimination(this.players.filter(player => player.active === true).map(player => player.id), this.rounds.current, this.consolation, this.sorting !== 'none') : Pairings.DoubleElimination(this.players.filter(player => player.active === true).map(player => player.id), this.rounds.current, this.sorting !== 'none');
            matches.forEach(match => {
                let id;
                do {
                    id = cryptoRandomString({
                        length: 12,
                        type: 'base64'
                    });
                } while (this.matches.some(m => m.id === id));
                const newMatch = new Match(id, match.round, match.match);
                this.matches.push(newMatch);
            });
            matches.forEach(match => {
                const existingMatch = this.matches.find(m => m.round === match.round && m.match === match.match);
                existingMatch.data = {
                    playerA: match.player1 === null ? undefined : match.player1.toString(),
                    playerB: match.player2 === null ? undefined : match.player2.toString(),
                    path: match.hasOwnProperty('win') || match.hasOwnProperty('loss') ? {
                        win: match.hasOwnProperty('win') ? this.matches.find(m => m.round === match.win.round && m.match === match.win.match) : undefined,
                        loss: match.hasOwnProperty('loss') ? this.matches.find(m => m.round === match.loss.round && m.match === match.loss.match) : undefined
                    } : undefined
                };
            });
        }
        if (method === 'swiss') {
            const players = this.players.filter(player => player.active === true).map(player => ({
                id: player.id, //TODO
                score: '',
                pairedUpDown: '',
                receivedBye: '',
                avoid: [],
                rating: ''
            }));
        }
        if (method === 'round-robin' || method === 'double-round-robin') {

        }
    }

    #assignMatches() {

    }

    // create result

    // remove result

    // get standings
}