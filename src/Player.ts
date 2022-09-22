/** Class representing a player */
export class Player {
    /** Unique ID of the player */
    id: string;

    /** Name of the player */
    alias: string;

    /** If the player is active */
    active: boolean;

    /** Array of matches the player is in */
    results: Array<{
        id: string,
        round: number,
        match: number,
        opponent: string,
        result: {
            win: number,
            draw: number,
            loss: number,
            pairUpDown: boolean,
            bye: boolean
        } | undefined
    }>;

    /** Create a new player */
    constructor(id: string, alias: string) {
        this.id = id;
        this.alias = alias;
        this.active = true;
        this.results = [];
    }

    /** Get all player information */
    get data(): {
        id: string,
        alias: string,
        active: boolean,
        results: Array<{
            id: string,
            round: number,
            match: number,
            opponent: string,
            result: {
                win: number,
                draw: number,
                loss: number,
                pairUpDown: boolean,
                bye: boolean
            } | undefined
        }>
    } {
        return {
            id: this.id,
            alias: this.alias,
            active: this.active,
            results: this.results
        };
    }

    /** Set information about the player (only changes in information need to be included in the object) */
    set data(values: {
        id?: string,
        alias?: string,
        active?: boolean,
        results?: Array<{
            id: string,
            round: number,
            match: number,
            opponent: string,
            result: {
                win: number,
                draw: number,
                loss: number,
                pairUpDown: boolean,
                bye: boolean
            } | undefined
        }>
    }) {
        this.id = values.id || this.id;
        this.alias = values.alias || this.alias;
        this.active = values.active || this.active;
        this.results = values.results || this.results;
    }

    /** Return an array of matches the player is part of */
    get matches(): Array<{
        id: string,
        round: number,
        match: number,
        opponent: string,
        result: {
            win: number,
            draw: number,
            loss: number,
            pairUpDown: boolean,
            bye: boolean
        } | undefined
    }> {
        return this.results;
    }

    /** Add a new match for the player */
    set match(match: {
        id: string,
        round: number,
        match: number,
        opponent: string,
        result: {
            win: number,
            draw: number,
            loss: number,
            pairUpDown: boolean,
            bye: boolean
        } | undefined
    }) {
        this.matches.push(match);
    }

    /** Record the result of a match for a player */
    set result(result: {
        id: string,
        win: number,
        draw: number,
        loss: number
    }) {
        const match = this.results.find(r => r.id === result.id);
        Object.assign(match.result, {
            win: result.win,
            draw: result.draw,
            loss: result.loss
        });
    }

    /** Remove a match from player history */
    removeMatch(id: string) {
        this.matches.splice(this.matches.findIndex(m => m.id === id), 1);
    }
}