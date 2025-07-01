import { MatchValues } from "../interfaces/MatchValues.js";
import { SettableMatchValues } from "../interfaces/SettableMatchValues.js";

/** 
 * Class representing a match.
 * 
 * See {@link MatchValues} for detailed descriptions of properties.
 */
export class Match {
    /** Unique ID of the match */
    #id: MatchValues['id'];

    /** Round number for the match */
    #round: MatchValues['round'];

    /** Match number for the match */
    #match: MatchValues['match'];

    /** If the match is active */
    #active: MatchValues['active'];

    /** If the match is an assigned bye */
    #bye: MatchValues['bye'];

    /** If the match is an assigned loss */
    #loss: MatchValues['loss'];

    /** Details for player one */
    #player1: MatchValues['player1'];

    /** Details for player two */
    #player2: MatchValues['player2'];

    /** Next match for winners and losers */
    #path: MatchValues['path'];

    /** Any extra information */
    #meta: MatchValues['meta'];

    /** Create a new match. */
    constructor(id: string, round: number, match: number) {
        this.#id = id;
        this.#round = round;
        this.#match = match;
        this.#active = false;
        this.#bye = false;
        this.#loss = false;
        this.#player1 = {
            id: null,
            win: 0,
            loss: 0,
            draw: 0
        };
        this.#player2 = {
            id: null,
            win: 0,
            loss: 0,
            draw: 0
        }
        this.#path = {
            win: null,
            loss: null
        }
        this.#meta = {};
    }

    /** Set information about the match (only changes in information need to be included in the object) */
    set(options: SettableMatchValues) {
        if (options.hasOwnProperty('round')) this.#round = options.round;
        if (options.hasOwnProperty('match')) this.#match = options.match;
        if (options.hasOwnProperty('active')) this.#active = options.active;
        if (options.hasOwnProperty('bye')) this.#bye = options.bye;
        if (options.hasOwnProperty('loss')) this.#loss = options.loss;
        if (options.hasOwnProperty('player1')) Object.assign(this.#player1, options.player1);
        if (options.hasOwnProperty('player2')) Object.assign(this.#player2, options.player2);
        if (options.hasOwnProperty('path')) Object.assign(this.#path, options.path);
        if (options.hasOwnProperty('meta')) Object.assign(this.#meta, options.meta);
    }

    getId(): MatchValues['id'] {
        return this.#id;
    }

    getRoundNumber(): MatchValues['round'] {
        return this.#round;
    }

    getMatchNumber(): MatchValues['match'] {
        return this.#match;
    }

    isActive(): MatchValues['active'] {
        return this.#active;
    }

    isPaired(): Boolean {
        return this.#player1.id !== null && (this.#player2.id !== null || this.#bye || this.#loss);
    }

    hasEnded(): Boolean {
        return !this.#active &&
            (this.#player1.win > 0 || this.#player1.loss > 0 || this.#player1.draw > 0) &&
            (this.#player2.win > 0 || this.#player2.loss > 0 || this.#player2.draw > 0)
    }

    isBye(): MatchValues['bye'] {
        return this.#bye;
    }

    getPlayer1(): MatchValues['player1'] {
        return this.#player1;
    }

    getPlayer2(): MatchValues['player2'] {
        return this.#player2;
    }

    getWinner(): MatchValues['player1'] | null {
        if (this.hasEnded() === false) return null;
        return this.#player1.win > this.#player2.win ? this.#player1 : this.#player2.win > this.#player1.win ? this.#player2 : null;
    }

    getLoser(): MatchValues['player1'] | null {
        if (this.hasEnded() === false) return null;
        return this.#player1.loss > this.#player2.loss ? this.#player1 : this.#player2.loss > this.#player1.loss ? this.#player2 : null;
    }

    getPath(): MatchValues['path'] {
        return this.#path;
    }

    getMeta(): MatchValues['meta'] {
        return this.#meta;
    }

    getValues(): MatchValues {
        return {
            id: this.#id,
            round: this.#round,
            match: this.#match,
            active: this.#active,
            bye: this.#bye,
            loss: this.#loss,
            player1: this.#player1,
            player2: this.#player2,
            path: this.#path,
            meta: this.#meta
        }
    }
}