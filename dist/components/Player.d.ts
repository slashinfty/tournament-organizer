import { PlayerValues } from '../interfaces/PlayerValues.js';
import { SettablePlayerValues } from '../interfaces/SettablePlayerValues.js';
/**
 * Class representing a player
 *
 * See {@link PlayerValues} for detailed descriptions of properties.
 */
export declare class Player {
    /** Unique ID of the player */
    private id;
    /** Name of the player */
    private name;
    /** If the player is active */
    private active;
    /** Numerical value for player, such as rating or seed */
    private value;
    /** Array of matches the player is in */
    private matches;
    /** Any extra information */
    private meta;
    /** Create a new player. */
    constructor(id: string, name: string);
    /** Set information about the player (only changes in information need to be included in the object). */
    set(options: SettablePlayerValues): void;
    /**
     * @returns The ID of the player
     */
    getId(): PlayerValues['id'];
    /**
     * @returns The name of the player
     */
    getName(): PlayerValues['name'];
    /**
     * @returns If the player is active
     */
    isActive(): PlayerValues['active'];
    /**
     * @returns The value for the player, such as rating or seed
     */
    getValue(): PlayerValues['value'];
    /**
     * @returns An array of matches the player is in
     */
    getMatches(): PlayerValues['matches'];
    /**
     * @returns An array of IDs of the player's opponents
     */
    getOpponents(): Array<PlayerValues['id']>;
    /**
     * @returns Any extra information
     */
    getMeta(): PlayerValues['meta'];
    /**
     * @returns The value of all player details
     */
    getValues(): PlayerValues;
    /**
     * Adds a match to the player's record.
     *
     * Throws an error if attempting to duplicate a match.
     * @param match Object with match details
     */
    addMatch(match: {
        id: string;
        opponent: string | null;
        pairUpDown?: boolean;
        seating?: 1 | -1 | null;
        bye?: boolean;
        win?: number;
        loss?: number;
        draw?: number;
    }): void;
    /**
     * Removes a match from player history.
     *
     * Throws an error if the match doesn't exist in the player's records.
     * @param id The ID of the match
     */
    removeMatch(id: string): void;
    /**
     * Updates the details of a match.
     *
     * Throws an error if the match doesn't exist in the player's records.
     *
     * Only needs to contain properties that are being changed.
     * @param id The ID of the match
     * @param values The match details being changed
     */
    updateMatch(id: string, values: {
        opponent?: string | null;
        pairUpDown?: boolean;
        seating?: 1 | -1 | null;
        bye?: boolean;
        win?: number;
        loss?: number;
        draw?: number;
    }): void;
}
