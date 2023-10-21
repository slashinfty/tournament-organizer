import { MatchValues } from "./interfaces/MatchValues.js";
import { SettableMatchValues } from "./interfaces/SettableMatchValues.js";

/** 
 * Class representing a match.
 * 
 * See {@link MatchValues} for detailed descriptions of properties.
 */
export class Match {
    /** Unique ID of the match */
    id: MatchValues['id'];

    /** Round number for the match */
    round: MatchValues['round'];

    /** Match number for the match */
    match: MatchValues['match'];

    /** If the match is active */
    active: MatchValues['active'];

    /** If the match is a bye */
    bye: MatchValues['bye'];

    /** Details for player one */
    player1: MatchValues['player1'];

    /** Details for player two */
    player2: MatchValues['player2'];

    /** Next match for winners and losers */
    path: MatchValues['path'];

    /** Any extra information */
    meta: MatchValues['meta'];

    /** Create a new match. */
    constructor(id: string, round: number, match: number) {
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
        }
        this.path = {
            win: null,
            loss: null
        }
        this.meta = {};
    }

    /** Set information about the match (only changes in information need to be included in the object) */
    set values(options: SettableMatchValues) {
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