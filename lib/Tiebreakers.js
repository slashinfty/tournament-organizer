'use strict';

/**
 * Work for tiebreakers.
 * @namespace
 */
const Tiebreakers = {
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
        const oppScores = p.opponents.map(o => o.matchPoints);
        p.tiebreakers.solkoff = oppScores.reduce((x, y) => x + y);
        oppScores.splice(oppScores.indexOf(Math.min(...oppScores)), 1);
        p.tiebreakers.cutOne = oppScores.reduce((x, y) => x + y);
        oppScores.splice(oppScores.indexOf(Math.max(...oppScores)), 1);
        p.tiebreakers.median = oppScores.reduce((x, y) => x + y);
        let neustadtlScore = 0;
        p.results.forEach((r, i) => neustadtlScore += r === 'w' ? p.opponents[i].matchPoints : r === 'd' ? 0.5 * p.opponents[i].matchPoints : 0);
        p.tiebreakers.neustadtl = neustadtlScore;
        p.tiebreakers.cumulative = calcCumulative(p);
        p.tiebreakers.oppCumulative = p.opponents.reduce((x, y) => x + calcCumulative(y));
        p.tiebreakers.matchWinPctM = calcMatchWin(p, 'magic');
        p.tiebreakers.matchWinPctP = calcMatchWin(p, 'pokemon');
        p.tiebreakers.gameWinPct = calcGameWin(p);
        p.tiebreakers.oppMatchWinPctM = p.opponents.reduce((x, y) => x + calcMatchWin(y, 'magic')) / p.opponents.length;
        p.tiebreakers.oppMatchWinPctP = p.opponents.reduce((x, y) => x + calcMatchWin(y, 'pokemon')) / p.opponents.length;
        p.tiebreakers.oppGameWinPct = p.opponents.reduce((x, y) => x + calcGameWin(y)) / p.opponents.length;
        let oppOppMatchSum = 0;
        p.opponents.forEach(opp => oppOppMatchSum += opp.opponents.reduce((x, y) => x + calcMatchWin(y, 'pokemon')) / opp.opponents.length);
        p.tiebreakers.oppOppMatchWinPct = oppOppMatchSum / p.opponents.length;
    },
    buchholzcut1: {
        equal: (a, b) => {
            
        },
        diff: (a, b) => {
            
        }
    },
    solkoff: {
        equal: (a, b) => {
            
        },
        diff: (a, b) => {
            
        }
    },
    medianbuchholz: {
        equal: (a, b) => {
            
        },
        diff: (a, b) => {
            
        }
    },
    sonnebornberger: {
        equal: (a, b) => {
            
        },
        diff: (a, b) => {
            
        }
    },
    baumbach: {
        equal: (a, b) => {
            
        },
        diff: (a, b) => {
            
        }
    },
    cumulative: {
        equal: (a, b) => {
            
        },
        diff: (a, b) => {
            
        }
    },
    versus: {
        equal: (a, b) => {
            
        },
        diff: (a, b) => {
            
        }
    },
    magictcg: {
        equal: (a, b) => {
            
        },
        diff: (a, b) => {
            
        }
    },
    pokemontcg: {
        equal: (a, b) => {
            
        },
        diff: (a, b) => {
            
        }
    }
};

module.exports = Tiebreakers;
