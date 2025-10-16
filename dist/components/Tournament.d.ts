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
export declare class Tournament {
    /** Unique ID of the tournament */
    private id;
    /** Name of the tournament */
    private name;
    /** Current state of the tournament */
    private status;
    /** Current round of the tournament */
    private round;
    /** All players in the tournament */
    private players;
    /** All matches of the tournament */
    private matches;
    /** If order of players in matches matters */
    private seatings;
    /** Sorting method, if players are rated/seeded */
    private sorting;
    /** Details regarding scoring */
    private scoring;
    /** Details regarding the tournament */
    private stageOne;
    /** Details regarding playoffs */
    private stageTwo;
    /** Any extra information */
    private meta;
    /**
     * Create a new tournament.
     * @param id Unique ID of the tournament
     * @param name Name of the tournament
     */
    constructor(id: string, name: string);
    /** Set tournament options (only changes in options need to be included in the object) */
    set(options: SettableTournamentValues): void;
    /**
     * Create matches using the pairings library
     * @param players The players who can be assigned to new matches
     */
    private createMatches;
    /**
     * Compute points and tiebreakers
     * @param maxRound The maximum round for scores and tiebreaks to be computed through
     * @returns A standings array
     */
    private computeScores;
    /**
     * Sort players by points and tiebreaks
     * @param a The points and tiebreaks of one player
     * @param b The points and tiebreaks of another player
     * @param r The maximum round number to consider for versus tiebreaks
     * @returns A positive or negative number for sorting
     */
    private sortForStandings;
    /**
     * Adjusts seating for elimination if seating matters
     * @param p1 First player in a match
     * @param p2 Second player in a match
     * @returns IDs of the players in the order in which they should be seated
     */
    private eliminationSeating;
    /**
     * @returns ID of the tournament
     */
    getId(): TournamentValues['id'];
    /**
     * @returns Name of the tournament
     */
    getName(): TournamentValues['name'];
    /**
     * @returns Current state of the tournament
     */
    getStatus(): TournamentValues['status'];
    /**
     * @returns Current round number of the tournament
     */
    getRoundNumber(): TournamentValues['round'];
    /**
     * @returns An array of players in the tournament
     */
    getPlayers(): TournamentValues['players'];
    /**
     * @returns An array of currently active players
     */
    getActivePlayers(): TournamentValues['players'];
    /**
     * Throws an error if no player is found
     *
     * @param id ID of the player
     * @returns The player with the corresponding ID
     */
    getPlayer(id: PlayerValues['id']): Player;
    /**
     * @returns An array of matches in the tournament
     */
    getMatches(): TournamentValues['matches'];
    /**
     * @returns An array of currently active matches
     */
    getActiveMatches(): TournamentValues['matches'];
    /**
     * @param round Round number
     * @returns An array of matches with the corresponding round number
     */
    getMatchesByRound(round: TournamentValues['round']): TournamentValues['matches'];
    /**
     * @param id ID of the match
     * @returns The match with the corresponding ID
     */
    getMatch(id: MatchValues['id']): Match;
    /**
     * @returns If order of players in matches matters
     */
    getSeating(): TournamentValues['seating'];
    /**
     * @returns Sorting method, if players are rated/seeded
     */
    getSorting(): TournamentValues['sorting'];
    /**
     * @returns An object with details regarding scoring
     */
    getScoring(): TournamentValues['scoring'];
    /**
     * @returns An object with details regarding the tournament
     */
    getStageOne(): TournamentValues['stageOne'];
    /**
     * @returns An object with details regarding playoffs
     */
    getStageTwo(): TournamentValues['stageTwo'];
    /**
     * @returns The current pairing format if stage one or two
     */
    getCurrentFormat(): TournamentValues['stageOne']['format'] | null;
    /**
     * @returns If the current format is an elimination format
     */
    isElimination(): Boolean;
    /**
     * @returns The values of the tournament details
     */
    getValues(): ExportedTournamentValues;
    /**
     * Create a new player.
     *
     * Throws an error if ID is specified and already exists, if the specified maximum number of players has been reached, if the tournament is in stage one and not Swiss format, or if the tournament is in stage two or complete.
     * @param name Alias of the player
     * @param id ID of the player (randomly assigned if omitted)
     * @returns The newly created player
     */
    createPlayer(name: string, id?: string | undefined): Player;
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
    removePlayer(id: string): void;
    /**
     * Start the tournament.
     *
     * Throws an error if there are an insufficient number of players (4 if double elimination, otherwise 2).
     */
    startTournament(): void;
    /**
     * Progress to the next round in the tournament.
     *
     * Throws an error if there are active matches, if the current format is elimination or stepladder, or when attempting to create matches for stage two and there are an insufficient number of players.
     */
    nextRound(): void;
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
    enterResult(id: string, player1Wins: number, player2Wins: number, draws?: number): void;
    /**
     * Clears the results of a match.
     *
     * Throws an error if no match has the ID specified or if the match is still active.
     *
     * In elimination and stepladder formats, it reverses the progression of players in the bracket.
     * @param id The ID of the match
     */
    clearResult(id: string): void;
    /**
     * Assigns a bye to a player in a specified round.
     *
     * Throws an error if it is not actively Swiss pairings, no player has the ID specified, if the player is already inactive, or if the player already has a match in the round.
     * @param id The ID of the player
     * @param round The round number
     */
    assignBye(id: string, round: number): void;
    /**
     * Assigns a loss to a player in a specified round.
     *
     * Throws an error if it is not actively Swiss pairings, no player has the ID specified, or if the player is already inactive.
     *
     * If the player has a match in the specified round, it is removed, they are assigned a loss, and the opponent is assigned a bye.
     * @param id The ID of the player
     * @param round The round number
     */
    assignLoss(id: string, round: number): void;
    /**
     * Computes tiebreakers for all players and ranks the players by points and tiebreakers.
     * @returns A sorted array of players with scores and tiebreaker values
     */
    getStandings(): Array<StandingsValues>;
    /**
     * Computes tiebreakers for all players, using only the games from stage one, and ranks the players by points and tiebreakers.
     * @returns A sorted array of players with scores and tiebreaker values
     */
    getStageOneStandings(): Array<StandingsValues>;
    /**
     * Ends the tournament and marks all players and matches as inactive.
     */
    endTournament(): void;
}
