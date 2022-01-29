/** Class representing a match. */
export class Match {
    id: string;
    round: number;
    match: number;
    playerOne: string | null;
    playerTwo: string | null;
    active: boolean;
    result: {
        playerOneWins: number,
        playerTwoWins: number,
        draws: number
    };
    winnersPath: string | null;
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

        /** Unique ID of the match. */
        this.id = options.id;
        
        /** Round number for the match. */
        this.round = options.round;

        /** Match number for the round. */
        this.match = options.match;

        /** ID of player one. */
        this.playerOne = options.playerOne;

        /** ID of player two. */
        this.playerTwo = options.playerTwo;

        /** If the match is currently active and awaiting a result. */
        this.active = options.active;

        /** Result of the match. */
        this.result = {
            playerOneWins: 0,
            playerTwoWins: 0,
            draws: 0
        };

        /** The next match for the winner in an elimination tournament. */
        this.winnersPath = options.winnersPath;

        /** The next match for the loser (if it exists) in an elimination tournament. */
        this.losersPath = options.losersPath;
    }
}