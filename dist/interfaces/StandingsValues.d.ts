import { Player } from "../components/Player.js";
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
         * A player's Solkoff (or Buchholz) score.
         */
        solkoff: number;
        /**
         * A player's Sonneborn-Berger score.
         */
        sonnebornBerger: number;
        /**
         * A player's Koya system score.
         */
        koyaSystem: number;
        /**
         * A player's cumulative score.
         */
        cumulative: number;
        /**
         * A player's cumulative opponent's score.
         */
        oppCumulative: number;
        /**
         * A player's number of earned match wins.
         */
        earnedMatchWins: number;
        /**
         * A player's number of earned match losses.
         */
        earnedMatchLosses: number;
        /**
         * A player's number of earned game wins.
         */
        earnedGameWins: number;
        /**
         * A player's number of earned game losses.
         */
        earnedGameLosses: number;
        /**
         * A player's difference between earned game wins and earned game losses.
         */
        gameWinDifferential: number;
        /**
         * A player's record versus players with the same number of match points.
         */
        neighborhoodRecord: number;
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
