/**
 * Properties of matches
 */
export interface MatchValues {
    /**
     * Unique identifier of the match.
     */
    id: string;
    /**
     * Round number of the match.
     */
    round: number;
    /**
     * Match number of the match.
     */
    match: number;
    /**
     * If the match is active in the tournament.
     *
     * Initialized as `false`
     */
    active: boolean;
    /**
     * If the match is an assigned bye.
     *
     * Initialized as `false`
     */
    bye: boolean;
    /**
     * If the match is an assigned loss.
     *
     * Initialized as `false`
     */
    loss: boolean;
    /**
     * Details about player one in the match.
     *
     * Initialized as:
     * ```
     * {
     *     id: null,
     *     win: 0,
     *     loss: 0,
     *     draw: 0
     * }
     * ```
     */
    player1: {
        /**
         * ID for player one (or `null` if no player assigned).
         */
        id: string | null;
        /**
         * Number of wins for player one.
         */
        win: number;
        /**
         * Number of losses for player one.
         */
        loss: number;
        /**
         * Number of draws.
         */
        draw: number;
    };
    /**
     * Details about player two in the match.
     *
     * Initialized as:
     * ```
     * {
     *     id: null,
     *     win: 0,
     *     loss: 0,
     *     draw: 0
     * }
     * ```
     */
    player2: {
        /**
         * ID for player two (or `null` if no player assigned).
         */
        id: string | null;
        /**
         * Number of wins for player two.
         */
        win: number;
        /**
         * Number of losses for player two.
         */
        loss: number;
        /**
         * Number of draws for player two.
         */
        draw: number;
    };
    /**
     * Details about the subsequent matches for the players if the current format is elimination or stepladder.
     *
     * Initialized as:
     * ```
     * {
     *     win: null,
     *     loss: null
     * }
     * ```
     */
    path: {
        /**
         * ID of the next match for the winner of the current match (or `null` if none).
         */
        win: string | null;
        /**
         * ID of the next match for the loser of the current match (or `null` if none).
         */
        loss: string | null;
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
