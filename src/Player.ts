export class Player {
    id: string;

    alias: string;

    active: boolean;

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

    constructor(id: string, alias: string) {
        this.id = id;
        this.alias = alias;
        this.active = true;
        this.results = [];
    }

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

    removeMatch(id: string) {
        this.matches.splice(this.matches.findIndex(m => m.id === id), 1);
    }
}