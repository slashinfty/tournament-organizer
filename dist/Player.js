/**
 * Class representing a player
 *
 * See {@link PlayerValues} for detailed descriptions of properties.
 */
export class Player {
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
    set values(options) {
        if (options.hasOwnProperty('matches')) {
            options.matches = [...this.matches, ...options.matches];
        }
        Object.assign(this, options);
    }
    /**
     * Adds a match to the player's record.
     *
     * Throws an error if attempting to duplicate a match.
     * @param match Object with match details
     */
    addMatch(match) {
        if (this.matches.find(m => m.id === match.id) !== undefined) {
            throw `Match with ID ${match.id} already exists`;
        }
        const newMatch = Object.assign({
            pairUpDown: false,
            color: null,
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
            throw `Match with ID ${id} does not exist`;
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
            throw `Match with ID ${id} does not exist`;
        }
        Object.assign(match, values);
    }
}
//# sourceMappingURL=Player.js.map