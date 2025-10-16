import { MatchValues } from "../interfaces/MatchValues.js";
import { SettableMatchValues } from "../interfaces/SettableMatchValues.js";
/**
 * Class representing a match.
 *
 * See {@link MatchValues} for detailed descriptions of properties.
 */
export declare class Match {
    /** Unique ID of the match */
    private id;
    /** Round number for the match */
    private round;
    /** Match number for the match */
    private match;
    /** If the match is active */
    private active;
    /** If the match is an assigned bye */
    private bye;
    /** If the match is an assigned loss */
    private loss;
    /** Details for player one */
    private player1;
    /** Details for player two */
    private player2;
    /** Next match for winners and losers */
    private path;
    /** Any extra information */
    private meta;
    /** Create a new match. */
    constructor(id: string, round: number, match: number);
    /** Set information about the match (only changes in information need to be included in the object) */
    set(options: SettableMatchValues): void;
    /**
     * @returns The ID of the match
     */
    getId(): MatchValues['id'];
    /**
     * @returns The round number for the match
     */
    getRoundNumber(): MatchValues['round'];
    /**
     * @returns The match number for the match
     */
    getMatchNumber(): MatchValues['match'];
    /**
     * @returns If the match is active
     */
    isActive(): MatchValues['active'];
    /**
     * @returns If the match is paired, either with two players, or one player and marked as a bye or loss
     */
    isPaired(): Boolean;
    /**
     * @returns If the match has ended with results reported
     */
    hasEnded(): Boolean;
    /**
     * @returns If the match is an assigned bye
     */
    isBye(): MatchValues['bye'];
    /**
     * @returns If the match is an assigned loss
     */
    isLoss(): MatchValues['loss'];
    /**
     * @returns The details for player one
     */
    getPlayer1(): MatchValues['player1'];
    /**
     * @returns The details for player two
     */
    getPlayer2(): MatchValues['player2'];
    /**
     * @returns The details for the player who won the match
     */
    getWinner(): MatchValues['player1'] | null;
    /**
     * @returns The details for the player who loss the match
     */
    getLoser(): MatchValues['player1'] | null;
    /**
     * @returns If the match is a draw
     */
    isDraw(): Boolean;
    /**
     * @returns The next match for winners and losers
     */
    getPath(): MatchValues['path'];
    /**
     * @returns Any extra information
     */
    getMeta(): MatchValues['meta'];
    /**
     * @returns The values of all match details
     */
    getValues(): MatchValues;
}
