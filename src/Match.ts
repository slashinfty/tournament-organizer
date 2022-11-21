import { MatchValues } from "./interfaces/MatchValues.js";
import { SettableMatchValues } from "./interfaces/SettableMatchValues.js";

/** Class representing a match */
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

    /** Create a new match */
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
    }

    /** Set information about the match (only changes in information need to be included in the object) */
    set values(options: SettableMatchValues) {
        this.round = options.round || this.round;
        this.match = options.match || this.match;
        this.active = options.active || this.active;
        this.bye = options.bye || this.bye;
        if (options.hasOwnProperty('player1')) {
            this.player1.id = options.player1.id || this.player1.id;
            this.player1.win = options.player1.win || this.player1.win;
            this.player1.loss = options.player1.loss || this.player1.loss;
            this.player1.draw = options.player1.draw || this.player1.draw;
        }
        if (options.hasOwnProperty('player2')) {
            this.player2.id = options.player2.id || this.player2.id;
            this.player2.win = options.player2.win || this.player2.win;
            this.player2.loss = options.player2.loss || this.player2.loss;
            this.player2.draw = options.player2.draw || this.player2.draw;
        }
        if (options.hasOwnProperty('path')) {
            this.path.win = options.path.win || this.path.win;
            this.path.loss = options.path.loss || this.path.loss;
        }
    }
}