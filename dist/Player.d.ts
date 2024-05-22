import { PlayerValues } from './interfaces/PlayerValues.js';
import { SettablePlayerValues } from './interfaces/SettablePlayerValues.js';
/**
 * Class representing a player
 *
 * See {@link PlayerValues} for detailed descriptions of properties.
 */
export declare class Player {
    /** Unique ID of the player */
    id: PlayerValues['id'];
    /** Name of the player */
    name: PlayerValues['name'];
    /** If the player is active */
    active: PlayerValues['active'];
    /** Numerical value for player, such as rating or seed */
    value: PlayerValues['value'];
    /** Array of matches the player is in */
    matches: PlayerValues['matches'];
    /** Any extra information */
    meta: PlayerValues['meta'];
    /** Create a new player. */
    constructor(id: string, name: string);
    /** Set information about the player (only changes in information need to be included in the object). */
    set values(options: SettablePlayerValues);
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
        color?: 'w' | 'b' | null;
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
        color?: 'w' | 'b' | null;
        bye?: boolean;
        win?: number;
        loss?: number;
        draw?: number;
    }): void;
}
