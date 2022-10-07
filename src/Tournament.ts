import cryptoRandomString from 'crypto-random-string';
import * as Pairings from 'tournament-pairings';
import { Match } from './Match.js';
import { Player } from './Player.js';

/** Class representing a tournament */
export class Tournament {
    /** Unique ID of the tournament */
    id: string;

    /** Name of the tournament */
    name: string;

    /** Format of the tournament */
    format: 'single-elimination' | 'double-elimination' | 'swiss' | 'round-robin' | 'double-round-robin';

    /** All players in the tournament */
    players: Array<Player>;

    /** All matches of the tournament */
    matches: Array<Match>;

    /** Current state of the tournament */
    state: 'setup' | 'active' | 'playoffs' | 'inactive';

    /** Existence of a match for third-place in single elimination */
    consolation: boolean;

    /** Details regarding playoffs */
    playoffs: {
        format: 'single-elimination' | 'double-elimination' | 'none',
        cut: {
            type: 'rank' | 'points',
            value: number
        } | 'none'
    }

    /** Details regarding scoring */
    scoring: {
        bestOf: number,
        win: number,
        draw: number,
        loss: number,
        bye: number,
        tiebreaks: Array<
            'median buchholz' |
            'solkoff' |
            'sonneborn berger' |
            'cumulative' |
            'versus' |
            'game win percentage' |
            'opponent game win percentage' |
            'opponent match win percentage' |
            'opponent opponent match win percentage'
        >
    };

    /** If the players are rated or seeded, the sorting method */
    sorting: 'ascending' | 'descending' | 'none';

    /** Details regarding rounds */
    rounds: {
        total: number,
        current: number
    };

    /**
     * Create a new tournament
     * @param id Unique ID of the tournament
     * @param name Name of the tournament
     * @param format Format of the tournament
     */
    constructor(id: string, name: string, format: 'single-elimination' | 'double-elimination' | 'swiss' | 'round-robin' | 'double-round-robin') {
        this.id = id;
        this.name = name;
        this.format = format;
        this.players = [];
        this.matches = [];
        this.state = 'setup';
        this.consolation = false;
        this.playoffs = {
            format: 'none',
            cut: 'none'
        };
        this.scoring = {
            bestOf: 1,
            win: 1,
            draw: 0.5,
            loss: 0,
            bye: 1,
            tiebreaks: format === 'swiss' ? ['solkoff', 'cumulative'] : format === 'round-robin' || format === 'double-round-robin' ? ['sonneborn berger', 'versus'] : []
        };
        this.sorting = 'none';
        this.rounds = {
            total: 0,
            current: 0
        };
    }
    
    /** Get tournament options */
    get options(): {
        id: string,
        name: string,
        format: 'single-elimination' | 'double-elimination' | 'swiss' | 'round-robin' | 'double-round-robin',
        state: 'setup' | 'active' | 'playoffs' | 'inactive',
        consolation: boolean,
        playoffs: {
            format: 'single-elimination' | 'double-elimination' | 'none',
            cut: {
                type: 'rank' | 'points',
                value: number
            } | 'none'
        },
        scoring: {
            bestOf: number,
            win: number,
            draw: number,
            loss: number,
            bye: number,
            tiebreaks: Array<
                'median buchholz' |
                'solkoff' |
                'sonneborn berger' |
                'cumulative' |
                'versus' |
                'game win percentage' |
                'opponent game win percentage' |
                'opponent match win percentage' |
                'opponent opponent match win percentage'
            >
        },
        sorting: 'ascending' | 'descending' | 'none',
        rounds: {
            total: number,
            current: number
        }
    } {
        return {
            id: this.id,
            name: this.name,
            format: this.format,
            state: this.state,
            consolation: this.consolation,
            playoffs: this.playoffs,
            scoring: this.scoring,
            sorting: this.sorting,
            rounds: this.rounds
        };
    }

    /** Set tournament options (only changes in options need to be included in the object) */
    set options(settings: {
        id?: string,
        name?: string,
        format?: 'single-elimination' | 'double-elimination' | 'swiss' | 'round-robin' | 'double-round-robin',
        state?: 'setup' | 'active' | 'playoffs' | 'inactive',
        consolation?: boolean,
        playoffs?: {
            format?: 'single-elimination' | 'double-elimination' | 'none',
            cut?: {
                type: 'rank' | 'points',
                value: number
            } | 'none'
        },
        scoring?: {
            bestOf?: number,
            win?: number,
            draw?: number,
            loss?: number,
            bye?: number,
            tiebreaks?: Array<
                'median buchholz' |
                'solkoff' |
                'sonneborn berger' |
                'cumulative' |
                'versus' |
                'game win percentage' |
                'opponent game win percentage' |
                'opponent match win percentage' |
                'opponent opponent match win percentage'
            >
        },
        sorting?: 'ascending' | 'descending' | 'none',
        rounds?: {
            total?: number,
            current?: number
        }
    }) {
        this.id = settings.id || this.id;
        this.name = settings.name || this.name;
        this.format = settings.format || this.format;
        this.state = settings.state || this.state;
        this.consolation = settings.consolation || this.consolation;
        if (settings.hasOwnProperty('playoffs')) {
            this.playoffs.format = settings.playoffs.format || this.playoffs.format;
            this.playoffs.cut = settings.playoffs.cut || this.playoffs.cut;
        }
        if (settings.hasOwnProperty('scoring')) {
            this.scoring.bestOf = settings.scoring.bestOf || this.scoring.bestOf;
            this.scoring.win = settings.scoring.win || this.scoring.win;
            this.scoring.draw = settings.scoring.draw || this.scoring.draw;
            this.scoring.loss = settings.scoring.loss || this.scoring.loss;
            this.scoring.bye = settings.scoring.bye || this.scoring.bye;
            this.scoring.tiebreaks = settings.scoring.tiebreaks || this.scoring.tiebreaks;
        }
        this.sorting = settings.sorting || this.sorting;
        if (settings.hasOwnProperty('rounds')) {
            this.rounds.total = settings.rounds.total || this.rounds.total;
            this.rounds.current = settings.rounds.current || this.rounds.current;
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