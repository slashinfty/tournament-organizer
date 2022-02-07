import { Player } from "./Player.js";
import { Structure } from "./Tournament.js";

/** 
 * Computes tiebreakers for all players in a tournament. 
 * @param tournament The tournament under consideration.
 * @internal
*/
const compute = (tournament: Structure): void => {
    
    // Compute game win percentage, match win percentage, and cumulative score for each player
    for (let i = 0; i < tournament.players.length; i++) {

        // If the current player has played no matches, set tiebreakers to zero
        const player = tournament.players[i];
        if (player.matchCount === 0) {
            for (const tiebreak in player.tiebreakers) {
                player.tiebreakers[tiebreak] = 0;
            }
            continue;
        }

        // Calculate game win percentage
        player.tiebreakers.gameWinPct = player.gamePoints / player.gameCount;

        // Calculate match win percentage
        player.tiebreakers.matchWinPct = player.matchPoints / (player.matchCount * tournament.pointsForWin);

        // Calculate cumulative score
        let cumulativeScore = 0;
        let matchPointsAfterEachRound = 0;
        for (let i = 1; i <= player.results.length; i++) {
            const currentMatch = player.results.find(result => result.round === i);
            if (currentMatch === undefined) continue;
            matchPointsAfterEachRound += currentMatch.matchPoints;
            cumulativeScore += matchPointsAfterEachRound;
        }
        player.tiebreakers.cumulative = cumulativeScore - (tournament.pointsForWin * player.results.reduce((sum, result) => result.outcome === 'bye' ? sum + 1 : sum, 0));
    }

    // Calculate all remaining tiebreakers except for opponent's opponent match win percentage
    for (let i = 0; i < tournament.players.length; i++) {
        
        // If the current player has played no matches, contine
        const player = tournament.players[i];
        if (player.matchCount === 0) continue;

        // Get the current player's opponents
        const opponents = tournament.players.filter(opp => player.results.some(result => result.opponent === opp.id));

        // Calculate opponent match win percentage
        player.tiebreakers.oppMatchWinPct = opponents.reduce((sum, opponent) => sum + opponent.tiebreakers.matchWinPct, 0) / opponents.length;

        // Calculate opponent game win percentage
        player.tiebreakers.oppGameWinPct = opponents.reduce((sum, opponent) => sum + opponent.tiebreakers.gameWinPct, 0) / opponents.length;

        // Calculate Buchholz tiebreaks
        const buchholzScores = opponents.map(opp => opp.matchPoints);
        player.tiebreakers.solkoff = buchholzScores.reduce((sum, score) => sum + score, 0);
        if (buchholzScores.length > 2) {
            const maximum = buchholzScores.reduce((currentMax, currentScore) => Math.max(currentMax, currentScore), 0);
            const minimum = buchholzScores.reduce((currentMin, currentScore) => Math.min(currentMin, currentScore), maximum);
            buchholzScores.splice(buchholzScores.findIndex(score => score === maximum), 1);
            buchholzScores.splice(buchholzScores.findIndex(score => score === minimum), 1);
            player.tiebreakers.medianBuchholz = buchholzScores.reduce((sum, score) => sum + score, 0);
        }

        // Calculate Sonneborn-Berger tiebreak
        player.tiebreakers.sonnebornBerger = opponents.reduce((sum, opponent) => {
            const result = player.results.find(res => res.opponent === opponent.id);
            if (result === undefined) return sum;
            if (result.outcome === 'win') return sum + opponent.matchPoints;
            if (result.outcome === 'draw') return sum + (0.5 * opponent.matchPoints);
            return sum;
        }, 0);

        // Calculate opponent cumulative score
        player.tiebreakers.oppCumulative = opponents.reduce((sum, opponent) => sum + opponent.tiebreakers.cumulative, 0);
    }

    // Calculate opponent's opponent's match win percentage
    for (let i = 0; i < tournament.players.length; i++) {
        
        // If the current player has played no matches, contine
        const player = tournament.players[i];
        if (player.matchCount === 0) continue;

        // Get the current player's opponents
        const opponents = tournament.players.filter(opp => player.results.some(result => result.opponent === opp.id));

        player.tiebreakers.oppOppMatchWinPct = opponents.reduce((sum, opponent) => sum + opponent.tiebreakers.oppMatchWinPct, 0) / opponents.length;
    }
}

/**
 * Sorts players by points and tiebreakers.
 * @param players The array of players being sorted.
 * @param tournament The tournament the players belong to.
 * @returns A sorted array of players.
 * @internal
 */
const sort = (players: Player[], tournament: Structure): Player[] => {
    return players.sort((playerA, playerB) => {
        
        // If the players have different match points, sort them by match points
        if (playerA.matchPoints !== playerB.matchPoints) return playerB.matchPoints - playerA.matchPoints;

        // Go through tiebreakers individually and return the first difference
        if (tournament.tiebreakers !== undefined) {
            for (let i = 0; i < tournament.tiebreakers.length; i++) {
                switch (tournament.tiebreakers[i]) {
                    case 'median buchholz':
                        if (playerA.tiebreakers.medianBuchholz === playerB.tiebreakers.medianBuchholz) continue;
                        else return playerB.tiebreakers.medianBuchholz - playerA.tiebreakers.medianBuchholz;
                    case 'solkoff':
                        if (playerA.tiebreakers.solkoff === playerB.tiebreakers.solkoff) continue;
                        else return playerB.tiebreakers.solkoff - playerA.tiebreakers.solkoff;
                    case 'sonneborn berger':
                        if (playerA.tiebreakers.sonnebornBerger === playerB.tiebreakers.sonnebornBerger) continue;
                        else return playerB.tiebreakers.sonnebornBerger - playerA.tiebreakers.sonnebornBerger;
                    case 'cumulative':
                        if (playerA.tiebreakers.cumulative === playerB.tiebreakers.cumulative) {
                            if (playerA.tiebreakers.oppCumulative === playerB.tiebreakers.oppCumulative) continue;
                            else return playerB.tiebreakers.oppCumulative - playerA.tiebreakers.oppCumulative;
                        } else return playerB.tiebreakers.cumulative - playerA.tiebreakers.cumulative;
                    case 'versus':
                        const commonMatches = playerA.results.filter(result => result.opponent === playerB.id).map(result => result.match);
                        if (commonMatches.length === 0) continue;
                        const pointsForPlayerA = playerA.results.filter(result => commonMatches.some(id => id === result.match)).reduce((sum, result) => result.outcome === 'win' ? sum + 1 : result.outcome === 'draw' ? sum + 0.5 : sum, 0);
                        const pointsForPlayerB = playerB.results.filter(result => commonMatches.some(id => id === result.match)).reduce((sum, result) => result.outcome === 'win' ? sum + 1 : result.outcome === 'draw' ? sum + 0.5 : sum, 0);
                        if (pointsForPlayerA === pointsForPlayerB) continue;
                        else return pointsForPlayerB - pointsForPlayerA;
                    case 'game win percentage':
                        if (playerA.tiebreakers.gameWinPct === playerB.tiebreakers.gameWinPct) continue;
                        else return playerB.tiebreakers.gameWinPct - playerA.tiebreakers.gameWinPct;
                    case 'opponent game win percentage':
                        if (playerA.tiebreakers.oppGameWinPct === playerB.tiebreakers.oppGameWinPct) continue;
                        else return playerB.tiebreakers.oppGameWinPct - playerA.tiebreakers.oppGameWinPct;
                    case 'opponent match win percentage':
                        if (playerA.tiebreakers.oppMatchWinPct === playerB.tiebreakers.oppMatchWinPct) continue;
                        else return playerB.tiebreakers.oppMatchWinPct - playerA.tiebreakers.oppMatchWinPct;
                    case 'opponent opponent match win percentage':
                        if (playerA.tiebreakers.oppOppMatchWinPct === playerB.tiebreakers.oppOppMatchWinPct) continue;
                        else return playerB.tiebreakers.oppOppMatchWinPct - playerB.tiebreakers.oppOppMatchWinPct;
                }
            }
        }

        // If all tiebreakers are equal, sort by ID
        return playerB.id < playerA.id ? 1 : -1;
    });
}

export { compute, sort };