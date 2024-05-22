import { Player } from './Player.js';
import { StandingsValues } from './interfaces/StandingsValues.js';
import { TournamentValues } from './interfaces/TournamentValues.js';
import { SettableTournamentValues } from './interfaces/SettableTournamentValues.js';
/**
 * Class representing a tournament.
 *
 * See {@link TournamentValues} for detailed descriptions of properties.
 */
export declare class Tournament {
    #private;
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
    /** If order of players in matches matters */
    colored: TournamentValues['colored'];
    /** Sorting method, if players are rated/seeded */
    sorting: TournamentValues['sorting'];
    /** Details regarding scoring */
    scoring: TournamentValues['scoring'];
    /** Details regarding the tournament */
    stageOne: TournamentValues['stageOne'];
    /** Details regarding playoffs */
    stageTwo: TournamentValues['stageTwo'];
    /** Any extra information */
    meta: TournamentValues['meta'];
    /**
     * Create a new tournament.
     * @param id Unique ID of the tournament
     * @param name Name of the tournament
     */
    constructor(id: string, name: string);
    /** Set tournament options (only changes in options need to be included in the object) */
    set settings(options: SettableTournamentValues);
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
    start(): void;
    /**
     * Progress to the next round in the tournament.
     *
     * Throws an error if there are active matches, if the current format is elimination or stepladder, or when attempting to create matches for stage two and there are an insufficient number of players.
     */
    next(): void;
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
     * @param activeOnly If the array contains only active players
     * @returns A sorted array of players with scores and tiebreaker values
     */
    standings(activeOnly?: boolean): Array<StandingsValues>;
    /**
     * Ends the tournament and marks all players and matches as inactive.
     */
    end(): void;
}
