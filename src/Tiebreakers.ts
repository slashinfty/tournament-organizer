import { Player } from "./Player";
import { Structure } from "./Tournament";

/** Computes tiebreakers for all players in a tournament. */
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
        player.tiebreakers.cumulative = cumulativeScore;
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
            if (result.outcome === 'Win') return sum + opponent.matchPoints;
            if (result.outcome === 'Draw') return sum + (0.5 * opponent.matchPoints);
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

const sort = (tournament: Structure): Player[] => {
    
}

/**
 * Work for tiebreakers.
 * @namespace
 */
const Tiebreakers = {
    /**
     * Computes all tiebreakers for a player.
     * @param {Player} p The player being processed.
     * @param {Tournament} t The current tournament.
     */
    compute: (p, t) => {
        const calcCumulative = player => {
            let score = 0;
            let running = 0;
            player.results.forEach(r => {
                let inc = r.result === 'w' ? t.winValue : r === 'd' ? t.drawValue : t.lossValue;
                score += inc;
                running += score;
            });
            return running;
        };
        const calcMatchWin = (player, type) => {
            let mwp = player.matchPoints / (t.winValue * player.matches);
            if (isNaN(mwp)) mwp = 0;
            if (type === 'magic') return mwp < 0.33 ? 0.33 : mwp;
            else return mwp < 0.25 ? 0.25 : mwp;            
        };
        const calcGameWin = player => {
            let gwp = player.gamePoints / (t.winValue * player.games);
            if (isNaN(gwp)) gwp = 0;
            return gwp < 0.33 ? 0.33 : gwp;
        };
        const oppScores = p.results.map(a => {
            const o = t.players.find(x => x.id === a.opponent);
            return o.matchPoints;
        });
        p.tiebreakers.solkoff = oppScores.reduce((x, y) => x + y, 0);
        oppScores.splice(oppScores.indexOf(Math.min(...oppScores)), 1);
        p.tiebreakers.cutOne = oppScores.reduce((x, y) => x + y, 0);
        oppScores.splice(oppScores.indexOf(Math.max(...oppScores)), 1);
        p.tiebreakers.median = oppScores.reduce((x, y) => x + y, 0);
        let neustadtlScore = 0;
        p.results.forEach((r, i) => {
            const op = t.players.find(x => x.id === r.opponent);
            if (r.result === 'w') neustadtlScore += op.matchPoints;
            else if (r.result === 'd') neustadtlScore += 0.5 * op.matchPoints;
        });
        p.tiebreakers.neustadtl = neustadtlScore;
        p.tiebreakers.cumulative = calcCumulative(p);
        p.tiebreakers.oppCumulative = p.results.reduce((x, y) => {
            const op = t.players.find(z => z.id === y.opponent);
            return x + calcCumulative(op);
        }, 0);
        p.tiebreakers.matchWinPctM = calcMatchWin(p, 'magic');
        p.tiebreakers.matchWinPctP = calcMatchWin(p, 'pokemon');
        p.tiebreakers.gameWinPct = calcGameWin(p);
        p.tiebreakers.oppMatchWinPctM = p.results.reduce((x, y) => {
            const op = t.players.find(z => z.id === y.opponent);
            return x + calcMatchWin(op, 'magic');
        }, 0) / p.results.length;
        if (isNaN(p.tiebreakers.oppMatchWinPctM)) p.tiebreakers.oppMatchWinPctM = 0.33;
        p.tiebreakers.oppMatchWinPctP = p.results.reduce((x, y) => {
            const op = t.players.find(z => z.id === y.opponent);
            return x + calcMatchWin(op, 'pokemon');
        }, 0) / p.results.length;
        if (isNaN(p.tiebreakers.oppMatchWinPctP)) p.tiebreakers.oppMatchWinPctP = 0.25;
        p.tiebreakers.oppGameWinPct = p.results.reduce((x, y) => {
            const op = t.players.find(z => z.id === y.opponent);
            return x + calcGameWin(op);
        }, 0) / p.results.length;
        if (isNaN(p.tiebreakers.oppGameWinPct)) p.tiebreakers.oppGameWinPct = 0.33
        if (p.results.length === 0) p.tiebreakers.oppOppMatchWinPct = 0.25;
        else {
            let oppOppMatchSum = 0;
            p.results.forEach(r => {
                const o = t.players.find(x => x.id === r.opponent);
                oppOppMatchSum += o.results.reduce((x, y) => {
                    const op = t.players.find(z => z.id === y.opponent);
                    return x + calcMatchWin(op, 'pokemon')
                }, 0);
            });
            p.tiebreakers.oppOppMatchWinPct = oppOppMatchSum / p.results.length;
        }
    },
    /**
     * Contains equality and difference functions for match points.
     * @type {Object}
     */
    matchpoints: {
        equal: (a, b) => a.matchPoints === b.matchPoints,
        diff: (a, b) => b.matchPoints - a.matchPoints
    },
    /**
     * Contains equality and difference functions for the Buchholz Cut 1 tiebreaker.
     * @type {Object}
     */
    buchholzcut1: {
        equal: (a, b) => a.tiebreakers.cutOne === b.tiebreakers.cutOne,
        diff: (a, b) => b.tiebreakers.cutOne - a.tiebreakers.cutOne
    },
    /**
     * Contains equality and difference functions for the Solkoff/Buchholz tiebreaker.
     * @type {Object}
     */
    solkoff: {
        equal: (a, b) => a.tiebreakers.solkoff === b.tiebreakers.solkoff,
        diff: (a, b) => b.tiebreakers.solkoff - a.tiebreakers.solkoff
    },
    /**
     * Contains equality and difference functions for the Median-Buchholz tiebreaker.
     * @type {Object}
     */
    medianbuchholz: {
        equal: (a, b) => a.tiebreakers.median === b.tiebreakers.median,
        diff: (a, b) => b.tiebreakers.median - a.tiebreakers.median
    },
    /**
     * Contains equality and difference functions for the Sonneborn-Berger tiebreaker.
     * @type {Object}
     */
    sonnebornberger: {
        equal: (a, b) => a.tiebreakers.neustadtl === b.tiebreakers.neustadtl,
        diff: (a, b) => b.tiebreakers.neustadtl - a.tiebreakers.neustadtl
    },
    /**
     * Contains equality and difference functions for the cumulative and cumulative opponent's tiebreakers.
     * @type {Object}
     */
    cumulative: {
        equal: (a, b) => {
            if (a.tiebreakers.cumulative === b.tiebreakers.cumulative) {
                if (a.tiebreakers.oppCumulative === b.tiebreakers.oppCumulative) return true;
                else return 2;
            } else return 1;
        },
        diff: (a, b, n) => n === 1 ? b.tiebreakers.cumulative - a.tiebreakers.cumulative : b.tiebreakers.oppCumulative - a.tiebreakers.oppCumulative
    },
    /**
     * Contains equality and difference functions for the versus tiebreaker.
     * @type {Object}
     */
    versus: {
        equal: (a, b) => a.results.filter(m => m.opponent === b.id).every(m => m.result === 'd'),
        diff: (a, b) => a.results.filter(m => m.opponent === b.id).reduce((x, y) => x += y.result === 'w' ? -1 : y.result === 'l' ? 1 : 0, 0)
    },
    /**
     * Contains equality and difference functions for the Magic: the Gathering tiebreakers.
     * @type {Object}
     */
    magictcg: {
        equal: (a, b) => {
            if (a.tiebreakers.oppMatchWinPctM === b.tiebreakers.oppMatchWinPctM) {
                if (a.tiebreakers.gameWinPct === b.tiebreakers.gameWinPct) {
                    if (a.tiebreakers.oppGameWinPct === b.tiebreakers.oppGameWinPct) return true;
                    else return 3;
                } else return 2;
            } else return 1;
        },
        diff: (a, b, n) => n === 1 ? b.tiebreakers.oppMatchWinPctM - a.tiebreakers.oppMatchWinPctM : n === 2 ? b.tiebreakers.gameWinPct - a.tiebreakers.gameWinPct : b.tiebreakers.oppGameWinPct - a.tiebreakers.oppGameWinPct
    },
    /**
     * Contains equality and difference functions for the Pokemon TCG tiebreakers.
     * @type {Object}
     */
    pokemontcg: {
        equal: (a, b) => {
            if (a.tiebreakers.oppMatchWinPctP === b.tiebreakers.oppMatchWinPctP) {
                if (a.tiebreakers.oppOppMatchWinPct === b.tiebreakers.oppOppMatchWinPct) return true;
                else return 2;
            } else return 1;
        },
        diff: (a, b, n) => n === 1 ? b.tiebreakers.oppMatchWinPctP - a.tiebreakers.oppMatchWinPctP : b.tiebreakers.oppOppMatchWinPct - a.tiebreakers.oppOppMatchWinPct
    }
};

export { compute, sort };
