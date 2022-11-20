import { Player } from "../Player.js";

export interface StandingsValues {
    player: Player,
    gamePoints: number,
    games: number,
    matchPoints: number,
    matches: number,
    tiebreaks: {
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
    } 
}