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
     * Compares two players to determine which player plays white and which plays black.
     * @param {Player} p1 One of the players.
     * @param {Player} p2 The other player.
     * @return {null|Player[]}
     */
    pairCompare: (p1, p2) => {
        if (p1.colorPref >= 1 || JSON.stringify([...p1.colors].splice(-2)) === '[w,w]') {
            if (p2.colorPref === 2 || JSON.stringify([...p2.colors].splice(-2)) === '[w,w]') return null;
            else return [p2, p1];
        } else if (p1.colorPref <= -1 || JSON.stringify([...p1.colors].splice(-2)) === '[b,b]') {
            if (p2.colorPref === -2 || JSON.stringify([...p2.colors].splice(-2)) === '[b,b]') return null;
            else return [p1, p2];
        } else {
            if (p2.colorPref > 0 || JSON.stringify([...p2.colors].splice(-2)) === '[w,w]') return [p1, p2];
            else if (p2.colorPref < 0 || JSON.stringify([...p2.colors].splice(-2)) === '[b,b]') return [p2, p1];
            else return Math.round(Math.random()) ? [p2, p1] : [p1, p2];
        }
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
        const mod = Math.log2(players.length);
        const rem = Math.round(2 ** mod) % (2 ** Math.floor(mod));
        const bracket = Algorithms.bracket(Math.floor(mod));
        let r = 1;
        // Create first round if not power of 2.
        if (rem !== 0) {
            rounds.push(new Pairings(r, 'elim', rem));
            r++;
        }
        let playerCount = Math.floor(mod) - 1;
        // Make all other rounds.
        do {
            rounds.push(new Pairings(r, 'elim', 2 ** playerCount));
            if (playerCount !== (Math.floor(mod) - 1)) rounds.find(p => p.round === r - 1).matches.forEach(m => m.winnerPath = rounds.find(p => p.round === r).matches.find(n => n.matchNumber === Math.ceil(m.matchNumber / 2)));
            r++ && playerCount--;
        } while (r <= Math.ceil(mod));
        // Assign players.
        rounds.find(r => r.round === 1 + (rem !== 0)).matches.forEach((m, i) => {
            m.playerOne = players[bracket[2 * i] - 1];
            m.playerTwo = players[bracket[2 * i + 1] - 1];
            m.active = true;
        });
        // Assign players to first round if not power of 2, and determine path.
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
        // Create third place consolation match.
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
        const mod = Math.log2(players.length);
        const rem = Math.round(2 ** mod) % (2 ** Math.floor(mod));
        const bracket = Algorithms.bracket(Math.floor(mod));
        let r = 1;
        // Make first round if not power of 2.
        if (rem !== 0) {
            rounds.push(new Pairings(r, '2xelim', rem));
            r++;
        }
        let playerCount = Math.floor(mod) - 1;
        // Make most rounds for winner's bracket.
        do {
            rounds.push(new Pairings(r, '2xelim', 2 ** playerCount));
            if (playerCount !== (Math.floor(mod) - 1)) rounds.find(p => p.round === r - 1).matches.forEach(m => m.winnerPath = rounds.find(p => p.round === r).matches.find(n => n.matchNumber === Math.ceil(m.matchNumber / 2)));
            r++ && playerCount--;
        } while (r <= Math.ceil(mod));
        // Assign players to first round, or second if not power of 2.
        rounds.find(r => r.round === 1 + (rem !== 0)).matches.forEach((m, i) => {
            m.playerOne = players[bracket[2 * i] - 1];
            m.playerTwo = players[bracket[2 * i + 1] - 1];
            m.active = true;
        });
        // Assign players to first round if not power of 2.
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
        // Create final winner bracket round (to play winner of loser's bracket).
        const lp = new Pairings(r, '2xelim', 1);
        rounds.push(lp);
        const nm = rounds.find(x => x.round === r - 1).matches[0];
        nm.winnerPath = lp.matches[0];
        r++;
        const diff = r - 1;
        // Create first loser's bracket rounds, depending on how close it is to a power of 2.
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
        // Create the remainder of the loser's bracket.
        let p = Math.floor(mod) - 2;
        do {
            rounds.push(new Pairings(r, '2xelim', 2 ** p));
            r++;
            rounds.push(new Pairings(r, '2xelim', 2 ** p));
            r++ && p--;
        } while (p > -1);
        let fillCount = 0;
        let winnerRound = 1;
        let loserRound = diff + 1;
        // Routing path from winner's bracket to loser's bracket for first round or two.
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
            const winnerRound2 = rounds.find(r => r.round === winnerRound);
            const loserRound2 = rounds.find(r => r.round === loserRound);
            const second = Algorithms.loserFill(winnerRound2.matches.length, fillCount);
            fillCount++;
            let d = 0;
            let e = 0;
            let lessCopy = [...less];
            loserRound2.matches.forEach(x => {
                const m = winnerRound2.matches.find(y => y.matchNumber === second[d]);
                if (lessCopy.includes(x.matchNumber)) {
                    m.loserPath = rounds.find(r => r.round === loserRound - 1).matches[e];
                    e++;
                    lessCopy.splice(lessCopy.indexOf(x.matchNumber), 1);
                } else m.loserPath = x;
                d++;
                const n = winnerRound2.matches.find(y => y.matchNumber === second[d]);
                if (lessCopy.includes(x.matchNumber)) {
                    n.loserPath = rounds.find(r => r.round === loserRound - 1).matches[e];
                    e++;
                    lessCopy.splice(lessCopy.indexOf(x.matchNumber), 1);
                } else n.loserPath = x;
                d++;
            });
            winnerRound++ && loserRound++;
        } else {
            const winnerRound1 = rounds.find(r => r.round === winnerRound);
            const loserRound1 = rounds.find(r => r.round === loserRound);
            loserRound++;
            const loserRound2 = rounds.find(r => r.round === loserRound);
            const first = Algorithms.loserFill(winnerRound1.matches.length, fillCount);
            fillCount++;
            let d = 0;
            let e = 0;
            loserRound2.matches.forEach(x => {
                const m = winnerRound1.matches.find(y => y.matchNumber === first[d]);
                if (great.includes(x.matchNumber)) {
                    const o = loserRound1.matches[e];
                    m.loserPath = o;
                    d++ && e++;
                    const n = winnerRound1.matches.find(y => y.matchNumber === first[d]);
                    n.loserPath = o;
                } else m.loserPath = x;
                d++;
            });
            winnerRound++;
        }
        // Route all remaining winner's bracket matches.
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
        if (rem !== 0) {
            if (rem <= 2 ** Math.floor(mod) / 2) {
                const n = rounds.find(r => r.round === diff + 1);
                n.matches.forEach((m, i) => {
                    m.winnerPath = rounds.find(r => r.round === n.round + 1).matches.find(z => z.matchNumber === less[i])
                });
            } else {
                const n = rounds.find(r => r.round === diff + 1);
                n.matches.forEach((m, i) => m.winnerPath = rounds.find(r => r.round === n.round + 1).matches.find(z => z.matchNumber === great[i]));
            }
        }
        // Route winners in loser's bracket.
        for (let i = diff + 1 + (rem !== 0); i < rounds.length; i++) {
            const n = rounds.find(r => r.round === i);
            const l = rounds.find(r => r.round === i + 1);
            if (n.matches.length === l.matches.length) n.matches.forEach((x, i) => x.winnerPath = l.matches[i]);
            else n.matches.forEach((x, i) => x.winnerPath = l.matches[Math.floor(i / 2)]);
        }
        // Connect the two brackets.
        const last = rounds.find(r => r.round === rounds.length).matches[0];
        last.winnerPath = rounds.find(r => r.round === diff).matches[0];
        return rounds;
    },
    /**
     * Swiss pairing algorithm.
     * @param {Player[]} players The active players to pair.
     * @param {Number} round The round number.
     * @param {Number} maxPoints The maximum number of match points a player could have.
     * @param {Boolean} sort If the players are to be sorted by seed.
     * @return {Pairings}
     */
    swiss: (players, round, maxPoints, sort) => {
        let hold = [];
        let matches = [];
        let success;
        const pairAttempt = p => {
            let matchNumber = 1;
            matches = [];
            do {
                // Get everyone with the current amount of points (maximum to start).
                let thesePlayers = players.filter(x => x.matchPoints === p);
                // If no one has the amount of points.
                if (thesePlayers.length === 0) {
                    // If we're at the end and someone is on hold, give them the bye.
                    if (p === 0 && hold.length > 0) {
                        if (hold.length > 1) return false;
                        matches.push(new Match(round, matchNumber, [hold[0], null]));
                        return true;
                    // Otherwise, move to next amount of points.
                    } else {
                        p = players.reduce((x, y) => y.matchPoints >= p ? x : Math.max(x, y.matchPoints), 0);
                        continue;
                    }
                }
                // Not sorting? Shuffle.
                if (!sort) Utilities.shuffle(thesePlayers);
                let l = 0;
                // If you have a player on hold and are sorting, sort.
                if (hold.length > 0 && sort) Utilities.seedSort(hold[0], thesePlayers);
                while (hold.length > 0) {
                    // If there's no one to pair the hold with, and we're at 0 points, give them the bye.
                    if (thesePlayers.length === 0 && p === 0) {
                        if (hold.length > 1) return false;
                        matches.push(new Match(round, matchNumber, [hold[0], null]));
                        return true;
                    }
                    // If the current player hasn't played the hold, pair them.
                    if (hold[0].opponents.findIndex(o => o.id === thesePlayers[l].id) === -1) {
                        const newMatch = new Match(round, matchNumber, [hold[0], thesePlayers[l]]);
                        newMatch.active = true;
                        matches.push(newMatch);
                        matchNumber++;
                        hold.splice(0, 1);
                        thesePlayers.splice(l, 1);
                        if (hold.length > 0 && sort) Utilities.seedSort(hold[0], thesePlayers);
                    // Otherwise, move on to next player.
                    } else l++;
                    // If we've gone through everyone, either give up or move on.
                    if (l === thesePlayers.length && l !== 0) {
                        if (p === 0) return false;
                        else break;
                    }
                }
                // Pairing people with the designated point amount.
                while (thesePlayers.length > 1) {
                    let i = 1;
                    // Sorting relative to the current player.
                    if (sort) {
                        const firstPlayer = thesePlayers.shift();
                        Utilities.seedSort(firstPlayer, thesePlayers);
                        thesePlayers.unshift(firstPlayer);
                    }
                    while (i < thesePlayers.length) {
                        // If the current player hasn't played the candidate, pair them.
                        if (thesePlayers[0].opponents.findIndex(o => o.id === thesePlayers[i].id) === -1) {
                            const newMatch = new Match(round, matchNumber, [thesePlayers[0], thesePlayers[i]]);
                            newMatch.active = true;
                            matches.push(newMatch);
                            matchNumber++;
                            thesePlayers.splice(i, 1);
                            thesePlayers.splice(0, 1);
                            break;
                        // Otherwise, move on to the next player.
                        } else i++;
                        // If we've gone through everyone, either give up or put them on hold.
                        if (i === thesePlayers.length) {
                            if (p === 0) return false;
                            else thesePlayers.forEach(p => hold.push(thesePlayers.shift()));
                        }
                    }
                }
                // With only one player left
                if (thesePlayers.length === 1) {
                    // At the end, give them a bye, otherwise, put them on hold.
                    if (p === 0) {
                        matches.push(new Match(round, matchNumber, [thesePlayers[0], null]));
                        return true;
                    } else hold.push(thesePlayers[0]);
                // No one left?
                } else if (thesePlayers.length === 0) {
                    // At the end, we're done, otherwise, next point value.
                    if (p === 0) return true;
                    else {
                        p = players.reduce((x, y) => y.matchPoints >= p ? x : Math.max(x, y.matchPoints), 0);
                        continue;
                    }
                } else return false;
                p = players.reduce((x, y) => y.matchPoints >= p ? x : Math.max(x, y.matchPoints), 0);
            } while (p >= 0);
        };
        do {
            success = pairAttempt(maxPoints);
        } while (success === false);
        const newPairings = new Pairings(round, 'swiss');
        newPairings.matches = matches;
        return newPairings;
    },
    /**
     * Dutch pairing algorithm.
     * @param {Player[]} players The active players to pair.
     * @param {Number} round The round number.
     * @param {Number} maxPoints The maximum number of match points a player could have.
     * @return {Pairings}
     */
    dutch: (players, round, maxPoints) => {
        let hold = [];
        let matches = [];
        let collapse = false;
        let success;
        const pairAttempt = p => {
            let matchNumber = 1;
            matches = [];
            do {
                // Get everyone with the current amount of points.
                let thesePlayers = players.filter(x => x.matchPoints === p);
                // If we're collapsing and this is the last nonzero point amount, get the 0-pointers, too.
                if (collapse && players.reduce((x, y) => y.matchPoints >= p ? x : Math.max(x, y.matchPoints), 0) === 0) thesePlayers = thesePlayers.concat(players.filter(x => x.matchPoints === 0));
                // If no one has the amount of points.
                if (thesePlayers.length === 0) {
                    // If we're at the end and someone is on hold, give them the bye.
                    if (p === 0 && hold.length > 0) {
                        if (hold.length > 1 || hold[0].byes === 1) return false;
                        matches.push(new Match(round, matchNumber, [hold[0], null]));
                        return true;
                    // Otherwise, move on to next amount of points.
                    } else {
                        p = players.reduce((x, y) => y.matchPoints >= p ? x : Math.max(x, y.matchPoints), 0);
                        continue;
                    }
                }
                // Sort everyone and combine them.
                if (hold.length > 1) hold.sort((a, b) => b.seed - a.seed);
                if (thesePlayers.length > 1) thesePlayers.sort((a, b) => b.seed - a.seed);
                let allPlayers = hold.concat(thesePlayers);
                // Reset holding space.
                hold = [];
                // Split group in half, with any odd person in lower half.
                const s1 = allPlayers.splice(0, Math.ceil(thesePlayers.length / 2));
                const s2 = allPlayers.splice(-Math.ceil(thesePlayers.length / 2));
                if (s1.length > s2.length) s2.unshift(s1.pop());
                // Pair people with the designated point amount.
                while (s1.length + s2.length > 1) {
                    // See if anyone has the perfect complement color preference.
                    const possPair = s2.find(p => p.colorPref === -s1[0].colorPref);
                    // Pair them.
                    if (possPair !== undefined) {
                        // Determines who is player 1 and who is player 2.
                        const order = Algorithms.pairCompare(s1[0], possPair);
                        if (order !== null) {
                            const newMatch = new Match(round, matchNumber, order);
                            newMatch.active = true;
                            matches.push(newMatch);
                            matchNumber++;
                            s1.splice(0, 1);
                            s2.splice(s2.findIndex(p => p.id === possPair.id), 1);
                            continue;
                        }
                    }
                    let i = 0;
                    // Find a compatible opponent.
                    while (i < s2.length) {
                        // Can't pair people with the same absolute color preference.
                        if (s1[0].opponents.findIndex(o => o.id === s2[i].id) > -1 || (s1[0].colorPref === 2 && s2[i].colorPref === 2) || (s1[0].colorPref === -2 && s2[i].colorPref === -2)) i++;
                        else {
                            // Determine if they can be paired, and who is player 1 and who is player 2.
                            const order = Algorithms.pairCompare(s1[0], s2[i]);
                            if (order === null) i++;
                            else {
                                const newMatch = new Match(round, matchNumber, order);
                                newMatch.active = true;
                                matches.push(newMatch);
                                matchNumber++;
                                s1.splice(0, 1);
                                s2.splice(i, 1);
                                break;
                            }
                        }
                        // If we've gone through everyone, either give up for put them on hold.
                        if (i === s2.length) {
                            if (p === 0) {
                                if (!collapse) collapse = true;
                                return false;
                            } else {
                                s1.forEach(p => hold.push(s1.shift()));
                                s2.forEach(p => hold.push(s2.shift()));
                            }
                        }
                    }
                }
                // If there's only one player left, either give them a bye or put them on hold.
                if (s1.length === 1) {
                    if (p === 0) {
                        if (s1[0].byes === 1) return false;
                        matches.push(new Match(round, matchNumber, [s1[0], null]));
                        return true;
                    } else hold.push(s1[0]);
                } else if (s2.length === 1) {
                    if (p === 0) {
                        if (s2[0].byes === 1) return false;
                        matches.push(new Match(round, matchNumber, [s2[0], null]));
                        return true;
                    } else hold.push(s2[0]);
                // If there's no one left, either we're done, or move to next point value.
                } else if (s1.length === 0 && s2.length === 0) {
                    if (p === 0) return true;
                    else {
                        p = players.reduce((x, y) => y.matchPoints >= p ? x : Math.max(x, y.matchPoints), 0);
                        continue;
                    }
                } else return false;
                p = players.reduce((x, y) => y.matchPoints >= p ? x : Math.max(x, y.matchPoints), 0);
            } while (p >= 0);
        };
        do {
            success = pairAttempt(maxPoints);
        } while (success === false);
        matches.forEach(m => {
            if (m.playerTwo !== null) {
                m.playerOne.colorPref++;
                m.playerOne.colors.push('w');
                m.playerTwo.colorPref--;
                m.playerTwo.colors.push('b');
            }
        });
        const newPairings = new Pairings(round, 'dutch');
        newPairings.matches = matches;
        return newPairings;
    },
    /**
     * Round-robin algorithm (Berger tables).
     * @param {Player[]|Array.Player[]} players An array of players, or an array of arrays of players.
     * @param {Boolean} groups If players represents an array of arrays of players or not.
     * @param {Boolean} double If players play each other once or twice.
     * @return {Pairings[]}
     */
    robin: (players, groups, double) => {
        let rounds = [];
        // If we're pairing by groups.
        if (groups) {
            // Loop once or twice, depending on double.
            for (let i = 0; i < 1 + double; i++) {
                // Loop through groups.
                players.forEach((g, j) => {
                    // Getting the starting round number.
                    let r = (g.length - 1) * i + 1;
                    // Adding a bye player for odd numbers.
                    if (g.length % 2 === 1) g.push(null);
                    // Fast-forward constant for subsequent groups.
                    const ffw = g.length * j / 2;
                    // Pair for each round.
                    for (let k = 0; k < g.length - 1; k++) {
                        // If this is the first group, create pairings, otherwise get existing pairings.
                        const newPairings = j === 0 ? new Pairings(r, 'robin', players.length * (g.length / 2)) : rounds.find(p => p.round === r);
                        // Round 1 pairing method.
                        if (k === 0) {
                            for (let x = 0; x < g.length / 2; x++) {
                                const m = newPairings.matches[ffw + x];
                                m.playerOne = g[x];
                                m.playerTwo = g[g.length - x - 1];
                                if (m.playerOne !== null && m.playerTwo !== null) m.active = true;
                            }
                        // Subsequent round pairing method (Berger tables).
                        } else {
                            // Need previous round.
                            const oldPairings = rounds.find(p => p.round === r - 1);
                            // Loop through each match.
                            for (let l = 0; l < g.length / 2; l++) {
                                const m = newPairings.matches[ffw + l];
                                // First match may contain bye, since the bye would be the last player in the group.
                                if (l === 0) {
                                    if (oldPairings.matches[ffw + l].playerTwo === g[g.length - 1] || oldPairings.matches[l].playerTwo === null) {
                                        m.playerOne = g[g.length - 1];
                                        let i1 = g.findIndex(p => p.id === oldPairings.matches[ffw + l].playerOne.id);
                                        i1 = i1 + (g.length / 2) > g.length - 2 ? i1 - (g.length / 2) + 1 : i1 + (g.length / 2);
                                        m.playerTwo = g[i1];
                                    } else {
                                        m.playerTwo = g[g.length - 1];
                                        let i1 = g.findIndex(p => p.id === oldPairings.matches[ffw + l].playerTwo.id);
                                        i1 = i1 + (g.length / 2) > g.length - 2 ? i1 - (g.length / 2) + 1 : i1 + (g.length / 2);
                                        m.playerOne = g[i1];
                                    }
                                // Pairing all other matches.
                                } else {
                                    const oldMatch = oldPairings.matches[ffw + l];
                                    let i1 = g.findIndex(p => p.id === oldMatch.playerOne.id);
                                    i1 = i1 + (g.length / 2) > g.length - 2 ? i1 - (g.length / 2) + 1 : i1 + (g.length / 2);
                                    m.playerOne = g[i1];
                                    let i2 = g.findIndex(p => p.id === oldMatch.playerTwo.id);
                                    i2 = i2 + (g.length / 2) > g.length - 2 ? i2 - (g.length / 2) + 1 : i2 + (g.length / 2);
                                    m.playerTwo = g[i2];
                                }
                            }
                        }
                        r++;
                        if (j === 0) rounds.push(newPairings);
                    }
                });
            }
        // Not by groups.
        } else {
            let r = 1;
            // Loop once or twice, depending on double.
            for (let i = 0; i < 1 + double; i++) {
                // Adding a bye player for odd numbers.
                const thesePlayers = players.length % 2 === 1 ? players.concat([null]) : [...players];
                // Pair for each round.
                for (let j = 0; j < thesePlayers.length - 1; j++) {
                    const newPairings = new Pairings(r, 'robin', thesePlayers.length / 2);
                    // Round 1 pairing method.
                    if (j === 0) {
                        newPairings.matches.forEach((m, k) => {
                            m.playerOne = thesePlayers[k];
                            m.playerTwo = thesePlayers[thesePlayers.length - k - 1];
                            if (m.playerOne !== null && m.playerTwo !== null) m.active = true;
                        });
                    // Subsequent round pairing method (Berger tables).
                    } else {
                        // Need previous round.
                        const oldPairings = rounds.find(p => p.round === r - 1);
                        // Loop through each match.
                        newPairings.matches.forEach((m, k) => {
                            // First match may contain bye, since the bye would be the last player in the group.
                            if (k === 0) {
                                if (oldPairings.matches[0].playerTwo === thesePlayers[thesePlayers.length - 1] || oldPairings.matches[0].playerTwo === null) {
                                    m.playerOne = thesePlayers[thesePlayers.length - 1];
                                    let i1 = thesePlayers.findIndex(p => p.id === oldPairings.matches[0].playerOne.id);
                                    i1 = i1 + (thesePlayers.length / 2) > thesePlayers.length - 2 ? i1 - (thesePlayers.length / 2) + 1 : i1 + (thesePlayers.length / 2);
                                    m.playerTwo = thesePlayers[i1];
                                } else {
                                    m.playerTwo = thesePlayers[thesePlayers.length - 1];
                                    let i1 = thesePlayers.findIndex(p => p.id === oldPairings.matches[0].playerTwo.id);
                                    i1 = i1 + (thesePlayers.length / 2) > thesePlayers.length - 2 ? i1 - (thesePlayers.length / 2) + 1 : i1 + (thesePlayers.length / 2);
                                    m.playerOne = thesePlayers[i1];
                                }
                            // Pairing all other matches.
                            } else {
                                const oldMatch = oldPairings.matches[k];
                                let i1 = thesePlayers.findIndex(p => p.id === oldMatch.playerOne.id);
                                i1 = i1 + (thesePlayers.length / 2) > thesePlayers.length - 2 ? i1 - (thesePlayers.length / 2) + 1 : i1 + (thesePlayers.length / 2);
                                m.playerOne = thesePlayers[i1];
                                let i2 = thesePlayers.findIndex(p => p.id === oldMatch.playerTwo.id);
                                i2 = i2 + (thesePlayers.length / 2) > thesePlayers.length - 2 ? i2 - (thesePlayers.length / 2) + 1 : i2 + (thesePlayers.length / 2);
                                m.playerTwo = thesePlayers[i2];
                            }
                        });
                    }
                    r++;
                    rounds.push(newPairings);
                }
            }
        }
        return rounds;
    }
};

module.exports = Algorithms;