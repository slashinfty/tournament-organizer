/**
 * Class representing a match.
 *
 * See {@link MatchValues} for detailed descriptions of properties.
 */
export class Match {
    /** Create a new match. */
    constructor(id, round, match) {
        this.id = id;
        this.round = round;
        this.match = match;
        this.active = false;
        this.bye = false;
        this.player1 = {
            id: null,
            win: 0,
            loss: 0,
            draw: 0
        };
        this.player2 = {
            id: null,
            win: 0,
            loss: 0,
            draw: 0
        };
        this.path = {
            win: null,
            loss: null
        };
        this.meta = {};
    }
    /** Set information about the match (only changes in information need to be included in the object) */
    set values(options) {
        if (options.hasOwnProperty('player1')) {
            options.player1 = Object.assign(this.player1, options.player1);
        }
        if (options.hasOwnProperty('player2')) {
            options.player2 = Object.assign(this.player2, options.player2);
        }
        if (options.hasOwnProperty('path')) {
            options.path = Object.assign(this.path, options.path);
        }
        Object.assign(this, options);
    }
}
//# sourceMappingURL=Match.js.map