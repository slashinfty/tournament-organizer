/**
 * Properties of players
 */
export interface PlayerValues {
    /**
     * Unique identifier of the player.
     */
    id: string;
    /**
     * Name of the player.
     */
    name: string;
    /**
     * If the player is active in the tournament.
     *
     * Initialized as `true`
     */
    active: boolean;
    /**
     * A value used for seeding players, such as rank or rating.
     *
     * Initialized as `0`
     */
    value: number;
    /**
     * Array of matches that the player is involved in.
     *
     * Initialized as `[]`
     */
    matches: Array<{
        /**
         * The ID of the match.
         */
        id: string;
        /**
         * The ID of the opponent (or `null` if no opponent).
         */
        opponent: string | null;
        /**
         * If the opponent has a different point total before the match (used in Swiss pairings).
         */
        pairUpDown: boolean;
        /**
         * If the player is player one (`1`) or player two (`-1`) in the match (used if `seating: true`).
         */
        seating: 1 | -1 | null;
        /**
         * If the match is a bye.
         */
        bye: boolean;
        /**
         * Number of wins for the player in the match.
         */
        win: number;
        /**
         * Number of losses for the player in the match.
         */
        loss: number;
        /**
         * Number of draws in the match.
         */
        draw: number;
    }>;
    /**
     * Object for storing any additional information, useful for implementations of the library.
     *
     * Initialized as `{}`
     */
    meta: {
        [key: string]: any;
    };
}
