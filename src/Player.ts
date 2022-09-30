/** Class representing a player */
export class Player {
    /** Unique ID of the player */
    id: string;

    /** Name of the player */
    alias: string;

    /** If the player is active */
    active: boolean;

    /** Array of matches the player is in */
    matches: Array<{
        id: string,
        round: number,
        match: number,
        opponent: string,
        pairUpDown: boolean,
        bye: boolean
        result: {
            win: number,
            draw: number,
            loss: number
        } | undefined
    }>;

    /** Create a new player */
    constructor(id: string, alias: string) {
        this.id = id;
        this.alias = alias;
        this.active = true;
        this.matches = [];
    }

    /** Set information about the player (only changes in information need to be included in the object) */
    set data(values: {
        id?: string,
        alias?: string,
        active?: boolean,
        matches?: Array<{
            id: string,
            round: number,
            match: number,
            opponent: string,
            pairUpDown: boolean,
            bye: boolean
            result: {
                win: number,
                draw: number,
                loss: number,
            } | undefined
        }>
    }) {
        this.id = values.id || this.id;
        this.alias = values.alias || this.alias;
        this.active = values.active || this.active;
        this.matches = values.matches || this.matches;
    }

    /** Add a new match for the player */
    createMatch(match: {
        id: string,
        round: number,
        match: number,
        opponent: string,
        pairUpDown: boolean,
        bye: boolean
        result: {
            win: number,
            draw: number,
            loss: number
        } | undefined
    }) {
        this.matches.push(match);
    }

    /** Remove a match from player history */
    removeMatch(id: string) {
        this.matches.splice(this.matches.findIndex(m => m.id === id), 1);
    }

    /** Record the result of a match for a player */
    result(result: {
        id: string,
        win: number,
        draw: number,
        loss: number
    }) {
        const match = this.matches.find(m => m.id === result.id);
        Object.assign(match.result, {
            win: result.win,
            draw: result.draw,
            loss: result.loss
        });
    }

    /** Clear the result of a match for a player */
    clearResult(id: string) {
        const match = this.matches.find(m => m.id === id);
        match.result = undefined;
    }
}