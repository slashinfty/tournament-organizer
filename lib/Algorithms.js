'use strict';

const Match = require("../src/Match");
const Pairings = require("../src/Pairings");
const Utilities = require("./Utilities");

/**
 * Pairing algorithms.
 * @namespace
 */
const Algorithms = {
    /**
     * Determines seeding for elimination brackets.
     * @param {Number} power Power of 2 for determining number of matches in first round.
     * @return {Number[]}
     */
    bracket: power => {
        const a = [1, 4, 2, 3];
        for (let i = 3; i <= power; i++) {
            for (let j = 0; j < a.length; j += 2) a.splice(j + 1, 0, 2 ** i + 1 - a[j]);
        }
        return a;
    },
    /**
     * Determines the order in which to fill the loser's bracket for double elimination.
     * @param {Number} num The amount of matches.
     * @param {Number} count How many times (starting at 0) the bracket has been filled.
     * @return {Number[]}
     */
    loserFill: (num, count) => {
        const a = Array.from({length: num}, (_, i) => i + 1);
        const m = count % 4;
        const x = a.slice(0, a.length / 2);
        const y = a.slice(a.length / 2);
        switch (m) {
            case 0:
                return a;
            case 1:
                return a.reverse();
            case 2:
                return x.reverse().concat(y.reverse());
            case 3:
                return y.concat(x);
        }
    },
    /**
     * Single elimination bracket generation.
     * @param {Player[]} players The players for the tournament.
     * @param {Boolean} thirdPlace If there is a third place consolation match.
     * @return {Pairings[]}
     */
    elim: (players, thirdPlace) => {
        const rounds = [];
        const mod = Math.log(players.length) / Math.log(2);
        const rem = Math.round(2 ** mod) % (2 ** Math.floor(mod));
        const bracket = Algorithms.bracket(Math.floor(mod));
        let r = 1;
        if (rem !== 0) {
            rounds.push(new Pairings(r, 'elim', rem));
            r++;
        }
        let playerCount = Math.floor(mod) - 1;
        do {
            rounds.push(new Pairings(r, 'elim', 2 ** playerCount));
            if (playerCount !== (Math.floor(mod) - 1)) rounds.find(p => p.round === r - 1).matches.forEach(m => m.winnerPath = rounds.find(p => p.round === r).matches.find(n => n.matchNumber === Math.ceil(m.matchNumber / 2)));
            r++ && playerCount--;
        } while (r <= Math.ceil(mod));
        rounds.find(r => r.round === 1 + (rem !== 0)).matches.forEach((m, i) => {
            m.playerOne = players[bracket[2 * i] - 1];
            m.playerTwo = players[bracket[2 * i + 1] - 1];
            m.active = true;
        });
        if (rem !== 0) {
            const winnerRound1 = rounds.find(p => p.round === 1);
            winnerRound1.matches.forEach((m, i) => {
                m.playerOne = players[2 ** Math.floor(mod) + i];
                const playerTwo = players[2 ** Math.floor(mod) - i - 1];
                const n = rounds.find(p => p.round === 2).matches.find(m => (m.playerOne !== null && m.playerOne.id === playerTwo.id) || (m.playerTwo !== null && m.playerTwo.id === playerTwo.id));
                if (n.playerOne.id === playerTwo.id) n.playerOne = null;
                else if (n.playerTwo.id === playerTwo.id) n.playerTwo = null;
                m.playerTwo = playerTwo;
                m.winnerPath = n;
                n.active = false;
                m.active = true;
            });
        }
        if (thirdPlace) {
            const lastRound = rounds.find(r => r.round === rounds.length);
            const newMatch = new Match(lastRound.round, lastRound.matches.length + 1);
            lastRound.matches.push(newMatch);
            rounds.find(r => r.round === rounds.length - 1).matches.forEach(m => m.loserPath = newMatch);
        }
        return rounds;
    },
    /**
     * Double elimination bracket generation.
     * @param {Player[]} players The players for the tournament.
     * @return {Pairings[]}
     */
    doubleElim: players => {
        const rounds = [];
        const mod = Math.log(players.length) / Math.log(2);
        const rem = Math.round(2 ** mod) % (2 ** Math.floor(mod));
        const bracket = Algorithms.bracket(Math.floor(mod));
        let r = 1;
        if (rem !== 0) {
            rounds.push(new Pairings(r, '2xelim', rem));
            r++;
        }
        let playerCount = Math.floor(mod) - 1;
        do {
            rounds.push(new Pairings(r, '2xelim', 2 ** playerCount));
            if (playerCount !== (Math.floor(mod) - 1)) rounds.find(p => p.round === r - 1).matches.forEach(m => m.winnerPath = rounds.find(p => p.round === r).matches.find(n => n.matchNumber === Math.ceil(m.matchNumber / 2)));
            r++ && playerCount--;
        } while (r <= Math.ceil(mod));
        rounds.find(r => r.round === 1 + (rem !== 0)).matches.forEach((m, i) => {
            m.playerOne = players[bracket[2 * i] - 1];
            m.playerTwo = players[bracket[2 * i + 1] - 1];
            m.active = true;
        });
        if (rem !== 0) {
            const r1 = rounds.find(p => p.round === 1);
            const r2 = rounds.find(p => p.round === 2);
            let i =0;
            let j = 0;
            r2.matches.forEach(x => {
                if (bracket[i] > 2 ** Math.floor(mod) - rem) {
                    const y = r1.matches[j];
                    y.active = true;
                    x.active = false;
                    y.playerOne = x.playerOne;
                    x.playerOne = null;
                    y.playerTwo = players[2 ** (Math.floor(mod) + 1) - bracket[i]];
                    y.winnerPath = x;
                    j++;
                }
                i++;
                if (bracket[i] > 2 ** Math.floor(mod) - rem) {
                    const y = r1.matches[j];
                    y.active = true;
                    x.active = false;
                    y.playerOne = x.playerTwo;
                    x.playerTwo = null;
                    y.playerTwo = players[2 ** (Math.floor(mod) + 1) - bracket[i]];
                    y.winnerPath = x;
                    j++;
                }
                i++;
            });
        }
        const less = rounds.find(p => p.round === 2).matches.filter(m => m.playerOne === null || m.playerTwo === null).map(m => Math.ceil(m.matchNumber / 2));
        const great = rounds.find(p => p.round === 2).matches.filter(m => m.playerOne === null && m.playerTwo === null).map(m => m.matchNumber);
        for (let i = 0; i < 2; i++) {
            const p = new Pairings(r, '2xelim', 1);
            rounds.push(p);
            const m = rounds.find(x => x.round === r - 1).matches[0];
            m.winnerPath = p.matches[0];
            if (i === 1) m.loserPath = p.matches[0];
            r++;
        }
        const diff = r - 1;
        if (rem !== 0) {
            if (rem <= 2 ** Math.floor(mod) / 2) {
                rounds.push(new Pairings(r, '2xelim', rem));
                r++;
            } else {
                rounds.push(new Pairings(r, '2xelim', rem - 2 ** (Math.floor(mod) - 1)))
                r++;
                rounds.push(new Pairings(r, '2xelim', 2 ** (Math.floor(mod) - 1)));
                r++;
            }
        }
        let p = Math.floor(mod) - 2;
        do {
            rounds.push(new Pairings(r, '2xelim', 2 ** p));
            r++;
            rounds.push(new Pairings(r, '2xelim', 2 ** p));
            r++ && p--;
        } while (p > -1);
        let fillCount = 0;
        let winnerRound = 1;
        let loserRound = diff;
        if (rem === 0) {
            const winnerRound1 = rounds.find(r => r.round === winnerRound);
            const loserRound1 = rounds.find(r => r.round === loserRound);
            const first = Algorithms.loserFill(winnerRound1.matches.length, fillCount);
            fillCount++;
            let d = 0;
            loserRound1.matches.forEach(x => {
                const m = winnerRound1.matches.find(y => y.matchNumber === first[d]);
                m.loserPath = x;
                d++;
                const n = winnerRound1.matches.find(y => y.matchNumber === first[d]);
                n.loserPath = x;
                d++;
            });
            winnerRound++ && loserRound++;
        } else if (rem <= 2 ** Math.floor(mod) / 2) {
            const winnerRound1 = rounds.find(r => r.round === winnerRound);
            const loserRound1 = rounds.find(r => r.round === loserRound);
            const first = Algorithms.loserFill(winnerRound1.matches.length, fillCount);
            fillCount++;
            loserRound1.matches.forEach((x, i) => {
                const m = winnerRound1.matches.find(y => y.matchNumber === first[i]);
                m.loserPath = x;
            });
            winnerRound++ && loserRound++;
            const wr2 = rounds.find(r => r.round === winnerRound);
            const loserRound2 = rounds.find(r => r.round === loserRound);
            const second = Algorithms.loserFill(wr2.matches.length, fillCount);
            fillCount++;
            let d = 0;
            loserRound2.matches.forEach(x => {
                const m = wr2.matches.find(y => y.matchNumber === second[d]);
                if (less.includes(x.matchNumber)) {
                    m.loserPath = rounds.find(r => r.round === loserRound - 1).matches.find(y => y.playerOne === null || y.playerTwo === null);
                    less.splice(less.indexOf(x.matchNumber));
                } else m.loserPath = x;
                d++;
                const n = wr2.matches.find(y => y.matchNumber === second[d]);
                if (less.includes(x.matchNumber)) {
                    n.loserPath = rounds.find(r => r.round === loserRound - 1).matches.find(y => y.playerOne === null || y.playerTwo === null);
                    less.splice(less.indexOf(x.matchNumber));
                } else m.loserPath = x;
                d++;
            });
            winnerRound++ && loserRound++;
        } else {
            loserRound++;
            const winnerRound1 = rounds.find(r => r.round === winnerRound);
            const loserRound2 = rounds.find(r => r.round === loserRound);
            const first = Algorithms.loserFill(winnerRound1.matches.length, fillCount);
            fillCount++;
            let d = 0;
            let e = 0;
            loserRound2.matches.forEach(x => {
                const m = winnerRound1.matches.find(y => y.matchNumber === first[d]);
                if (great.includes(x.matchNumber)) {
                    const o = rounds.find(r => r.round === loserRound - 1).matches[e];
                    m.loserPath = o;
                    d++ && e++;
                    const n = winnerRound1.matches.find(y => y.matchNumber === first[d]);
                    n.loserPath = o;
                } else m.loserPath = x;
                d++;
            });
            winnerRound++;
        }
        let z = 0;
        for (let i = winnerRound; i < diff - 1; i++) {
            const w = rounds.find(r => r.round === i);
            const l = rounds.find(r => r.round === loserRound + z);
            const fill = Algorithms.loserFill(w.matches.length, fillCount);
            fillCount++;
            l.matches.forEach((x, i) => {
                const m = w.matches.find(y => y.matchNumber === fill[i]);
                m.loserPath = x;
            });
            loserRound++ && z++;
        }
        for (let i = diff + 1; i < rounds.length; i++) {
            const n = rounds.find(r => r.round === i);
            const l = rounds.find(r => r.round === i + 1);
            if (n.matches.length === l.matches.length) n.matches.forEach((x, i) => x.winnerPath = l.matches[i]);
            else n.matches.forEach((x, i) => x.winnerPath = l.matches[Math.floor(i / 2)]);
        }
        const last = rounds.find(r => r.round === rounds.length).matches[0];
        last.winnerPath = rounds.find(r => r.round === diff - 1).matches[0];
        return rounds;
    },
    /**
     * Swiss pairing algorithm.
     */
    swiss: () => {

    },
    /**
     * Round-robin algorithm (Berger tables).
     */
    robin: () => {
        
    }
};

module.exports = Algorithms;