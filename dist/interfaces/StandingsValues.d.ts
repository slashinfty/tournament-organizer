import { Player } from "../Player.js";
/**
 * Properties of standings
 */
export interface StandingsValues {
    /**
     * The player represented by the values.
     */
    player: Player;
    /**
     * Number of points earned based on games.
     */
    gamePoints: number;
    /**
     * Number of games played.
     */
    games: number;
    /**
     * Number of points earned based on matches.
     */
    matchPoints: number;
    /**
     * Number of matches played.
     */
    matches: number;
    /**
     * Values for all tiebreakers.
     */
    tiebreaks: {
        /**
         * A player's Median-Buchholz (or Harkness) score.
         */
        medianBuchholz: number;
        /**
         * A player's Solkoff score.
         */
        solkoff: number;
        /**
         * A player's Sonneborn-Berger score.
         */
        sonnebornBerger: number;
        /**
         * A player's cumulative score.
         */
        cumulative: number;
        /**
         * A player's cumulative opponent's score.
         */
        oppCumulative: number;
        /**
         * A player's match win percentage.
         */
        matchWinPct: number;
        /**
         * A player's opponent's match win percentage.
         */
        oppMatchWinPct: number;
        /**
         * A player's opponent's opponent's match win percentage.
         */
        oppOppMatchWinPct: number;
        /**
         * A player's game win percentage.
         */
        gameWinPct: number;
        /**
         * A player's opponent's game win percentage.
         */
        oppGameWinPct: number;
    };
}
