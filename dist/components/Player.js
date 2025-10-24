/**
 * Class representing a player
 *
 * See {@link PlayerValues} for detailed descriptions of properties.
 */
export class Player {
    /** Unique ID of the player */
    id;
    /** Name of the player */
    name;
    /** If the player is active */
    active;
    /** Numerical value for player, such as rating or seed */
    value;
    /** Array of matches the player is in */
    matches;
    /** Any extra information */
    meta;
    /** Create a new player. */
    constructor(id, name) {
        this.id = id;
        this.name = name;
        this.active = true;
        this.value = 0;
        this.matches = [];
        this.meta = {};
    }
    /** Set information about the player (only changes in information need to be included in the object). */
    set(options) {
        if (options.hasOwnProperty('name'))
            this.name = options.name;
        if (options.hasOwnProperty('active'))
            this.active = options.active;
        if (options.hasOwnProperty('value'))
            this.value = options.value;
        if (options.hasOwnProperty('matches')) {
            const existingMatches = options.matches.filter(match => this.matches.some(m => m.id === match.id));
            existingMatches.forEach(match => this.updateMatch(match.id, {
                opponent: match.opponent,
                pairUpDown: match.pairUpDown,
                seating: match.seating,
                bye: match.bye,
                win: match.win,
                loss: match.loss,
                draw: match.draw
            }));
            this.matches = [...this.matches, ...options.matches.filter(match => !existingMatches.includes(match))];
        }
        if (options.hasOwnProperty('meta'))
            Object.assign(this.meta, options.meta);
    }
    /**
     * @returns The ID of the player
     */
    getId() {
        return this.id;
    }
    /**
     * @returns The name of the player
     */
    getName() {
        return this.name;
    }
    /**
     * @returns If the player is active
     */
    isActive() {
        return this.active;
    }
    /**
     * @returns The value for the player, such as rating or seed
     */
    getValue() {
        return this.value;
    }
    /**
     * @returns An array of matches the player is in
     */
    getMatches() {
        return this.matches;
    }
    /**
     * @returns An array of IDs of the player's opponents
     */
    getOpponents() {
        return this.matches.map(match => match.opponent).filter(opp => opp !== null);
    }
    /**
     * @returns Any extra information
     */
    getMeta() {
        return this.meta;
    }
    /**
     * @returns The value of all player details
     */
    getValues() {
        return {
            id: this.id,
            name: this.name,
            active: this.active,
            value: this.value,
            matches: this.matches,
            meta: this.meta
        };
    }
    /**
     * Adds a match to the player's record.
     *
     * Throws an error if attempting to duplicate a match.
     * @param match Object with match details
     */
    addMatch(match) {
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
    removeMatch(id) {
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
    updateMatch(id, values) {
        const match = this.matches.find(m => m.id === id);
        if (match === undefined) {
            throw new Error(`Match with ID ${id} does not exist`);
        }
        Object.assign(match, values);
    }
}
//# sourceMappingURL=Player.js.map