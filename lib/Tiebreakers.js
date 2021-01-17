'use strict';

/**
 * Work for tiebreakers.
 * @namespace
 */
const Tiebreakers = {
    /**
     * Computes all tiebreakers for a player.
     * @param {Player} p The player being processed.
     * @param {Number} wv The value of a win.
     * @param {Number} lv The value of a loss.
     * @param {Number} dv The value of a draw.
     */
    compute: (p, wv, lv, dv) => {
        const calcCumulative = player => {
            let score = 0;
            let running = 0;
            player.results.forEach(r => {
                let inc = r === 'w' ? wv : r === 'd' ? dv : lv;
                score += inc;
                running += score;
            });
            return running;
        };
        const calcMatchWin = (player, type) => {
            let mwp = player.matchPoints / (wv * (player.results.length + player.byes));
            if (type === 'magic') return mwp < 0.33 ? 0.33 : mwp;
            else return mwp < 0.25 ? 0.25 : mwp;            
        };
        const calcGameWin = player => {
            let gwp = player.gamePoints / (wv * (player.results.length + player.byes));
            return gwp < 0.33 ? 0.33 : gwp;
        };
        const oppScores = p.results.map(a => a.opponent.matchPoints);
        p.tiebreakers.solkoff = oppScores.reduce((x, y) => x + y, 0);
        oppScores.splice(oppScores.indexOf(Math.min(...oppScores)), 1);
        p.tiebreakers.cutOne = oppScores.reduce((x, y) => x + y, 0);
        oppScores.splice(oppScores.indexOf(Math.max(...oppScores)), 1);
        p.tiebreakers.median = oppScores.reduce((x, y) => x + y, 0);
        let neustadtlScore = 0;
        p.results.forEach((r, i) => neustadtlScore += r === 'w' ? p.results[i].opponent.matchPoints : r === 'd' ? 0.5 * p.results[i].opponent.matchPoints : 0);
        p.tiebreakers.neustadtl = neustadtlScore;
        p.tiebreakers.cumulative = calcCumulative(p);
        p.tiebreakers.oppCumulative = p.results.reduce((x, y) => x + calcCumulative(y.opponent), 0);
        p.tiebreakers.matchWinPctM = calcMatchWin(p, 'magic');
        p.tiebreakers.matchWinPctP = calcMatchWin(p, 'pokemon');
        p.tiebreakers.gameWinPct = calcGameWin(p);
        p.tiebreakers.oppMatchWinPctM = p.results.reduce((x, y) => x + calcMatchWin(y.opponent, 'magic'), 0) / p.results.length;
        p.tiebreakers.oppMatchWinPctP = p.results.reduce((x, y) => x + calcMatchWin(y.opponent, 'pokemon'), 0) / p.results.length;
        p.tiebreakers.oppGameWinPct = p.results.reduce((x, y) => x + calcGameWin(y.opponent), 0) / p.results.length;
        let oppOppMatchSum = 0;
        p.results.forEach(r => oppOppMatchSum += r.opponent.results.reduce((x, y) => x + calcMatchWin(y.opponent, 'pokemon'), 0) / r.length);
        p.tiebreakers.oppOppMatchWinPct = oppOppMatchSum / p.results.length;
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
        equal: (a, b) => a.matches.filter(m => m.opponent.id === b.id).every(m => m.result === 'd'),
        diff: (a, b) => a.matches.filter(m => m.opponent.id === b.id).reduce((x, y) => x += y.result === 'w' ? -1 : y.result === 'l' ? 1 : 0, 0)
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

module.exports = Tiebreakers;
