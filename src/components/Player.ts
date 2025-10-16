import { MatchValues } from '../interfaces/MatchValues.js';
import { PlayerValues } from '../interfaces/PlayerValues.js';
import { SettablePlayerValues } from '../interfaces/SettablePlayerValues.js';

/** 
 * Class representing a player
 * 
 * See {@link PlayerValues} for detailed descriptions of properties.
 */
export class Player {
    /** Unique ID of the player */
    private id: PlayerValues['id'];

    /** Name of the player */
    private name: PlayerValues['name'];

    /** If the player is active */
    private active: PlayerValues['active'];

    /** Numerical value for player, such as rating or seed */
    private value: PlayerValues['value'];

    /** Array of matches the player is in */
    private matches: PlayerValues['matches'];

    /** Any extra information */
    private meta: PlayerValues['meta'];

    /** Create a new player. */
    constructor(id: string, name: string) {
        this.id = id;
        this.name = name;
        this.active = true;
        this.value = 0;
        this.matches = [];
        this.meta = {};
    }

    /** Set information about the player (only changes in information need to be included in the object). */
    set(options: SettablePlayerValues): void {
        if (options.hasOwnProperty('name')) this.name = options.name;
        if (options.hasOwnProperty('active')) this.active = options.active;
        if (options.hasOwnProperty('value')) this.value = options.value;
        if (options.hasOwnProperty('matches')) this.matches = [...this.matches, ...options.matches];
        if (options.hasOwnProperty('meta')) Object.assign(this.meta, options.meta);
    }

    /**
     * @returns The ID of the player
     */
    getId(): PlayerValues['id'] {
        return this.id;
    }

    /**
     * @returns The name of the player
     */
    getName(): PlayerValues['name'] {
        return this.name;
    }

    /**
     * @returns If the player is active
     */
    isActive(): PlayerValues['active'] {
        return this.active;
    }

    /**
     * @returns The value for the player, such as rating or seed
     */
    getValue(): PlayerValues['value'] {
        return this.value;
    }

    /**
     * @returns An array of matches the player is in
     */
    getMatches(): PlayerValues['matches'] {
        return this.matches;
    }

    /**
     * @returns An array of IDs of the player's opponents
     */
    getOpponents(): Array<PlayerValues['id']> {
        return this.matches.map(match => match.opponent).filter(opp => opp !== null);
    }

    /**
     * @returns Any extra information
     */
    getMeta(): PlayerValues['meta'] {
        return this.meta;
    }

    /**
     * @returns The value of all player details
     */
    getValues(): PlayerValues {
        return {
            id: this.id,
            name: this.name,
            active: this.active,
            value: this.value,
            matches: this.matches,
            meta: this.meta
        }
    }

    /**
     * Adds a match to the player's record.
     * 
     * Throws an error if attempting to duplicate a match.
     * @param match Object with match details
     */
    addMatch(match: {
        id: string,
        opponent: string | null,
        pairUpDown?: boolean,
        seating?: 1 | -1 | null,
        bye?: boolean,
        win?: number,
        loss?: number,
        draw?: number
    }): void {
        if (this.matches.find(m => m.id === match.id) !== undefined) {
            throw new Error(`Match with ID ${match.id} already exists`);
        }
        const newMatch = Object.assign({
            pairUpDown: false,
            seating: null,
            bye: false,
            win: 0,
            loss: 0,
            draw: 0
        }, match);
        this.matches.push(newMatch);
    }

    /**
     * Removes a match from player history.
     * 
     * Throws an error if the match doesn't exist in the player's records.
     * @param id The ID of the match
     */
    removeMatch(id: string): void {
        const index = this.matches.findIndex(m => m.id === id);
        if (index === -1) {
            throw new Error(`Match with ID ${id} does not exist`);
        }
        this.matches.splice(index, 1);
    }

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
        opponent?: string | null,
        pairUpDown?: boolean,
        seating?: 1 | -1 | null,
        bye?: boolean,
        win?: number,
        loss?: number,
        draw?: number
    }): void {
        const match = this.matches.find(m => m.id === id);
        if (match === undefined) {
            throw new Error(`Match with ID ${id} does not exist`);
        }
        Object.assign(match, values);
    }
}