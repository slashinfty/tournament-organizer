/** Class representing a player. */
export class Player {
    id: string;
    alias: string;
    seed: number;
    initialByes: number;
    pairingBye: boolean;
    matchCount: number;
    matchPoints: number;
    gameCount: number;
    gamePoints: number;
    active: boolean;
    results: {
        match: string,
        round: number,
        opponent: string,
        outcome: 'Win' | 'Loss' | 'Draw' | 'Bye',
        matchPoints: number,
        gamePoints: number,
        games: number
    }[];
    tiebreakers: {
        medianBuchholz: number,
        solkoff: number,
        sonnebornBerger: number,
        cumulative: number,
        oppCumulative: number,
        matchWinPct: number,
        oppMatchWinPct: number,
        oppOppMatchWinPct: number,
        gameWinPct: number,
        oppGameWinPct: number
    };

    constructor(opt: {
        id: string,
        alias: string,
        seed?: number,
        initialByes?: number
    }) {       
        
        // Default values
        let options = Object.assign({
            seed: 0,
            initialByes: 0
        }, opt);

        /** Unique ID of the player. */
        this.id = options.id;

        /** Name of the player. */
        this.alias = options.alias;

        /** Seed value for the player, if players are to be sorted. */
        this.seed = options.seed;

        /** Number of initial byes for a player in a Swiss tournament. */
        this.initialByes = options.initialByes;

        /** If the player has received a pairing bye. */
        this.pairingBye = false;

        /** Number of matches played. */
        this.matchCount = 0;

        /** Number of match points. */
        this.matchPoints = 0;
        
        /** Number of games played. */
        this.gameCount = 0;

        /** Number of game points. */
        this.gamePoints = 0;

        /** If the player is actively in the tournament. */
        this.active = true;

        /** Results from each match. */
        this.results = [];

        /** Tiebreaker values for Swiss and round-robin tournaments. */
        this.tiebreakers = {
            medianBuchholz: 0,
            solkoff: 0,
            sonnebornBerger: 0,
            cumulative: 0,
            oppCumulative: 0,
            matchWinPct: 0,
            oppMatchWinPct: 0,
            oppOppMatchWinPct: 0,
            gameWinPct: 0,
            oppGameWinPct: 0
        }
    }
}