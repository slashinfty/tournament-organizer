export class Player {
    id: string;

    alias: string;

    active: boolean;

    matches: Array<{
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
        this.matches = [];
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
        return this.matches;
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