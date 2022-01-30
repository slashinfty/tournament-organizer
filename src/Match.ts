/** Class representing a match. */
export class Match {

    /** Unique ID of the match. */
    id: string;

    /** Round number for the match. */
    round: number;

    /** Match number for the round. */
    match: number;

    /** ID of player one. */
    playerOne: string | null;

    /** ID of player two. */
    playerTwo: string | null;

    /** If the match is currently active and awaiting a result. */
    active: boolean;

    /** Result of the match. */
    result: {
        playerOneWins: number,
        playerTwoWins: number,
        draws: number
    };

    /** ID of the next match for the winner in an elimination tournament. */
    winnersPath: string | null;

    /** ID of the next match for the loser (if it exists) in an elimination tournament. */
    losersPath: string | null;

    constructor(opt: {
        id: string,
        round: number,
        match: number,
        playerOne?: string,
        playerTwo?: string,
        active?: boolean,
        winnersPath?: string,
        losersPath?: string
    }) {

        // Default values
        let options = Object.assign({
            playerOne: null,
            playerTwo: null,
            active: false,
            winnersPath: null,
            losersPath: null 
        }, opt);

        this.id = options.id;
        this.round = options.round;
        this.match = options.match;
        this.playerOne = options.playerOne;
        this.playerTwo = options.playerTwo;
        this.active = options.active;
        this.result = {
            playerOneWins: 0,
            playerTwoWins: 0,
            draws: 0
        };
        this.winnersPath = options.winnersPath;
        this.losersPath = options.losersPath;
    }
}