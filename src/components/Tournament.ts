import randomstring from 'randomstring';
import * as Pairings from 'tournament-pairings';

import { MatchValues } from '../interfaces/MatchValues.js';
import { PlayerValues } from '../interfaces/PlayerValues.js';
import { StandingsValues } from '../interfaces/StandingsValues.js';
import { TournamentValues } from '../interfaces/TournamentValues.js';
import { SettableTournamentValues } from '../interfaces/SettableTournamentValues.js';
import { ExportedTournamentValues } from '../interfaces/ExportedTournamentValues.js';

import { Match } from './Match.js';
import { Player } from './Player.js';

/** 
 * Class representing a tournament.
 * 
 * See {@link TournamentValues} for detailed descriptions of properties.
 */
export class Tournament {
    /** Unique ID of the tournament */
    private id: TournamentValues['id'];

    /** Name of the tournament */
    private name: TournamentValues['name'];

    /** Current state of the tournament */
    private status: TournamentValues['status'];

    /** Current round of the tournament */
    private round: TournamentValues['round'];

    /** All players in the tournament */
    private players: TournamentValues['players'];

    /** All matches of the tournament */
    private matches: TournamentValues['matches'];

    /** If order of players in matches matters */
    private seatings: TournamentValues['seating'];

    /** Sorting method, if players are rated/seeded */
    private sorting: TournamentValues['sorting'];

    /** Details regarding scoring */
    private scoring: TournamentValues['scoring'];

    /** Details regarding the tournament */
    private stageOne: TournamentValues['stageOne'];

    /** Details regarding playoffs */
    private stageTwo: TournamentValues['stageTwo'];

    /** Any extra information */
    private meta: TournamentValues['meta'];

    /**
     * Create a new tournament.
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
        this.seatings = false;
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
    set(options: SettableTournamentValues) {
        if (options.hasOwnProperty('name')) this.name = options.name;
        if (options.hasOwnProperty('status')) this.status = options.status;
        if (options.hasOwnProperty('round')) this.round = options.round;
        if (options.hasOwnProperty('matches')) this.matches = [...this.matches, ...options.matches];
        if (options.hasOwnProperty('seating')) this.seatings = options.seating;
        if (options.hasOwnProperty('sorting')) this.sorting = options.sorting;
        if (options.hasOwnProperty('scoring')) Object.assign(this.scoring, options.scoring);
        if (options.hasOwnProperty('stageOne')) Object.assign(this.stageOne, options.stageOne);
        if (options.hasOwnProperty('stageTwo')) Object.assign(this.stageTwo, options.stageTwo);
        if (options.hasOwnProperty('meta')) Object.assign(this.meta, options.meta);
    }

    /**
     * Create matches using the pairings library
     * @param players The players who can be assigned to new matches
     */
    private createMatches(players: Array<Player>): void {
        const format = this.status === 'stage-one' ? this.getStageOne().format : this.getStageTwo().format
        let matches = [];
        switch (format) {
            case 'single-elimination':
            case 'double-elimination':
            case 'stepladder':
                if (format === 'single-elimination') {
                    if (this.status === 'stage-one') {
                        matches = Pairings.SingleElimination(players.map(p => p.getId()), this.round, this.getStageOne().consolation, this.getSorting() !== 'none');
                    } else {
                        matches = Pairings.SingleElimination(players.map(p => p.getId()), this.round, this.getStageTwo().consolation, true);
                    }
                    
                } else if (format === 'double-elimination') {
                    matches = Pairings.DoubleElimination(players.map(p => p.getId()), this.round, this.status === 'stage-one' ? this.getSorting() !== 'none' : true);
                } else if (format === 'stepladder') {
                    matches = Pairings.Stepladder(players.map(p => p.getId()), this.round, this.status === 'stage-one' ? this.getSorting() !== 'none' : true);
                }
                const newMatches = [];
                matches.forEach(match => {
                    let id: string;
                    do {
                        id = randomstring.generate({
                            length: 12,
                            charset: 'alphanumeric'
                        });
                    } while (this.matches.some(m => m.getId() === id) || newMatches.some(m => m.id === id));
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
                        this.getPlayer(match.player1.toString()).addMatch({
                            id: id,
                            opponent: match.player2.toString(),
                            seating: this.seatings ? 1 : null
                        });
                        this.getPlayer(match.player2.toString()).addMatch({
                            id: id,
                            opponent: match.player1.toString(),
                            seating: this.seatings ? -1 : null
                        });
                    }
                });
                newMatches.forEach(match => {
                    const origMatch = matches.find(m => m.round === match.getRoundNumber() && m.match === match.getMatchNumber());
                    const winPath = origMatch.hasOwnProperty('win') ? newMatches.find(m => m.getRoundNumber() === origMatch.win.round && m.getMatchNumber() === origMatch.win.match).getId() : null;
                    const lossPath = origMatch.hasOwnProperty('loss') ? newMatches.find(m => m.getRoundNumber() === origMatch.loss.round && m.getMatchNumber() === origMatch.loss.match).getId() : null;
                    match.set({
                        path: {
                            win: winPath,
                            loss: lossPath
                        }
                    });
                });
                this.matches = [...this.matches, ...newMatches];
                break;
            case 'round-robin':
            case 'double-round-robin':
                matches = Pairings.RoundRobin(players.map(p => p.getId()), this.round, this.status === 'stage-one' ? this.getSorting() !== 'none' : true);
                matches.forEach(match => {
                    let id: string;
                    do {
                        id = randomstring.generate({
                            length: 12,
                            charset: 'alphanumeric'
                        });
                    } while (this.matches.some(m => m.getId() === id));
                    const newMatch = new Match(id, match.round, match.match);
                    newMatch.set({
                        active: match.round === this.round && match.player1 !== null && match.player2 !== null,
                        player1: {
                            id: match.player1 === null ? null : match.player1.toString()
                        },
                        player2: {
                            id: match.player2 === null ? null : match.player2.toString()
                        }
                    });
                    this.matches.push(newMatch);
                    if (newMatch.getPlayer1().id === null || newMatch.getPlayer2().id === null) {
                        newMatch.set({
                            bye: true,
                            player1: {
                                win: Math.ceil(this.getScoring().bestOf / 2)
                            }
                        });
                    }
                    if (match.round === this.round) {
                        if (newMatch.getPlayer1().id === null || newMatch.getPlayer2().id === null) {
                            this.getPlayer(newMatch.getPlayer1().id === null ? newMatch.getPlayer2().id : newMatch.getPlayer1().id).addMatch({
                                id: id,
                                opponent: null,
                                bye: true,
                                win: Math.ceil(this.getScoring().bestOf / 2)
                            });
                        } else {
                            this.getPlayer(newMatch.getPlayer1().id).addMatch({
                                id: id,
                                opponent: newMatch.getPlayer2().id,
                                seating: this.seatings ? 1 : null
                            });
                            this.getPlayer(newMatch.getPlayer2().id).addMatch({
                                id: id,
                                opponent: newMatch.getPlayer1().id,
                                seating: this.seatings ? -1 : null
                            });
                        }
                    }
                });
                if (format === 'double-round-robin') {
                    matches = Pairings.RoundRobin(players.map(p => p.getId()), Math.max(...this.getMatches().map(match => match.getRoundNumber())) + 1, this.status === 'stage-one' ? this.getSorting() !== 'none' : true);
                    matches.forEach(match => {
                        let id: string;
                        do {
                            id = randomstring.generate({
                                length: 12,
                                charset: 'alphanumeric'
                            });
                        } while (this.matches.some(m => m.getId() === id));
                        const newMatch = new Match(id, match.round, match.match);
                        newMatch.set({
                            active: match.round === this.round,
                            player1: {
                                id: match.player2 === null ? null : match.player2.toString()
                            },
                            player2: {
                                id: match.player1 === null ? null : match.player1.toString()
                            }
                        });
                        this.matches.push(newMatch);
                    });
                }
                break;
                case 'swiss':
                    const playerArray = players.map(player => ({
                        id: player.getId(),
                        score: player.getMatches().reduce((sum, match) => sum + (match.bye ? this.getScoring().bye : match.win > match.loss ? this.getScoring().win : match.loss > match.win ? this.getScoring().loss : this.getScoring().draw), 0),
                        pairedUpDown: player.getMatches().some(match => match.pairUpDown === true),
                        receivedBye: player.getMatches().some(match => match.bye === true),
                        avoid: player.getMatches().map(match => match.opponent).filter(opp => opp !== null),
                        seating: player.getMatches().map(match => match.seating).filter(seat => seat !== null),
                        rating: player.getValue()
                    }));
                    matches = Pairings.Swiss(playerArray, this.round, this.getSorting() !== 'none', this.seatings);
                    matches.forEach(match => {
                        let id: string;
                        do {
                            id = randomstring.generate({
                                length: 12,
                                charset: 'alphanumeric'
                            });
                        } while (this.matches.some(m => m.getId() === id));
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
                        this.matches.push(newMatch);
                        if (newMatch.getPlayer2().id !== null) {
                            const player1Points = this.getPlayer(newMatch.getPlayer1().id).getMatches().reduce((sum, curr) => this.getMatch(curr.id).isActive() === true ? sum : curr.win > curr.loss ? sum + this.getScoring().win : curr.loss > curr.win ? sum + this.getScoring().loss : sum + this.getScoring().draw, 0);
                            const player2Points = this.getPlayer(newMatch.getPlayer2().id).getMatches().reduce((sum, curr) => this.getMatch(curr.id).isActive() === true ? sum : curr.win > curr.loss ? sum + this.getScoring().win : curr.loss > curr.win ? sum + this.getScoring().loss : sum + this.getScoring().draw, 0);
                            this.getPlayer(match.player1.toString()).addMatch({
                                id: id,
                                opponent: match.player2.toString(),
                                pairUpDown: player1Points !== player2Points,
                                seating: this.seatings ? 1 : null
                            });
                            this.getPlayer(match.player2.toString()).addMatch({
                                id: id,
                                opponent: match.player1.toString(),
                                pairUpDown: player1Points !== player2Points,
                                seating: this.seatings ? -1 : null
                            });
                        } else {
                            this.getPlayer(match.player1.toString()).addMatch({
                                id: id,
                                opponent: null,
                                bye: true,
                                win: Math.ceil(this.getScoring().bestOf / 2)
                            });
                            newMatch.set({
                                bye: true,
                                player1: {
                                    win: Math.ceil(this.getScoring().bestOf / 2)
                                }
                            });
                        }
                    });
                break;
        }
    }

    /**
     * Compute points and tiebreakers
     * @param maxRound The maximum round for scores and tiebreaks to be computed through
     * @returns A standings array
     */
    private computeScores(maxRound: number): Array<StandingsValues> {
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
                koyaSystem: 0,
                cumulative: 0,
                oppCumulative: 0,
                earnedWins: 0,
                earnedLosses: 0,
                neighboringPoints: 0,
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
            player.player.getMatches().filter(match => this.getMatches().find(m => m.getId() === match.id && m.isActive() === false) && this.getMatch(match.id).getRoundNumber() <= maxRound).forEach(match => {
                player.gamePoints += ((match.bye ? this.getScoring().bye : this.getScoring().win) * match.win) + (this.getScoring().loss * match.loss) + (this.getScoring().draw * match.draw);
                player.games += match.win + match.loss + match.draw;
                player.matchPoints += match.bye ? this.getScoring().bye : match.win > match.loss ? this.getScoring().win : match.loss > match.win ? this.getScoring().loss : this.getScoring().draw;
                player.tiebreaks.cumulative += player.matchPoints;
                if (match.bye === false && match.win > match.loss) player.tiebreaks.earnedWins++;
                if (match.opponent !== null && match.loss > match.win) player.tiebreaks.earnedLosses--;
                player.matches++;
            });
            player.tiebreaks.gameWinPct = player.games === 0 ? 0 : player.gamePoints / (player.games * this.getScoring().win);
            player.tiebreaks.matchWinPct = player.matches === 0 ? 0 : player.matchPoints / (player.matches * this.getScoring().win);
        }
        for (let i = 0; i < playerScores.length; i++) {
            const player = playerScores[i];
            const opponents = playerScores.filter(p => player.player.getMatches().some(match => match.opponent === p.player.getId() && this.getMatch(match.id).getRoundNumber() <= maxRound));
            if (opponents.length === 0) {
                continue;
            }
            const neighbors = opponents.filter(opponent => opponent.matchPoints === player.matchPoints);
            player.tiebreaks.neighboringPoints = neighbors.reduce((sum, opp) => {
                const match = player.player.getMatches().find(m => m.opponent === opp.player.getId());
                return match.win > match.loss ? sum + this.getScoring().win : match.loss > match.win ? sum + this.getScoring().loss : sum + this.getScoring().draw;
            }, 0);
            player.tiebreaks.oppMatchWinPct = opponents.reduce((sum, opp) => sum + opp.tiebreaks.matchWinPct, 0) / opponents.length;
            player.tiebreaks.oppGameWinPct = opponents.reduce((sum, opp) => sum + opp.tiebreaks.gameWinPct, 0) / opponents.length;
            const oppMatchPoints = opponents.map(opp => opp.matchPoints);
            player.tiebreaks.solkoff = oppMatchPoints.reduce((sum, curr) => sum + curr, 0);
            if (oppMatchPoints.length > 2) {
                oppMatchPoints.splice(oppMatchPoints.indexOf(Math.max(...oppMatchPoints)), 1);
                oppMatchPoints.splice(oppMatchPoints.indexOf(Math.min(...oppMatchPoints)), 1);
                player.tiebreaks.medianBuchholz = oppMatchPoints.reduce((sum, curr) => sum + curr, 0);
            }
            player.tiebreaks.sonnebornBerger = opponents.reduce((sum, opp) => {
                const match = player.player.getMatches().find(m => m.opponent === opp.player.getId());
                if (this.getMatches().find(m => m.getId() === match.id).isActive() === true) {
                    return sum;
                }
                return match.win > match.loss ? sum + opp.matchPoints : match.win < match.loss ? sum : sum + (0.5 * opp.matchPoints);
            }, 0);
            player.tiebreaks.koyaSystem = opponents.reduce((sum, opp) => {
                const match = player.player.getMatches().find(m => m.opponent === opp.player.getId());
                if (this.getMatches().find(m => m.getId() === match.id).isActive() === true || opp.matchPoints < 0.5 * this.getScoring().win * opp.matches) {
                    return sum;
                }
                return match.win > match.loss ? sum + this.getScoring().win : match.win < match.loss ? sum + this.getScoring().loss : sum + this.getScoring().draw;
            }, 0);
            player.tiebreaks.oppCumulative = opponents.reduce((sum, opp) => sum + opp.tiebreaks.cumulative, 0);
        }
        for (let i = 0; i < playerScores.length; i++) {
            const player = playerScores[i];
            const opponents = playerScores.filter(p => player.player.getMatches().some(match => match.opponent === p.player.getId() && this.getMatch(match.id).getRoundNumber() <= maxRound));
            if (opponents.length === 0) {
                continue;
            }
            player.tiebreaks.oppOppMatchWinPct = opponents.reduce((sum, opp) => sum + opp.tiebreaks.oppMatchWinPct, 0) / opponents.length;
        }
        return playerScores;
    }

    /**
     * Sort players by points and tiebreaks
     * @param a The points and tiebreaks of one player
     * @param b The points and tiebreaks of another player
     * @param r The maximum round number to consider for versus tiebreaks
     * @returns A positive or negative number for sorting
     */
    private sortForStandings(a: StandingsValues, b: StandingsValues, r: TournamentValues['round']): number {
        if (a.matchPoints !== b.matchPoints) {
            return b.matchPoints - a.matchPoints;
        }
        for (let i = 0; i < this.getScoring().tiebreaks.length; i++) {
            switch (this.getScoring().tiebreaks[i]) {
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
                case 'koya system':
                    if (a.tiebreaks.koyaSystem !== b.tiebreaks.koyaSystem) {
                        return b.tiebreaks.koyaSystem - a.tiebreaks.koyaSystem;
                    } else continue;
                case 'cumulative':
                    if (a.tiebreaks.cumulative !== b.tiebreaks.cumulative) {
                        return b.tiebreaks.cumulative - a.tiebreaks.cumulative;
                    } else if (a.tiebreaks.oppCumulative !== b.tiebreaks.oppCumulative) {
                        return b.tiebreaks.oppCumulative - a.tiebreaks.oppCumulative;
                    } else continue;
                case 'earned wins':
                    if (a.tiebreaks.earnedWins !== b.tiebreaks.earnedWins) {
                        return b.tiebreaks.earnedWins - a.tiebreaks.earnedWins;
                    } else continue;
                case 'earned losses':
                    if (a.tiebreaks.earnedLosses !== b.tiebreaks.earnedLosses) {
                        return b.tiebreaks.earnedLosses - a.tiebreaks.earnedLosses;
                    } else continue;
                case 'neighboring points':
                    if (a.tiebreaks.neighboringPoints !== b.tiebreaks.neighboringPoints) {
                        return b.tiebreaks.neighboringPoints - a.tiebreaks.neighboringPoints;
                    } else continue;
                case 'versus':
                    const matchIDs = a.player.getMatches().filter(m => m.opponent === b.player.getId() && this.getMatch(m.id).getRoundNumber() <= r).map(m => m.id);
                    if (matchIDs.length === 0) {
                        continue;
                    }
                    const pointsA = a.player.getMatches().filter(m => matchIDs.some(i => i === m.id)).reduce((sum, curr) => curr.win > curr.loss ? sum + this.getScoring().win : curr.loss > curr.win ? sum + this.getScoring().loss : sum + this.getScoring().draw, 0);
                    const pointsB = b.player.getMatches().filter(m => matchIDs.some(i => i === m.id)).reduce((sum, curr) => curr.win > curr.loss ? sum + this.getScoring().win : curr.loss > curr.win ? sum + this.getScoring().loss : sum + this.getScoring().draw, 0);
                    if (pointsA !== pointsB) {
                        return pointsB - pointsA;
                    } else continue;
                case 'mutual versus':
                    const opponentsA = a.player.getOpponents().filter(opp => this.getMatch(a.player.getMatches().find(match => match.opponent === opp).id).getRoundNumber() <= r);
                    const opponentsB = b.player.getOpponents().filter(opp => this.getMatch(b.player.getMatches().find(match => match.opponent === opp).id).getRoundNumber() <= r);
                    const sharedOpponents = opponentsA.filter(opp => opponentsB.includes(opp));
                    if (sharedOpponents.length === 0) {
                        continue;
                    }
                    const matchesA = sharedOpponents.map(opp => this.getMatch(a.player.getMatches().find(match => match.opponent === opp).id));
                    const matchesB = sharedOpponents.map(opp => this.getMatch(b.player.getMatches().find(match => match.opponent === opp).id));
                    const matchPointsA = matchesA.reduce((sum, match) => match.isDraw() ? sum + this.getScoring().draw : match.getWinner().id === a.player.getId() ? this.getScoring().win : this.getScoring().loss, 0);
                    const matchPointsB = matchesB.reduce((sum, match) => match.isDraw() ? sum + this.getScoring().draw : match.getWinner().id === b.player.getId() ? this.getScoring().win : this.getScoring().loss, 0);
                    if (matchPointsA !== matchPointsB) {
                        return matchPointsB - matchPointsA;
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

    /**
     * Adjusts seating for elimination if seating matters
     * @param p1 First player in a match
     * @param p2 Second player in a match
     * @returns IDs of the players in the order in which they should be seated
     */
    private eliminationSeating(p1: Player, p2: Player): [PlayerValues['id'], PlayerValues['id']] {
        const p1SeatSum = p1.getMatches().reduce((sum, match) => sum + match.seating, 0);
        const p1LastSeat = p1.getMatches().slice(-1)[0].seating;
        const p2SeatSum = p2.getMatches().reduce((sum, match) => sum + match.seating, 0);
        const p2LastSeat = p2.getMatches().slice(-1)[0].seating;
        if ((p2LastSeat === -1 && p1LastSeat === 1) || (p2SeatSum < p1SeatSum)) {
            return [p2.getId(), p1.getId()];
        } else {
            return [p1.getId(), p2.getId()];
        }
    }

    /**
     * @returns ID of the tournament
     */
    getId(): TournamentValues['id'] {
        return this.id;
    }

    /**
     * @returns Name of the tournament
     */
    getName(): TournamentValues['name'] {
        return this.name;
    }

    /**
     * @returns Current state of the tournament
     */
    getStatus(): TournamentValues['status'] {
        return this.status;
    }

    /**
     * @returns Current round number of the tournament
     */
    getRoundNumber(): TournamentValues['round'] {
        return this.round;
    }

    /**
     * @returns An array of players in the tournament
     */
    getPlayers(): TournamentValues['players'] {
        return this.players;
    }

    /**
     * @returns An array of currently active players
     */
    getActivePlayers(): TournamentValues['players'] {
        return this.players.filter(p => p.isActive());
    }

    /**
     * Throws an error if no player is found
     * 
     * @param id ID of the player
     * @returns The player with the corresponding ID
     */
    getPlayer(id: PlayerValues['id']): Player {
        const player = this.players.find(p => p.getId() === id);
        if (player === undefined) {
            throw new Error(`No player found with ID ${id}`);
        }
        return player;
    }

    /**
     * @returns An array of matches in the tournament
     */
    getMatches(): TournamentValues['matches'] {
        return this.matches;
    }

    /**
     * @returns An array of currently active matches
     */
    getActiveMatches(): TournamentValues['matches'] {
        return this.matches.filter(m => m.isActive());
    }

    /**
     * @param round Round number
     * @returns An array of matches with the corresponding round number
     */
    getMatchesByRound(round: TournamentValues['round']): TournamentValues['matches'] {
        return this.matches.filter(m => m.getRoundNumber() === round);
    }

    /**
     * @param id ID of the match
     * @returns The match with the corresponding ID
     */
    getMatch(id: MatchValues['id']): Match {
        const match = this.matches.find(m => m.getId() === id);
        if (match === undefined) {
            throw new Error(`No match found with ID ${id}`);
        }
        return match;
    }

    /**
     * @returns If order of players in matches matters
     */
    getSeating(): TournamentValues['seating'] {
        return this.seatings;
    }

    /**
     * @returns Sorting method, if players are rated/seeded
     */
    getSorting(): TournamentValues['sorting'] {
        return this.sorting;
    }

    /**
     * @returns An object with details regarding scoring
     */
    getScoring(): TournamentValues['scoring'] {
        return this.scoring;
    }

    /**
     * @returns An object with details regarding the tournament
     */
    getStageOne(): TournamentValues['stageOne'] {
        return this.stageOne;
    }

    /**
     * @returns An object with details regarding playoffs
     */
    getStageTwo(): TournamentValues['stageTwo'] {
        return this.stageTwo;
    }

    /**
     * @returns The current pairing format if stage one or two
     */
    getCurrentFormat(): TournamentValues['stageOne']['format'] | null {
        return this.status === 'stage-one' ? this.getStageOne().format : this.status === 'stage-two' ? this.getStageTwo().format : null;
    }

    /**
     * @returns If the current format is an elimination format
     */
    isElimination(): Boolean {
        if (this.status === 'stage-one') {
            return ['single-elimination', 'double-elimination', 'stepladder'].includes(this.getStageOne().format);
        } else {
            return this.status === 'stage-two';
        }
    }

    /**
     * @returns The values of the tournament details
     */
    getValues(): ExportedTournamentValues {
        return {
            id: this.id,
            name: this.name,
            status: this.status,
            round: this.round,
            players: this.players.map(player => player.getValues()),
            matches: this.matches.map(match => match.getValues()),
            seating: this.seatings,
            sorting: this.sorting,
            scoring: this.scoring,
            stageOne: this.stageOne,
            stageTwo: this.stageTwo,
            meta: this.meta
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
        if ((this.status === 'stage-one' && this.getStageOne().format !== 'swiss') || this.status === 'stage-two' || this.status === 'complete') {
            throw new Error(`Players can only be added during setup or stage one (if Swiss format)`);
        }
        if (this.getStageOne().maxPlayers > 0 && this.players.length === this.getStageOne().maxPlayers) {
            throw new Error(`Maximum number of players (${this.getStageOne().maxPlayers}) are enrolled`);
        }
        let ID = id;
        if (ID === undefined) {
            do {
                ID = randomstring.generate({
                    length: 12,
                    charset: 'alphanumeric'
                });
            } while (this.players.some(p => p.getId() === ID));
        } else {
            if (this.players.some(p => p.getId() === ID)) {
                throw new Error(`Player with ID ${ID} already exists`);
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
    removePlayer(id: string): void {
        const player = this.getPlayer(id);
        if (player.isActive() === false) {
            throw new Error(`Player is already marked inactive`);
        }
        player.set({ active: false });
        if (this.isElimination()) {
            const activeMatch = this.matches.find(match => match.isActive() === true && (match.getPlayer1().id === player.getId() || match.getPlayer2().id === player.getId()));
            if (activeMatch !== undefined) {
                const opponent = this.getPlayer(activeMatch.getPlayer1().id === player.getId() ? activeMatch.getPlayer2().id : activeMatch.getPlayer1().id);
                activeMatch.set({
                    active: false,
                    player1: activeMatch.getPlayer1().id === player.getId() ? {
                        win: 0,
                        loss: Math.ceil(this.getScoring().bestOf / 2)
                    } : {
                        win: Math.ceil(this.getScoring().bestOf / 2),
                        loss: 0
                    },
                    player2: activeMatch.getPlayer1().id === player.getId() ? {
                        win: Math.ceil(this.getScoring().bestOf / 2),
                        loss: 0
                    } : {
                        win: 0,
                        loss: Math.ceil(this.getScoring().bestOf / 2)
                    }
                });
                player.updateMatch(activeMatch.getId(), {
                    loss: Math.ceil(this.getScoring().bestOf / 2)
                });
                opponent.updateMatch(activeMatch.getId(), {
                    win: Math.ceil(this.getScoring().bestOf / 2)
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
                        const prevMatch = this.matches.find(match => (match.getPath().win === lossMatch.getId() || match.getPath().loss === lossMatch.getId()) && match.getPlayer1().id !== player.getId() && match.getPlayer2().id !== player.getId());
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
            const waitingMatch = this.matches.find(match => (match.getPlayer1().id === player.getId() && match.getPlayer2().id === null) || (match.getPlayer2().id === player.getId() && match.getPlayer1().id === null));
            if (waitingMatch !== undefined && waitingMatch.getPath().win !== null) {
                const prevMatch = this.matches.find(match => (match.getPath().win === waitingMatch.getId() || match.getPath().loss === waitingMatch.getId()) && match.getPlayer1().id !== player.getId() && match.getPlayer2().id !== player.getId());
                prevMatch.set({
                    path: {
                        win: prevMatch.getPath().win === waitingMatch.getId() ? waitingMatch.getPath().win : prevMatch.getPath().win,
                        loss: prevMatch.getPath().loss === waitingMatch.getId() ? waitingMatch.getPath().win : prevMatch.getPath().loss
                    }
                });
                if (waitingMatch.getPath().loss !== undefined) {
                    const prevLossMatch = this.matches.find(match => (match.getPath().win === waitingMatch.getPath().loss || match.getPath().loss === waitingMatch.getPath().loss) && match.getPlayer1().id !== player.getId() && match.getPlayer2().id !== player.getId());
                    const currLossMatch = this.matches.find(match => match.getId() === waitingMatch.getPath().loss);
                    prevLossMatch.set({
                        path: {
                            win: prevLossMatch.getPath().win === currLossMatch.getId() ? currLossMatch.getPath().win : prevLossMatch.getPath().win,
                            loss: prevLossMatch.getPath().loss === currLossMatch.getId() ? currLossMatch.getPath().win : prevLossMatch.getPath().loss
                        }
                    })
                }
            }
        } else if (['round-robin', 'double-round-robin'].includes(this.getStageOne().format)) {
            const byeMatches = this.matches.filter(match => match.getRoundNumber() > this.round && (match.getPlayer1().id === player.getId() || match.getPlayer2().id === player.getId()));
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
        if ((this.getStageOne().format === 'double-elimination' && players.length < 4) || players.length < 2) {
            throw new Error(`Insufficient number of players (${players.length}) to start event`);
        }
        if (this.getSorting() !== 'none') {
            players.sort((a, b) => this.getSorting() === 'ascending' ? a.getValue() - b.getValue() : b.getValue() - a.getValue());
        }
        this.status = 'stage-one';
        this.round = this.getStageOne().initialRound;
        this.createMatches(players);
        if (this.getStageOne().format === 'swiss' && this.getStageOne().rounds === 0) {
            this.getStageOne().rounds = Math.ceil(Math.log2(this.players.length));
        } else if (this.getStageOne().format !== 'swiss') {
            this.getStageOne().rounds = Math.max(...this.getMatches().map(match => match.getRoundNumber()));
        }
    }

    /** 
     * Progress to the next round in the tournament.
     * 
     * Throws an error if there are active matches, if the current format is elimination or stepladder, or when attempting to create matches for stage two and there are an insufficient number of players.
     */
    nextRound(): void {
        if (this.status !== 'stage-one') {
            throw new Error(`Can only advance rounds during stage one`);
        }
        if (this.isElimination()) {
            throw new Error(`Can not advance rounds in an elimination format`);
        }
        if (this.getActiveMatches().length > 0) {
            throw new Error(`Can not advance rounds with active matches`);
        }
        this.round++;
        if (this.round > this.getStageOne().rounds + this.getStageOne().initialRound - 1) {
            if (this.getStageTwo().format !== null) {
                if (this.getStageTwo().advance.method === 'points') {
                    this.players.filter(player => player.getMatches().reduce((sum, match) => match.win > match.loss ? sum + this.getScoring().win : match.loss > match.win ? sum + this.getScoring().loss : this.getScoring().draw, 0) < this.getStageTwo().advance.value).forEach(player => player.set({ active: false }));
                } else if (this.getStageTwo().advance.method === 'rank') {
                    const standings = this.getStandings();
                    standings.splice(0, this.getStageTwo().advance.value);
                    standings.forEach(s => this.getPlayer(s.player.getId()).set({ active: false }));
                }
                if ((this.getStageTwo().format === 'double-elimination' && this.getActivePlayers().length < 4) || this.getActivePlayers().length < 2) {
                    throw new Error(`Insufficient number of players (${this.getActivePlayers().length}) to create stage two matches`);
                }
                this.status = 'stage-two';
                this.createMatches(this.getStandings().map(s => s.player).filter(p => p.isActive() === true));
            } else {
                throw new Error(`Predetermined number of rounds have been completed`);
            }
        } else {
            if (['round-robin', 'double-round-robin'].includes(this.getStageOne().format)) {
                const matches = this.getMatchesByRound(this.round);
                matches.forEach(match => {
                    if (match.getPlayer1().id === null || match.getPlayer2().id === null) {
                        this.getPlayer(match.getPlayer1().id === null ? match.getPlayer2().id : match.getPlayer1().id).addMatch({
                            id: match.getId(),
                            opponent: null,
                            bye: true,
                            win: Math.ceil(this.getScoring().bestOf / 2)
                        });
                        match.set({
                            bye: true,
                            player1: { win: match.getPlayer2().id === null ? Math.ceil(this.getScoring().bestOf / 2) : 0 },
                            player2: { win: match.getPlayer1().id === null ? Math.ceil(this.getScoring().bestOf / 2) : 0 }
                        })
                    } else {
                        match.set({ active: true });
                        this.getPlayer(match.getPlayer1().id).addMatch({
                            id: match.getId(),
                            opponent: match.getPlayer2().id,
                            seating: this.getSeating() ? 1 : null
                        });
                        this.getPlayer(match.getPlayer2().id).addMatch({
                            id: match.getId(),
                            opponent: match.getPlayer1().id,
                            seating: this.getSeating() ? -1 : null
                        });
                    }
                });
            } else {
                const players = this.getActivePlayers();
                if (this.getSorting() !== 'none') {
                    players.sort((a, b) => this.getSorting() === 'ascending' ? a.getValue() - b.getValue() : b.getValue() - a.getValue());
                }
                this.createMatches(players);
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
        if (player1Wins > Math.round(this.getScoring().bestOf / 2) || player2Wins > Math.round(this.getScoring().bestOf / 2)) {
            throw new Error(`Players can not win more than ${Math.round(this.getScoring().bestOf / 2)} games in a match`);
        }
        if (this.isElimination() && player1Wins === player2Wins) {
            throw new Error('Players can not draw a match during an elimination format');
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
            const winMatch = this.getMatch(match.getPath().win);
            if (winMatch.getPlayer1().id === null) {
                winMatch.set({
                    player1: { id: match.getWinner().id }
                });
            } else {
                if (this.getSeating()) {
                    const [seat1, seat2] = this.eliminationSeating(this.getPlayer(winMatch.getPlayer1().id), this.getPlayer(match.getWinner().id));
                    winMatch.set({
                        player1: { id: seat1 },
                        player2: { id: seat2 }
                    });
                } else {
                    winMatch.set({
                        player2: { id: match.getWinner().id }
                    });
                }
            }
            if (winMatch.getPlayer1().id !== null && winMatch.getPlayer2().id !== null) { 
                winMatch.set({ active: true });
                this.getPlayer(winMatch.getPlayer1().id).addMatch({
                    id: winMatch.getId(),
                    opponent: winMatch.getPlayer2().id,
                    seating: this.getSeating() ? 1 : null
                });
                this.getPlayer(winMatch.getPlayer2().id).addMatch({
                    id: winMatch.getId(),
                    opponent: winMatch.getPlayer1().id,
                    seating: this.getSeating() ? -1 : null
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
                if (this.getSeating()) {
                    const [seat1, seat2] = this.eliminationSeating(this.getPlayer(lossMatch.getPlayer1().id), this.getPlayer(match.getLoser().id));
                    lossMatch.set({
                        player1: { id: seat1 },
                        player2: { id: seat2 }
                    });
                } else {
                    lossMatch.set({
                        player2: { id: match.getLoser().id }
                    });
                }
            }
            if (lossMatch.getPlayer1().id !== null && lossMatch.getPlayer2().id !== null) {
                lossMatch.set({ active: true });
                this.getPlayer(lossMatch.getPlayer1().id).addMatch({
                    id: lossMatch.getId(),
                    opponent: lossMatch.getPlayer2().id,
                    seating: this.getSeating() ? 1 : null
                });
                this.getPlayer(lossMatch.getPlayer2().id).addMatch({
                    id: lossMatch.getId(),
                    opponent: lossMatch.getPlayer1().id,
                    seating: this.getSeating() ? -1 : null
                });
            }
        } else if (this.isElimination()) {
            if (this.getCurrentFormat() === 'double-elimination' && match.getPath().win === null && match.getMatchNumber() === 1 &&
            this.getPlayer(match.getPlayer1().id).getMatches().filter(m => m.loss > m.win).length === this.getPlayer(match.getPlayer2().id).getMatches().filter(m => m.loss > m.win).length) {
                let id: string;
                do {
                    id = randomstring.generate({
                        length: 12,
                        charset: 'alphanumeric'
                    });
                } while (this.matches.some(m => m.getId() === id));
                const newMatch = new Match(id, match.getRoundNumber(), 2);
                newMatch.set({
                    active: true,
                    player1: { id: match.getPlayer2().id },
                    player2: { id: match.getPlayer1().id }
                });
                this.matches.push(newMatch);
                this.getPlayer(newMatch.getPlayer1().id).addMatch({
                    id: id,
                    opponent: newMatch.getPlayer2().id,
                    seating: this.getSeating() ? 1 : null
                });
                this.getPlayer(newMatch.getPlayer2().id).addMatch({
                    id: id,
                    opponent: newMatch.getPlayer1().id,
                    seating: this.getSeating() ? -1 : null
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
        if (match.isActive()) {
            throw new Error('Can not clear an active match');
        }
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
        if (this.status !== 'stage-one' || this.getStageOne().format !== 'swiss') {
            throw new Error(`Can only assign byes during Swiss pairings`);
        }
        const player = this.getPlayer(id);
        if (player.isActive() === false) {
            throw new Error(`Player is currently inactive`);
        }
        if (player.getMatches().some(match => this.matches.find(m => m.getId() === match.id).getRoundNumber() === round)) {
            throw new Error(`Player already has a match in round ${round}`);
        }
        let byeID: string;
        do {
            byeID = randomstring.generate({
                length: 12,
                charset: 'alphanumeric'
            });
        } while (this.matches.some(m => m.getId() === byeID));
        const bye = new Match(byeID, round, 0);
        bye.set({
            bye: true,
            player1: {
                id: player.getId(),
                win: Math.ceil(this.getScoring().bestOf / 2)
            },
            player2: { loss: Math.ceil(this.getScoring().bestOf / 2) }
        });
        player.addMatch({
            id: byeID,
            opponent: null,
            bye: true,
            win: Math.ceil(this.getScoring().bestOf / 2)
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
    assignLoss(id: string, round: number): void {
        if (this.status !== 'stage-one' || this.getStageOne().format !== 'swiss') {
            throw new Error(`Can only assign losses during Swiss pairings`);
        }
        const player = this.getPlayer(id);
        if (player.isActive() === false) {
            throw new Error(`Player is currently inactive`);
        }
        if (player.getMatches().some(match => this.matches.find(m => m.getId() === match.id).getRoundNumber() === round)) {
            const currentMatch = this.getMatchesByRound(round).find(match => match.getPlayer1().id === player.getId() || match.getPlayer2().id === player.getId());
            this.matches.splice(this.matches.findIndex(match => match.getId() === currentMatch.getId()), 1);
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
        } while (this.matches.some(m => m.getId() === lossID));
        const loss = new Match(lossID, round, 0);
        loss.set({
            loss: true,
            player1: {
                id: player.getId(),
                loss: Math.ceil(this.getScoring().bestOf / 2)
            },
            player2: { win: Math.ceil(this.getScoring().bestOf / 2) }
        });
        player.addMatch({
            id: lossID,
            opponent: null,
            loss: Math.ceil(this.getScoring().bestOf / 2)
        });
        this.matches.push(loss);
    }

    /**
     * Computes tiebreakers for all players and ranks the players by points and tiebreakers.
     * @returns A sorted array of players with scores and tiebreaker values
     */
    getStandings(): Array<StandingsValues> {
        const maximumRound = Math.max(...this.getMatches().map(match => match.getRoundNumber()));
        if (['single-elimination', 'double-elimination', 'stepladder'].includes(this.getStageOne().format) || ((this.getStatus() === 'stage-two' || this.getStatus() === 'complete') && ['single-elimination', 'double-elimination', 'stepladder'].includes(this.getStageTwo().format))) {
            let players = this.computeScores(maximumRound);
            const activePlayers = players.filter(p => p.player.isActive()).sort((a, b) => this.sortForStandings(a, b, maximumRound));
            players = players.filter(p => !activePlayers.includes(p));
            let eliminatedPlayers = [];
            const initialEliminationRound = this.getMatches().filter(m => m.getPath().win !== null).reduce((min, match) => Math.min(min, match.getRoundNumber()), !['single-elimination', 'double-elimination', 'stepladder'].includes(this.getStageOne().format) ? this.getStageOne().rounds + 1 : maximumRound);
            const eliminationMatches = this.getMatches().filter(m => m.getRoundNumber() >= initialEliminationRound && m.getPath().loss === null);
            if (eliminationMatches.length > 0) {
                const finalsRoundNumber = eliminationMatches.find(m => m.getPath().win === null).getRoundNumber();
                eliminationMatches.filter(m => m.getRoundNumber() === finalsRoundNumber).sort((a, b) => a.getMatchNumber() - b.getMatchNumber()).forEach(match => {
                    if (match.hasEnded()) {
                        const winningPlayer = players.find(p => p.player.getId() === match.getWinner().id);
                        const losingPlayer = players.find(p => p.player.getId() === match.getLoser().id);
                        if (!eliminatedPlayers.includes(winningPlayer) && !eliminatedPlayers.includes(losingPlayer)) {
                            eliminatedPlayers.push(winningPlayer, losingPlayer);
                        }
                    }
                });
                for (let i = maximumRound; i >= initialEliminationRound; i--) {
                    if (i === finalsRoundNumber) continue;
                    const currentRoundEliminatedPlayers = [];
                    eliminationMatches.filter(m => m.getRoundNumber() === i && m.hasEnded()).sort((a, b) => a.getMatchNumber() - b.getMatchNumber()).forEach(match => {
                        currentRoundEliminatedPlayers.push(players.find(p => p.player.getId() === match.getLoser().id));
                    });
                    eliminatedPlayers = [...eliminatedPlayers, ...currentRoundEliminatedPlayers.sort((a, b) => this.sortForStandings(a, b, maximumRound))];
                }
            }
            players = players.filter(p => !eliminatedPlayers.includes(p));
            return [...activePlayers, ...eliminatedPlayers, ...players.sort((a, b) => this.sortForStandings(a, b, maximumRound))];
        } else {
            return this.computeScores(maximumRound).sort((a, b) => this.sortForStandings(a, b, maximumRound));
        }
    }

    /**
     * Computes tiebreakers for all players, using only the games from stage one, and ranks the players by points and tiebreakers.
     * @returns A sorted array of players with scores and tiebreaker values
     */
    getStageOneStandings(): Array<StandingsValues> {
        if (this.getStatus() === 'stage-one') {
            return this.getStandings();
        } else {
            return this.computeScores(this.getStageOne().rounds).sort((a, b) => this.sortForStandings(a, b, this.getStageOne().rounds));
        }
    }

    /**
     * Ends the tournament and marks all players and matches as inactive.
     */
    endTournament(): void {
        this.status = 'complete';
        this.players.forEach(player => player.set({ active: false }));
        this.matches.forEach(match => match.set({ active: false }));
    }
}
