import randomstring from 'randomstring';
import * as Pairings from 'tournament-pairings';
import { Match } from './Match.js';
import { Player } from './Player.js';
import { MatchValues } from '../interfaces/MatchValues.js';
import { PlayerValues } from '../interfaces/PlayerValues.js';
import { StandingsValues } from '../interfaces/StandingsValues.js';
import { TournamentValues } from '../interfaces/TournamentValues.js';
import { SettableTournamentValues } from '../interfaces/SettableTournamentValues.js';

/** 
 * Class representing a tournament.
 * 
 * See {@link TournamentValues} for detailed descriptions of properties.
 */
export class Tournament {
    /** Unique ID of the tournament */
    #id: TournamentValues['id'];

    /** Name of the tournament */
    #name: TournamentValues['name'];

    /** Current state of the tournament */
    #status: TournamentValues['status'];

    /** Current round of the tournament */
    #round: TournamentValues['round'];

    /** All players in the tournament */
    #players: TournamentValues['players'];

    /** All matches of the tournament */
    #matches: TournamentValues['matches'];

    /** If order of players in matches matters */
    #seating: TournamentValues['seating'];

    /** Sorting method, if players are rated/seeded */
    #sorting: TournamentValues['sorting'];

    /** Details regarding scoring */
    #scoring: TournamentValues['scoring'];

    /** Details regarding the tournament */
    #stageOne: TournamentValues['stageOne'];

    /** Details regarding playoffs */
    #stageTwo: TournamentValues['stageTwo'];

    /** Any extra information */
    #meta: TournamentValues['meta'];

    /**
     * Create a new tournament.
     * @param id Unique ID of the tournament
     * @param name Name of the tournament
     */
    constructor(id: string, name: string) {
        this.#id = id;
        this.#name = name;
        this.#status = 'setup';
        this.#round = 0;
        this.#players = [];
        this.#matches = [];
        this.#seating = false;
        this.#sorting = 'none';
        this.#scoring = {
            bestOf: 1,
            win: 1,
            draw: 0.5,
            loss: 0,
            bye: 1,
            tiebreaks: []
        };
        this.#stageOne = {
            format: 'single-elimination',
            consolation: false,
            rounds: 0,
            initialRound: 1,
            maxPlayers: 0
        };
        this.#stageTwo = {
            format: null,
            consolation: false,
            advance: {
                value: 0,
                method: 'all'
            }
        };
        this.#meta = {};
    }

    /** Set tournament options (only changes in options need to be included in the object) */
    set(options: SettableTournamentValues) {
        if (options.hasOwnProperty('scoring')) {
            options.scoring = Object.assign(this.#scoring, options.scoring);
        }
        if (options.hasOwnProperty('stageOne')) {
            options.stageOne = Object.assign(this.#stageOne, options.stageOne);
        }
        if (options.hasOwnProperty('stageTwo')) {
            options.stageTwo = Object.assign(this.#stageTwo, options.stageTwo);
        }
        if (options.hasOwnProperty('meta')) {
            options.meta = Object.assign(this.#meta, options.meta);
        }
        Object.assign(this, options);
    }

    #createMatches(players: Array<Player>) {
        const format = this.#status === 'stage-one' ? this.#stageOne.format : this.#stageTwo.format
        let matches = [];
        switch (format) {
            case 'single-elimination':
            case 'double-elimination':
            case 'stepladder':
                if (format === 'single-elimination') {
                    if (this.#status === 'stage-one') {
                        matches = Pairings.SingleElimination(players.map(p => p.getId()), this.#round, this.#stageOne.consolation, this.#sorting !== 'none');
                    } else {
                        matches = Pairings.SingleElimination(players.map(p => p.getId()), this.#round, this.#stageTwo.consolation, true);
                    }
                    
                } else if (format === 'double-elimination') {
                    matches = Pairings.DoubleElimination(players.map(p => p.getId()), this.#round, this.#status === 'stage-one' ? this.#sorting !== 'none' : true);
                } else if (format === 'stepladder') {
                    matches = Pairings.Stepladder(players.map(p => p.getId()), this.#round, this.#status === 'stage-one' ? this.#sorting !== 'none' : true);
                }
                const newMatches = [];
                matches.forEach(match => {
                    let id: string;
                    do {
                        id = randomstring.generate({
                            length: 12,
                            charset: 'alphanumeric'
                        });
                    } while (this.#matches.some(m => m.getId() === id) || newMatches.some(m => m.id === id));
                    const newMatch = new Match(id, match.round, match.match);
                    newMatch.set({
                        active: match.player1 !== null && match.player2 !== null,
                        player1: {
                            id: match.player1 === null ? null : match.player1.toString()
                        },
                        player2: {
                            id: match.player2 === null ? null : match.player2.toString()
                        }
                    });
                    newMatches.push(newMatch);
                    if (newMatch.getPlayer1().id !== null && newMatch.getPlayer2().id !== null) {
                        this.#players.find(p => p.getId() === match.player1.toString()).addMatch({
                            id: id,
                            opponent: match.player2.toString()
                        });
                        this.#players.find(p => p.getId() === match.player2.toString()).addMatch({
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
                this.#matches = [...this.#matches, ...newMatches];
                break;
            case 'round-robin':
            case 'double-round-robin':
                matches = Pairings.RoundRobin(players.map(p => p.getId()), this.#round, this.#status === 'stage-one' ? this.#sorting !== 'none' : true);
                matches.forEach(match => {
                    let id: string;
                    do {
                        id = randomstring.generate({
                            length: 12,
                            charset: 'alphanumeric'
                        });
                    } while (this.#matches.some(m => m.getId() === id));
                    const newMatch = new Match(id, match.round, match.match);
                    newMatch.set({
                        active: match.round === this.#round && match.player1 !== null && match.player2 !== null,
                        player1: {
                            id: match.player1 === null ? null : match.player1.toString()
                        },
                        player2: {
                            id: match.player2 === null ? null : match.player2.toString()
                        }
                    });
                    this.#matches.push(newMatch);
                    if (newMatch.getPlayer1().id === null || newMatch.getPlayer2().id === null) {
                        newMatch.set({
                            bye: true,
                            player1: {
                                win: Math.ceil(this.#scoring.bestOf / 2)
                            }
                        });
                    }
                    if (match.round === this.#round) {
                        if (newMatch.getPlayer1().id === null || newMatch.getPlayer2().id === null) {
                            this.#players.find(p => p.getId() === (newMatch.getPlayer1().id === null ? newMatch.getPlayer2().id : newMatch.getPlayer1().id)).addMatch({
                                id: id,
                                opponent: null,
                                bye: true,
                                win: Math.ceil(this.#scoring.bestOf / 2)
                            });
                        } else {
                            this.#players.find(p => p.getId() === newMatch.getPlayer1().id).addMatch({
                                id: id,
                                opponent: newMatch.getPlayer2().id
                            });
                            this.#players.find(p => p.getId() === newMatch.getPlayer2().id).addMatch({
                                id: id,
                                opponent: newMatch.getPlayer1().id
                            });
                        }
                    }
                });
                if (format === 'double-round-robin') {
                    matches = Pairings.RoundRobin(players.map(p => p.getId()), this.#matches.reduce((max, curr) => Math.max(max, curr.getRoundNumber()), 0) + 1, this.#status === 'stage-one' ? this.#sorting !== 'none' : true);
                    matches.forEach(match => {
                        let id: string;
                        do {
                            id = randomstring.generate({
                                length: 12,
                                charset: 'alphanumeric'
                            });
                        } while (this.#matches.some(m => m.getId() === id));
                        const newMatch = new Match(id, match.round, match.match);
                        newMatch.set({
                            active: match.round === this.#round,
                            player1: {
                                id: match.player2 === null ? null : match.player2.toString()
                            },
                            player2: {
                                id: match.player1 === null ? null : match.player1.toString()
                            }
                        });
                        this.#matches.push(newMatch);
                    });
                }
                break;
                case 'swiss':
                    const playerArray = players.map(player => ({
                        id: player.getId(),
                        score: player.getMatches().reduce((sum, match) => sum + (match.bye ? this.#scoring.bye : match.win > match.loss ? this.#scoring.win : match.loss > match.win ? this.#scoring.loss : this.#scoring.draw), 0),
                        pairedUpDown: player.getMatches().some(match => match.pairUpDown === true),
                        receivedBye: player.getMatches().some(match => match.bye === true),
                        avoid: player.getMatches().map(match => match.opponent).filter(opp => opp !== null),
                        seating: player.getMatches().map(match => match.seating).filter(seat => seat !== null),
                        rating: player.getValue()
                    }));
                    matches = Pairings.Swiss(playerArray, this.#round, this.#sorting !== 'none', this.#seating);
                    matches.forEach(match => {
                        let id: string;
                        do {
                            id = randomstring.generate({
                                length: 12,
                                charset: 'alphanumeric'
                            });
                        } while (this.#matches.some(m => m.getId() === id));
                        const newMatch = new Match(id, match.round, match.match);
                        newMatch.set({
                            active: match.player2 !== null,
                            player1: {
                                id: match.player1.toString()
                            },
                            player2: {
                                id: match.player2 === null ? null : match.player2.toString()
                            }
                        });
                        this.#matches.push(newMatch);
                        if (newMatch.getPlayer2().id !== null) {
                            const player1Points = this.getPlayer(newMatch.getPlayer1().id).getMatches().reduce((sum, curr) => this.getMatch(curr.id).isActive() === true ? sum : curr.win > curr.loss ? sum + this.#scoring.win : curr.loss > curr.win ? sum + this.#scoring.loss : sum + this.#scoring.draw, 0);
                            const player2Points = this.getPlayer(newMatch.getPlayer2().id).getMatches().reduce((sum, curr) => this.getMatch(curr.id).isActive() === true ? sum : curr.win > curr.loss ? sum + this.#scoring.win : curr.loss > curr.win ? sum + this.#scoring.loss : sum + this.#scoring.draw, 0);
                            this.getPlayer(match.player1.toString()).addMatch({
                                id: id,
                                opponent: match.player2.toString(),
                                pairUpDown: player1Points !== player2Points,
                                seating: this.#seating ? 1 : null
                            });
                            this.getPlayer(match.player2.toString()).addMatch({
                                id: id,
                                opponent: match.player1.toString(),
                                pairUpDown: player1Points !== player2Points,
                                seating: this.#seating ? -1 : null
                            });
                        } else {
                            this.getPlayer(match.player1.toString()).addMatch({
                                id: id,
                                opponent: null,
                                bye: true,
                                win: Math.ceil(this.#scoring.bestOf / 2)
                            });
                            newMatch.set({
                                bye: true,
                                player1: {
                                    win: Math.ceil(this.#scoring.bestOf / 2)
                                }
                            });
                        }
                    });
                break;
        }
    }

    #computeScores(): Array<StandingsValues> {
        const playerScores = this.#players.map(player => ({
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
            if (player.player.getMatches().length === 0) {
                continue;
            }
            player.player.getMatches().sort((a, b) => {
                const matchA = this.getMatch(a.id);
                const matchB = this.getMatch(b.id);
                return matchA.getRoundNumber() - matchB.getRoundNumber();
            });
            player.player.getMatches().filter(match => this.#matches.find(m => m.getId() === match.id && m.isActive() === false)).forEach(match => {
                player.gamePoints += ((match.bye ? this.#scoring.bye : this.#scoring.win) * match.win) + (this.#scoring.loss * match.loss) + (this.#scoring.draw * match.draw);
                player.games += match.win + match.loss + match.draw;
                player.matchPoints += match.bye ? this.#scoring.bye : match.win > match.loss ? this.#scoring.win : match.loss > match.win ? this.#scoring.loss : this.#scoring.draw;
                player.tiebreaks.cumulative += player.matchPoints;
                player.matches++;
            });
            player.tiebreaks.gameWinPct = player.games === 0 ? 0 : player.gamePoints / (player.games * this.#scoring.win);
            player.tiebreaks.matchWinPct = player.matches === 0 ? 0 : player.matchPoints / (player.matches * this.#scoring.win);
        }
        for (let i = 0; i < playerScores.length; i++) {
            const player = playerScores[i];
            const opponents = playerScores.filter(p => player.player.getMatches().some(match => match.opponent === p.player.getId()));
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
                const match = player.player.getMatches().find(m => m.opponent === opp.player.getId());
                if (this.#matches.find(m => m.getId() === match.id).isActive() === true) {
                    return sum;
                }
                return match.win > match.loss ? sum + opp.matchPoints : sum + (0.5 * opp.matchPoints);
            }, 0);
            player.tiebreaks.oppCumulative = opponents.reduce((sum, opp) => sum + opp.tiebreaks.cumulative, 0);
        }
        for (let i = 0; i < playerScores.length; i++) {
            const player = playerScores[i];
            const opponents = playerScores.filter(p => player.player.getMatches().some(match => match.opponent === p.player.getId()));
            if (opponents.length === 0) {
                continue;
            }
            player.tiebreaks.oppOppMatchWinPct = opponents.reduce((sum, opp) => sum + opp.tiebreaks.oppMatchWinPct, 0) / opponents.length;
        }
        return playerScores;
    }

    #sortForStandings(a: StandingsValues, b: StandingsValues): number {
        if (a.matchPoints !== b.matchPoints) {
            return b.matchPoints - a.matchPoints;
        }
        for (let i = 0; i < this.#scoring.tiebreaks.length; i++) {
            switch (this.#scoring.tiebreaks[i]) {
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
                    const matchIDs = a.player.getMatches().filter(m => m.opponent === b.player.getId()).map(m => m.id);
                    if (matchIDs.length === 0) {
                        continue;
                    }
                    const pointsA = a.player.getMatches().filter(m => matchIDs.some(i => i === m.id)).reduce((sum, curr) => curr.win > curr.loss ? sum + this.#scoring.win : curr.loss > curr.win ? sum + this.#scoring.loss : sum + this.#scoring.draw, 0);
                    const pointsB = b.player.getMatches().filter(m => matchIDs.some(i => i === m.id)).reduce((sum, curr) => curr.win > curr.loss ? sum + this.#scoring.win : curr.loss > curr.win ? sum + this.#scoring.loss : sum + this.#scoring.draw, 0);
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
        return parseInt(b.player.getId(), 36) - parseInt(a.player.getId(), 36);
    }

    getId(): TournamentValues['id'] {
        return this.#id;
    }

    getName(): TournamentValues['name'] {
        return this.#name;
    }

    getStatus(): TournamentValues['status'] {
        return this.#status;
    }

    getRoundNumber(): TournamentValues['round'] {
        return this.#round;
    }

    getPlayers(): TournamentValues['players'] {
        return this.#players;
    }

    getActivePlayers(): TournamentValues['players'] {
        return this.#players.filter(p => p.isActive());
    }

    getPlayer(id: PlayerValues['id']): Player {
        const player = this.#players.find(p => p.getId() === id);
        if (player === undefined) {
            throw new Error(`No player found with ID ${id}`);
        }
        return player;
    }

    getMatches(): TournamentValues['matches'] {
        return this.#matches;
    }

    getActiveMatches(): TournamentValues['matches'] {
        return this.#matches.filter(m => m.isActive());
    }

    getMatchesByRound(round: TournamentValues['round']): TournamentValues['matches'] {
        return this.#matches.filter(m => m.getRoundNumber() === round);
    }

    getMatch(id: MatchValues['id']): Match {
        const match = this.#matches.find(m => m.getId() === id);
        if (match === undefined) {
            throw new Error(`No match found with ID ${id}`);
        }
        return match;
    }

    getSeating(): TournamentValues['seating'] {
        return this.#seating;
    }

    getSorting(): TournamentValues['sorting'] {
        return this.#sorting;
    }

    getScoring(): TournamentValues['scoring'] {
        return this.#scoring;
    }

    getStageOne(): TournamentValues['stageOne'] {
        return this.#stageOne;
    }

    getStageTwo(): TournamentValues['stageTwo'] {
        return this.#stageTwo;
    }

    getCurrentFormat(): TournamentValues['stageOne']['format'] | null {
        return this.#status === 'stage-one' ? this.#stageOne.format : this.#status === 'stage-two' ? this.#stageTwo.format : null;
    }

    isElimination(): Boolean {
        if (this.#status === 'stage-one') {
            return ['single-elimination', 'double-elimination', 'stepladder'].includes(this.#stageOne.format);
        } else {
            return this.#status === 'stage-two';
        }
    }

    getValues(): TournamentValues {
        return {
            id: this.#id,
            name: this.#name,
            status: this.#status,
            round: this.#round,
            players: this.#players,
            matches: this.#matches,
            seating: this.#seating,
            sorting: this.#sorting,
            scoring: this.#scoring,
            stageOne: this.#stageOne,
            stageTwo: this.#stageTwo,
            meta: this.#meta
        }
    }

    /**
     * Create a new player.
     * 
     * Throws an error if ID is specified and already exists, if the specified maximum number of players has been reached, if the tournament is in stage one and not Swiss format, or if the tournament is in stage two or complete.
     * @param name Alias of the player
     * @param id ID of the player (randomly assigned if omitted)
     * @returns The newly created player
     */
    createPlayer(name: string, id: string | undefined = undefined): Player {
        if ((this.#status === 'stage-one' && this.#stageOne.format !== 'swiss') || this.#status === 'stage-two' || this.#status === 'complete') {
            throw new Error(`Players can only be added during setup or stage one (if Swiss format)`);
        }
        if (this.#stageOne.maxPlayers > 0 && this.#players.length === this.#stageOne.maxPlayers) {
            throw new Error(`Maximum number of players (${this.#stageOne.maxPlayers}) are enrolled`);
        }
        let ID = id;
        if (ID === undefined) {
            do {
                ID = randomstring.generate({
                    length: 12,
                    charset: 'alphanumeric'
                });
            } while (this.#players.some(p => p.getId() === ID));
        } else {
            if (this.#players.some(p => p.getId() === ID)) {
                throw new Error(`Player with ID ${ID} already exists`);
            }
        }
        const player = new Player(ID, name);
        this.#players.push(player);
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
    removePlayer(id: string): void {
        const player = this.getPlayer(id);
        if (player.isActive() === false) {
            throw new Error(`Player is already marked inactive`);
        }
        player.set({ active: false });
        if (this.isElimination()) {
            const activeMatch = this.#matches.find(match => match.isActive() === true && (match.getPlayer1().id === player.getId() || match.getPlayer2().id === player.getId()));
            if (activeMatch !== undefined) {
                const opponent = this.getPlayer(activeMatch.getPlayer1().id === player.getId() ? activeMatch.getPlayer2().id : activeMatch.getPlayer1().id);
                activeMatch.set({
                    active: false,
                    player1: activeMatch.getPlayer1().id === player.getId() ? {
                        win: 0,
                        loss: Math.ceil(this.#scoring.bestOf / 2)
                    } : {
                        win: Math.ceil(this.#scoring.bestOf / 2),
                        loss: 0
                    },
                    player2: activeMatch.getPlayer1().id === player.getId() ? {
                        win: Math.ceil(this.#scoring.bestOf / 2),
                        loss: 0
                    } : {
                        win: 0,
                        loss: Math.ceil(this.#scoring.bestOf / 2)
                    }
                });
                player.updateMatch(activeMatch.getId(), {
                    loss: Math.ceil(this.#scoring.bestOf / 2)
                });
                opponent.updateMatch(activeMatch.getId(), {
                    win: Math.ceil(this.#scoring.bestOf / 2)
                });
                if (activeMatch.getPath().win !== null) {
                    const winMatch = this.getMatch(activeMatch.getPath().win);
                    if (winMatch.getPlayer1().id === null) {
                        winMatch.set({
                            player1: { id: opponent.getId() }
                        });
                    } else {
                        winMatch.set({
                            player2: { id: opponent.getId() }
                        })
                    }
                    if (winMatch.getPlayer1().id !== null && winMatch.getPlayer2().id !== null) {
                        winMatch.set({ active: true });
                        this.getPlayer(winMatch.getPlayer1().id).addMatch({
                            id: winMatch.getId(),
                            opponent: winMatch.getPlayer2().id
                        });
                        this.getPlayer(winMatch.getPlayer2().id).addMatch({
                            id: winMatch.getId(),
                            opponent: winMatch.getPlayer1().id
                        });
                    }
                }
                if (activeMatch.getPath().loss !== null) {
                    const lossMatch = this.getMatch(activeMatch.getPath().loss);
                    if (lossMatch.getPlayer1().id === null && lossMatch.getPlayer2().id === null) {
                        const prevMatch = this.#matches.find(match => (match.getPath().win === lossMatch.getId() || match.getPath().loss === lossMatch.getId()) && match.getPlayer1().id !== player.getId() && match.getPlayer2().id !== player.getId());
                        prevMatch.set({
                            path: {
                                win: prevMatch.getPath().win === lossMatch.getId() ? lossMatch.getPath().win : prevMatch.getPath().win,
                                loss: prevMatch.getPath().loss === lossMatch.getId() ? lossMatch.getPath().win : prevMatch.getPath().loss
                            }
                        });
                    } else {
                        const waitingPlayer = this.getPlayer(lossMatch.getPlayer1().id === null ? lossMatch.getPlayer2().id : lossMatch.getPlayer1().id);
                        const winMatch = this.getMatch(lossMatch.getPath().win);
                        if (winMatch.getPlayer1().id === null) {
                            winMatch.set({
                                player1: { id: waitingPlayer.getId() }
                            });
                        } else {
                            winMatch.set({
                                player2: { id: waitingPlayer.getId() }
                            })
                        }
                        if (winMatch.getPlayer1().id !== null && winMatch.getPlayer2().id !== null) {
                            winMatch.set({ active: true });
                            this.getPlayer(winMatch.getPlayer1().id).addMatch({
                                id: winMatch.getId(),
                                opponent: winMatch.getPlayer2().id
                            });
                            this.getPlayer(winMatch.getPlayer2().id).addMatch({
                                id: winMatch.getId(),
                                opponent: winMatch.getPlayer1().id
                            });
                        }
                    }
                }
            }
            const waitingMatch = this.#matches.find(match => (match.getPlayer1().id === player.getId() && match.getPlayer2().id === null) || (match.getPlayer2().id === player.getId() && match.getPlayer1().id === null));
            if (waitingMatch !== undefined && waitingMatch.getPath().win !== null) {
                const prevMatch = this.#matches.find(match => (match.getPath().win === waitingMatch.getId() || match.getPath().loss === waitingMatch.getId()) && match.getPlayer1().id !== player.getId() && match.getPlayer2().id !== player.getId());
                prevMatch.set({
                    path: {
                        win: prevMatch.getPath().win === waitingMatch.getId() ? waitingMatch.getPath().win : prevMatch.getPath().win,
                        loss: prevMatch.getPath().loss === waitingMatch.getId() ? waitingMatch.getPath().win : prevMatch.getPath().loss
                    }
                });
                if (waitingMatch.getPath().loss !== undefined) {
                    const prevLossMatch = this.#matches.find(match => (match.getPath().win === waitingMatch.getPath().loss || match.getPath().loss === waitingMatch.getPath().loss) && match.getPlayer1().id !== player.getId() && match.getPlayer2().id !== player.getId());
                    const currLossMatch = this.#matches.find(match => match.getId() === waitingMatch.getPath().loss);
                    prevLossMatch.set({
                        path: {
                            win: prevLossMatch.getPath().win === currLossMatch.getId() ? currLossMatch.getPath().win : prevLossMatch.getPath().win,
                            loss: prevLossMatch.getPath().loss === currLossMatch.getId() ? currLossMatch.getPath().win : prevLossMatch.getPath().loss
                        }
                    })
                }
            }
        } else if (['round-robin', 'double-round-robin'].includes(this.#stageOne.format)) {
            const byeMatches = this.#matches.filter(match => match.getRoundNumber() > this.#round && (match.getPlayer1().id === player.getId() || match.getPlayer2().id === player.getId()));
            byeMatches.forEach(match => {
                match.set({
                    player1: {
                        id: match.getPlayer1().id === player.getId() ? null : match.getPlayer1().id
                    },
                    player2: {
                        id: match.getPlayer2().id === player.getId() ? null : match.getPlayer2().id
                    }
                })
            });
        }
    }

    /** 
     * Start the tournament.
     * 
     * Throws an error if there are an insufficient number of players (4 if double elimination, otherwise 2).
     */
    startTournament(): void {
        const players = this.getActivePlayers();
        if ((this.#stageOne.format === 'double-elimination' && players.length < 4) || players.length < 2) {
            throw new Error(`Insufficient number of players (${players.length}) to start event`);
        }
        if (this.#sorting !== 'none') {
            players.sort((a, b) => this.#sorting === 'ascending' ? a.getValue() - b.getValue() : b.getValue() - a.getValue());
        }
        this.#status = 'stage-one';
        this.#round = this.#stageOne.initialRound;
        this.#createMatches(players);
        if (this.#stageOne.format === 'swiss' && this.#stageOne.rounds === 0) {
            this.#stageOne.rounds = Math.ceil(Math.log2(this.#players.length));
        } else if (this.#stageOne.format !== 'swiss') {
            this.#stageOne.rounds = this.#matches.reduce((max, curr) => Math.max(max, curr.getRoundNumber()), 0);
        }
    }

    /** 
     * Progress to the next round in the tournament.
     * 
     * Throws an error if there are active matches, if the current format is elimination or stepladder, or when attempting to create matches for stage two and there are an insufficient number of players.
     */
    nextRound(): void {
        if (this.#status !== 'stage-one') {
            throw new Error(`Can only advance rounds during stage one`);
        }
        if (['single-elimination', 'double-elimination', 'stepladder'].includes(this.#stageOne.format)) {
            throw new Error(`Can not advance rounds in elimination or stepladder`);
        }
        if (this.getActiveMatches().length > 0) {
            throw new Error(`Can not advance rounds with active matches`);
        }
        this.#round++;
        if (this.#round > this.#stageOne.rounds + this.#stageOne.initialRound - 1) {
            if (this.#stageTwo.format !== null) {
                this.#status = 'stage-two';
                if (this.#stageTwo.advance.method === 'points') {
                    this.#players.filter(player => player.getMatches().reduce((sum, match) => match.win > match.loss ? sum + this.#scoring.win : match.loss > match.win ? sum + this.#scoring.loss : this.#scoring.draw, 0) < this.#stageTwo.advance.value).forEach(player => player.set({ active: false }));
                } else if (this.#stageTwo.advance.method === 'rank') {
                    const standings = this.getStandings();
                    standings.splice(0, this.#stageTwo.advance.value);
                    standings.forEach(s => this.getPlayer(s.player.getId()).set({ active: false }));
                }
                if ((this.#stageTwo.format === 'double-elimination' && this.getActivePlayers().length < 4) || this.getActivePlayers().length < 2) {
                    throw new Error(`Insufficient number of players (${this.getActivePlayers().length}) to create stage two matches`);
                }
                this.#createMatches(this.getStandings().map(s => s.player).filter(p => p.isActive() === true));
            } else {
                throw new Error(`Predetermined number of rounds have been completed`);
            }
        } else {
            if (['round-robin', 'double-round-robin'].includes(this.#stageOne.format)) {
                const matches = this.getMatchesByRound(this.#round);
                matches.forEach(match => {
                    if (match.getPlayer1().id === null || match.getPlayer2().id === null) {
                        this.getPlayer(match.getPlayer1().id === null ? match.getPlayer2().id : match.getPlayer1().id).addMatch({
                            id: match.getId(),
                            opponent: null,
                            bye: true,
                            win: Math.ceil(this.#scoring.bestOf / 2)
                        });
                        match.set({
                            bye: true,
                            player1: { win: match.getPlayer2().id === null ? Math.ceil(this.#scoring.bestOf / 2) : 0  },
                            player2: { win: match.getPlayer1().id === null ? Math.ceil(this.#scoring.bestOf / 2) : 0 }
                        })
                    } else {
                        match.set({ active: true });
                        this.getPlayer(match.getPlayer1().id).addMatch({
                            id: match.getId(),
                            opponent: match.getPlayer2().id
                        });
                        this.getPlayer(match.getPlayer2().id).addMatch({
                            id: match.getId(),
                            opponent: match.getPlayer1().id
                        });
                    }
                });
            } else {
                const players = this.getActivePlayers();
                if (this.#sorting !== 'none') {
                    players.sort((a, b) => this.#sorting === 'ascending' ? a.getValue() - b.getValue() : b.getValue() - a.getValue());
                }
                this.#createMatches(players);
            }
        }
    }

    /**
     * Updates the result of a match.
     * 
     * Throws an error if no match has the ID specified or any player scores more than half the best of value
     * 
     * In elimination and stepladder formats, moves players to their appropriate next matches.
     * @param id ID of the match
     * @param player1Wins Number of wins for player one
     * @param player2Wins Number of wins for player two
     * @param draws Number of draws
     */
    enterResult(id: string, player1Wins: number, player2Wins: number, draws: number = 0): void {
        const match = this.getMatch(id);
        if (player1Wins > Math.round(this.#scoring.bestOf / 2) || player2Wins > Math.round(this.#scoring.bestOf / 2)) {
            throw new Error(`Players can not win more than ${Math.round(this.#scoring.bestOf / 2)} games in a match`);
        }
        match.set({
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
        });
        const player1 = this.getPlayer(match.getPlayer1().id);
        player1.updateMatch(match.getId(), {
            win: player1Wins,
            loss: player2Wins,
            draw: draws
        });
        const player2 = this.getPlayer(match.getPlayer2().id);
        player2.updateMatch(match.getId(), {
            win: player2Wins,
            loss: player1Wins,
            draw: draws
        });
        if (match.getPath().win !== null) {
            const winID = player1Wins > player2Wins ? match.getPlayer1().id : match.getPlayer2().id;
            const winMatch = this.getMatch(match.getPath().win);
            if (winMatch.getPlayer1().id === null) {
                winMatch.set({
                    player1: { id: winID }
                });
            } else {
                winMatch.set({
                    player2: { id: winID }
                })
            }
            if (winMatch.getPlayer1().id !== null && winMatch.getPlayer2().id !== null) {
                winMatch.set({ active: true });
                this.getPlayer(winMatch.getPlayer1().id).addMatch({
                    id: winMatch.getId(),
                    opponent: winMatch.getPlayer2().id
                });
                this.getPlayer(winMatch.getPlayer2().id).addMatch({
                    id: winMatch.getId(),
                    opponent: winMatch.getPlayer1().id
                });
            }
        }
        if (match.getPath().loss !== null) {
            const lossMatch = this.getMatch(match.getPath().loss);
            if (lossMatch.getPlayer1().id === null) {
                lossMatch.set({
                    player1: { id: match.getLoser().id }
                });
            } else {
                lossMatch.set({
                    player2: { id: match.getLoser().id }
                });
            }
            if (lossMatch.getPlayer1().id !== null && lossMatch.getPlayer2().id !== null) {
                lossMatch.set({ active: true });
                this.getPlayer(lossMatch.getPlayer1().id).addMatch({
                    id: lossMatch.getId(),
                    opponent: lossMatch.getPlayer2().id
                });
                this.getPlayer(lossMatch.getPlayer2().id).addMatch({
                    id: lossMatch.getId(),
                    opponent: lossMatch.getPlayer1().id
                });
            }
        } else if (this.isElimination()) {
            if (this.getCurrentFormat() === 'double-elimination' && match.getPath().win === null && match.getMatchNumber() === 1) {
                let id: string;
                do {
                    id = randomstring.generate({
                        length: 12,
                        charset: 'alphanumeric'
                    });
                } while (this.#matches.some(m => m.getId() === id));
                const newMatch = new Match(id, match.getRoundNumber(), 0);
                newMatch.set({
                    active: true,
                    player1: { id: match.getWinner().id },
                    player2: { id: match.getLoser().id }
                });
                this.#matches.push(newMatch);
                this.getPlayer(newMatch.getPlayer1().id).addMatch({
                    id: id,
                    opponent: newMatch.getPlayer2().id
                });
                this.getPlayer(newMatch.getPlayer2().id).addMatch({
                    id: id,
                    opponent: newMatch.getPlayer1().id
                });
            } else {
                this.getPlayer(match.getLoser().id).set({ active: false });
            }
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
    clearResult(id: string): void {
        const match = this.getMatch(id);
        match.set({
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
        });
        const player1 = this.getPlayer(match.getPlayer1().id);
        const player2 = this.getPlayer(match.getPlayer2().id);
        player1.set({ active: true });
        player1.updateMatch(match.getId(), {
            win: 0,
            loss: 0,
            draw: 0
        });
        player2.set({ active: true });
        player2.updateMatch(match.getId(), {
            win: 0,
            loss: 0,
            draw: 0
        });
        if (match.getPath().win !== null) {
            const winMatch = this.getMatch(match.getPath().win);
            if (winMatch.isActive() === true) {
                this.getPlayer(winMatch.getPlayer1().id).removeMatch(winMatch.getId());
                this.getPlayer(winMatch.getPlayer2().id).removeMatch(winMatch.getId());
            }
            winMatch.set({
                active: false,
                player1: { id: winMatch.getPlayer1().id === player1.getId() || winMatch.getPlayer1().id === player2.getId() ? null : winMatch.getPlayer1().id },
                player2: { id: winMatch.getPlayer2().id === player1.getId() || winMatch.getPlayer2().id === player2.getId() ? null : winMatch.getPlayer2().id }
            });
        }
        if (match.getPath().loss !== null) {
            const lossMatch = this.getMatch(match.getPath().loss);
            if (lossMatch.isActive() === true) {
                this.getPlayer(lossMatch.getPlayer1().id).removeMatch(lossMatch.getId());
                this.getPlayer(lossMatch.getPlayer2().id).removeMatch(lossMatch.getId());
            }
            lossMatch.set({
                active: false,
                player1: { id: lossMatch.getPlayer1().id === player1.getId() || lossMatch.getPlayer1().id === player2.getId() ? null : lossMatch.getPlayer1().id },
                player2: { id: lossMatch.getPlayer2().id === player1.getId() || lossMatch.getPlayer2().id === player2.getId() ? null : lossMatch.getPlayer2().id }
            });
        }
    }

    /**
     * Assigns a bye to a player in a specified round.
     * 
     * Throws an error if it is not actively Swiss pairings, no player has the ID specified, if the player is already inactive, or if the player already has a match in the round.
     * @param id The ID of the player
     * @param round The round number
     */
    assignBye(id: string, round: number): void {
        if (this.#status !== 'stage-one' || this.#stageOne.format !== 'swiss') {
            throw new Error(`Can only assign byes during Swiss pairings`);
        }
        const player = this.getPlayer(id);
        if (player.isActive() === false) {
            throw new Error(`Player is currently inactive`);
        }
        if (player.getMatches().some(match => this.#matches.find(m => m.getId() === match.id).getRoundNumber() === round)) {
            throw new Error(`Player already has a match in round ${round}`);
        }
        let byeID: string;
        do {
            byeID = randomstring.generate({
                length: 12,
                charset: 'alphanumeric'
            });
        } while (this.#matches.some(m => m.getId() === byeID));
        const bye = new Match(byeID, round, 0);
        bye.set({
            bye: true,
            player1: {
                id: player.getId(),
                win: Math.ceil(this.#scoring.bestOf / 2)
            },
            player2: { loss: Math.ceil(this.#scoring.bestOf / 2) }
        });
        player.addMatch({
            id: byeID,
            opponent: null,
            bye: true,
            win: Math.ceil(this.#scoring.bestOf / 2)
        });
        this.#matches.push(bye);
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
    assignLoss(id: string, round: number): void {
        if (this.#status !== 'stage-one' || this.#stageOne.format !== 'swiss') {
            throw new Error(`Can only assign losses during Swiss pairings`);
        }
        const player = this.getPlayer(id);
        if (player.isActive() === false) {
            throw new Error(`Player is currently inactive`);
        }
        if (player.getMatches().some(match => this.#matches.find(m => m.getId() === match.id).getRoundNumber() === round)) {
            const currentMatch = this.getMatchesByRound(round).find(match => match.getPlayer1().id === player.getId() || match.getPlayer2().id === player.getId());
            this.#matches.splice(this.#matches.findIndex(match => match.getId() === currentMatch.getId()), 1);
            player.removeMatch(currentMatch.getId());
            const opponent = this.getPlayer(currentMatch.getPlayer1().id === player.getId() ? currentMatch.getPlayer2().id : currentMatch.getPlayer1().id);
            if (opponent !== undefined) {
                opponent.removeMatch(currentMatch.getId());
                this.assignBye(opponent.getId(), round);
            }
        }
        let lossID: string;
        do {
            lossID = randomstring.generate({
                length: 12,
                charset: 'alphanumeric'
            });
        } while (this.#matches.some(m => m.getId() === lossID));
        const loss = new Match(lossID, round, 0);
        loss.set({
            loss: true,
            player1: {
                id: player.getId(),
                loss: Math.ceil(this.#scoring.bestOf / 2)
            },
            player2: { win: Math.ceil(this.#scoring.bestOf / 2) }
        });
        player.addMatch({
            id: lossID,
            opponent: null,
            loss: Math.ceil(this.#scoring.bestOf / 2)
        });
        this.#matches.push(loss);
    }

    /**
     * Computes tiebreakers for all players and ranks the players by points and tiebreakers.
     * @param activeOnly If the array contains only active players
     * @returns A sorted array of players with scores and tiebreaker values
     */
    getStandings(): Array<StandingsValues> {
        if (['single-elimination', 'double-elimination', 'stepladder'].includes(this.#stageOne.format) || ((this.#status === 'stage-two' || this.#status === 'complete') && ['single-elimination', 'double-elimination', 'stepladder'].includes(this.#stageTwo.format))) {
            let players = this.#computeScores();
            const activePlayers = players.filter(p => p.player.isActive()).sort((a, b) => this.#sortForStandings(a, b));
            players = players.filter(p => !activePlayers.includes(p));
            let eliminatedPlayers = [];
            const maximumRound = this.getMatches().reduce((max, match) => Math.max(max, match.getRoundNumber()), 0);
            const initialEliminationRound = this.getMatches().filter(m => m.getPath().win !== null).reduce((min, match) => Math.min(min, match.getRoundNumber()), maximumRound);
            const eliminationMatches = this.getMatches().filter(m => m.getRoundNumber() >= initialEliminationRound && m.getPath().loss === null);
            const finalsRoundNumber = eliminationMatches.find(m => m.getPath().win === null).getRoundNumber();
            eliminationMatches.filter(m => m.getRoundNumber() === finalsRoundNumber).sort((a, b) => a.getMatchNumber() - b.getMatchNumber()).forEach(match => {
                const winningPlayer = players.find(p => p.player.getId() === match.getWinner().id);
                const losingPlayer = players.find(p => p.player.getId() === match.getLoser().id);
                if (match.hasEnded() && !eliminatedPlayers.includes(winningPlayer) && !eliminatedPlayers.includes(losingPlayer)) {
                    eliminatedPlayers.push(winningPlayer, losingPlayer);
                }
            });
            for (let i = maximumRound; i >= initialEliminationRound; i--) {
                if (i === finalsRoundNumber) continue;
                const currentRoundEliminatedPlayers = [];
                eliminationMatches.filter(m => m.getRoundNumber() === i && m.hasEnded()).sort((a, b) => a.getMatchNumber() - b.getMatchNumber()).forEach(match => {
                    currentRoundEliminatedPlayers.push(players.find(p => p.player.getId() === match.getLoser().id));
                });
                eliminatedPlayers = [...eliminatedPlayers, ...currentRoundEliminatedPlayers.sort((a, b) => this.#sortForStandings(a, b))];
            }
            players = players.filter(p => !eliminatedPlayers.includes(p));
            return [...activePlayers, ...eliminatedPlayers, ...players.sort((a, b) => this.#sortForStandings(a, b))];
        } else {
            return this.#computeScores().sort((a, b) => this.#sortForStandings(a, b));
        }
    }

    /**
     * Ends the tournament and marks all players and matches as inactive.
     */
    endTournament(): void {
        this.#status = 'complete';
        this.#players.forEach(player => player.set({ active: false }));
        this.#matches.forEach(match => match.set({ active: false }));
    }
}
