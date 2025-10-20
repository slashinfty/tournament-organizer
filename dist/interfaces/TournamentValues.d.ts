import { Match } from '../components/Match.js';
import { Player } from '../components/Player.js';
/**
 * Properties of tournaments
 */
export interface TournamentValues {
    /**
     * Unique ID of the tournament.
     */
    id: string;
    /**
     * Name of the tournament.
     */
    name: string;
    /**
     * Current state of the tournament.
     *
     * Initialized as `'setup'`
     */
    status: 'setup' | 'stage-one' | 'stage-two' | 'complete';
    /**
     * Current round of the tournament.
     *
     * Initialized as `0`
     */
    round: number;
    /**
     * Array of all players in the tournament.
     *
     * Initialized as `[]`
     */
    players: Array<Player>;
    /**
     * Array of all matches in the tournament.
     *
     * Initialized as `[]`
     */
    matches: Array<Match>;
    /**
     * If the order of players in matches matters.
     *
     * Initialized as `false`
     */
    seating: boolean;
    /**
     * Method of sorting players, if they are rated/seeded.
     *
     * Initialized as `'none'`
     */
    sorting: 'ascending' | 'descending' | 'none';
    /**
     * Details about scoring, including point values for all outcomes and a sorted list of tiebreakers.
     *
     * Initialized as:
     *
     * ```
     * {
     *     bestOf: 1,
     *     win: 1,
     *     draw: 0.5,
     *     loss: 0,
     *     bye: 1,
     *     tiebreaks: []
     * }
     * ```
     */
    scoring: {
        /**
         * Number of possible games. Used to determine number of wins in a bye.
         */
        bestOf: number;
        /**
         * Points awarded for winning a match.
         */
        win: number;
        /**
         * Points awarded for drawing a match.
         */
        draw: number;
        /**
         * Points awarded for losing a match.
         */
        loss: number;
        /**
         * Points awarded for receiving a bye.
         */
        bye: number;
        /**
         * Array of tiebreakers being used.
         */
        tiebreaks: Array<'median buchholz' | 'solkoff' | 'sonneborn berger' | 'koya system' | 'cumulative' | 'earned match wins' | 'earned match losses' | 'earned game wins' | 'earned game losses' | 'game win differential' | 'neighborhood record' | 'versus' | 'mutual versus' | 'game win percentage' | 'opponent game win percentage' | 'opponent match win percentage' | 'opponent opponent match win percentage'>;
    };
    /**
     * Details about the first stage of the tournament.
     *
     * Initialized as:
     *
     * ```
     * {
     *     format: 'single-elimination',
     *     consolation: false,
     *     rounds: 0,
     *     initialRound: 1,
     *     maxPlayers: 0
     * }
     * ```
     */
    stageOne: {
        /**
         * Format for the first stage.
         */
        format: 'single-elimination' | 'double-elimination' | 'stepladder' | 'swiss' | 'round-robin' | 'double-round-robin';
        /**
         * If there is a third place match for single elimination.
         */
        consolation: boolean;
        /**
         * Number of rounds in the first stage.
         */
        rounds: number;
        /**
         * Number of the first round.
         */
        initialRound: number;
        /**
         * Maximum number of players who can be enrolled. There is no maximum if this is zero.
         */
        maxPlayers: number;
    };
    /**
     * Details about the second stage of the tournament.
     *
     * Initialized as:
     *
     * ```
     * {
     *     format: null,
     *     consolation: false,
     *     advance: {
     *         value: 0,
     *         method: 'all'
     *     }
     * }
     * ```
     */
    stageTwo: {
        /**
         * Format for the second stage. If `null`, then there is no stage two.
         */
        format: 'single-elimination' | 'double-elimination' | 'stepladder' | null;
        /**
         * If there is a third place match for single elimination.
         */
        consolation: boolean;
        /**
         * Determines how players advance from stage one to stage two.
         */
        advance: {
            /**
             * The breakpoint value for advancing players (greater than or equal to if `method: 'points'` and less than or equal to if `method: 'rank'`).
             */
            value: number;
            /**
             * The type of value to use if players advance.
             */
            method: 'points' | 'rank' | 'all';
        };
    };
    /**
     * Object for storing any additional information, useful for implementations of the library.
     *
     * Initialized as `{}`
     */
    meta: {
        [key: string]: any;
    };
}
