/** Class representing a match */
export class Match {
    /** Unique ID of the match */
    id: string;

    round: number;

    match: number;

    active: boolean;

    playerA: string | undefined;

    playerB: string | undefined;

    result: {
        playerA: number,
        playerB: number,
        draw: number
    };

    pairUpDown: boolean;

    bye: boolean;

    path: {
        win: string | undefined,
        loss: string | undefined
    } | undefined;

    constructor(id: string, round: number, match: number) {
        this.id = id;
        this.round = round;
        this.match = match;
        this.active = false;
        this.playerA = undefined;
        this.playerB = undefined;
        this.result = {
            playerA: 0,
            playerB: 0,
            draw: 0
        };
        this.pairUpDown = false;
        this.bye = false;
        this.path = undefined;
    }

    set data(values: {
        id?: string,
        round?: number,
        match?: number,
        active?: boolean,
        playerA?: string | undefined,
        playerB?: string | undefined,
        result?: {
            playerA?: number,
            playerB?: number,
            draw?: number
        },
        pairUpDown?: boolean,
        bye?: boolean,
        path?: {
            win?: string | undefined,
            loss?: string | undefined
        }
    }) {
        this.id = values.id || this.id;
        this.round = values.round || this.round;
        this.match = values.match || this.match;
        this.active = values.active || this.active;
        this.playerA = values.playerA || this.playerA;
        this.playerB = values.playerB || this.playerB;
        if (values.hasOwnProperty('result')) {
            this.result.playerA = values.result.playerA || this.result.playerA;
            this.result.playerB = values.result.playerB || this.result.playerB;
            this.result.draw = values.result.draw || this.result.draw;
        }
        this.pairUpDown = values.pairUpDown || this.pairUpDown;
        this.bye = values.bye || this.bye;
        if (values.hasOwnProperty('path')) {
            this.path.win = values.path.win || this.path.win;
            this.path.loss = values.path.loss || this.path.loss;
        }
    }

    result(values: {
        playerA: number,
        playerB: number,
        draw?: number
    }) {
        this.result.playerA = values.playerA;
        this.result.playerB = values.playerB;
        this.result.draw = values.draw || this.result.draw;
        this.active = false;
    }

    clearResult() {
        this.result = {
            playerA: 0,
            playerB: 0,
            draw: 0
        };
        this.active = true;
    }
}