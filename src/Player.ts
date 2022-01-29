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
        opponent: string,
        matchPoints: number,
        gamePoints: number,
        games: number
    }[];
    tiebreakers: {
        buchholz: number,
        solkoff: number,
        sonnebornBerger: number,
        cumulative: number,
        oppCumulative: number,
        oppMatchWinPct: number,
        oppOppMatchWinPct: number,
        gameWinPct: number,
        oppGameWinPct: number
    };

    constructor(options: {
        id: string,
        alias: string,
        seed: number,
        initialByes: number
    }) {       
        
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
            buchholz: 0,
            solkoff: 0,
            sonnebornBerger: 0,
            cumulative: 0,
            oppCumulative: 0,
            oppMatchWinPct: 0,
            oppOppMatchWinPct: 0,
            gameWinPct: 0,
            oppGameWinPct: 0
        }
    }
}