'use strict';

const Match = require("../src/Match");
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
     * Creates blank matches.
     * @param {Match[]} array Array of matches.
     * @param {Number} count Number of matches to create.
     * @param {Number} round Round number.
     */
    blankMatches: (array, count, round) => {
        for (let i = 0; i < count; i++) {
            let mid;
            do {
                mid = Utilities.randomString(12);
            } while (array.findIndex(m => m.id === mid) > -1);
            array.push(new Match(mid, round, i + 1));
        }
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
     * @param {Match[]} matches The matches for the tournament.
     * @param {Player[]} players The players for the tournament.
     * @param {Boolean} thirdPlace If there is a third place consolation match.
     */
    elim: (matches, players, thirdPlace, startRound = 1) => {
        const mod = Math.log2(players.length);
        const rem = Math.round(2 ** mod) % (2 ** Math.floor(mod));
        const bracket = Algorithms.bracket(Math.floor(mod));
        let r = startRound;
        // Create first round if not power of 2.
        if (rem !== 0) {
            Algorithms.blankMatches(matches, rem, r);
            r++;
        }
        let playerCount = Math.floor(mod) - 1;
        // Make all other rounds.
        do {
            Algorithms.blankMatches(matches, 2 ** playerCount, r);
            if (playerCount !== (Math.floor(mod) - 1)) matches.filter(m => m.round === r - 1).forEach(m => m.winnerPath = matches.filter(p => p.round === r).find(n => n.matchNumber === Math.ceil(m.matchNumber / 2)));
            r++ && playerCount--;
        } while (r < startRound + Math.ceil(mod));
        // Assign players.
        matches.filter(r => r.round === startRound + (rem !== 0)).forEach((m, i) => {
            m.playerOne = players[bracket[2 * i] - 1];
            m.playerTwo = players[bracket[2 * i + 1] - 1];
            m.active = true;
        });
        // Assign players to first round if not power of 2, and determine path.
        if (rem !== 0) {
            const winnerRound1 = matches.filter(p => p.round === startRound);
            winnerRound1.forEach((m, i) => {
                m.playerOne = players[2 ** Math.floor(mod) + i];
                const playerTwo = players[2 ** Math.floor(mod) - i - 1];
                const n = matches.filter(p => p.round === startRound + 1).find(m => (m.playerOne !== null && m.playerOne.id === playerTwo.id) || (m.playerTwo !== null && m.playerTwo.id === playerTwo.id));
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
            const lastRound = matches.reduce((x, y) => Math.max(x, y.round), 0);
            const lastMatch = matches.filter(m => m.round === lastRound).reduce((x, y) => Math.max(x, y.matchNumber), 0);
            let newId;
            do {
                newId = Utilities.randomString(12);
            } while (matches.findIndex(m => m.id === newId) > -1);
            const newMatch = new Match(newId, lastRound, lastMatch + 1);
            matches.push(newMatch);
            matches.filter(r => r.round === lastRound - 1).forEach(m => m.loserPath = newMatch);
        }
    },
    /**
     * Double elimination bracket generation.
     * @param {Match[]} matches The matches for the tournament.
     * @param {Player[]} players The players for the tournament.
     */
    doubleElim: (matches, players, startRound = 1) => {
        const mod = Math.log2(players.length);
        const rem = Math.round(2 ** mod) % (2 ** Math.floor(mod));
        const bracket = Algorithms.bracket(Math.floor(mod));
        let r = startRound;
        // Make first round if not power of 2.
        if (rem !== 0) {
            Algorithms.blankMatches(matches, rem, r);
            r++;
        }
        let playerCount = Math.floor(mod) - 1;
        // Make most rounds for winner's bracket.
        do {
            Algorithms.blankMatches(matches, 2 ** playerCount, r);
            if (playerCount !== (Math.floor(mod) - 1)) matches.filter(m => m.round === r - 1).forEach(m => m.winnerPath = matches.filter(p => p.round === r).find(n => n.matchNumber === Math.ceil(m.matchNumber / 2)));
            r++ && playerCount--;
        } while (r < startRound + Math.ceil(mod));
        // Assign players to first round, or second if not power of 2.
        matches.filter(r => r.round === startRound + (rem !== 0)).forEach((m, i) => {
            m.playerOne = players[bracket[2 * i] - 1];
            m.playerTwo = players[bracket[2 * i + 1] - 1];
            m.active = true;
        });
        // Assign players to first round if not power of 2.
        if (rem !== 0) {
            const r1 = matches.filter(p => p.round === startRound);
            const r2 = matches.filter(p => p.round === startRound + 1);
            let i = 0;
            let j = 0;
            r2.forEach(x => {
                for (let z = 0; z < 2; z++) {
                    if (bracket[i] > 2 ** Math.floor(mod) - rem) {
                        const y = r1[j];
                        y.active = true;
                        x.active = false;
                        y.playerOne = x.playerOne;
                        x.playerOne = null;
                        y.playerTwo = players[2 ** (Math.floor(mod) + 1) - bracket[i]];
                        y.winnerPath = x;
                        j++;
                    }
                    i++;
                }
            });
        }
        const less = matches.filter(m => m.round === startRound + 1 && (m.playerOne === null || m.playerTwo === null)).map(m => Math.ceil(m.matchNumber / 2));
        const great = matches.filter(m => m.round === startRound + 1 && m.playerOne === null && m.playerTwo === null).map(m => m.matchNumber);
        // Create final winner bracket round (to play winner of loser's bracket).
        Algorithms.blankMatches(matches, 1, r);
        const nm = matches.find(m => m.round === r - 1);
        nm.winnerPath = matches.find(m => m.round === r);
        r++;
        const diff = r - 1;
        // Create first loser's bracket rounds, depending on how close it is to a power of 2.
        if (rem !== 0) {
            if (rem <= 2 ** Math.floor(mod) / 2) {
                Algorithms.blankMatches(matches, rem, r);
                r++;
            } else {
                Algorithms.blankMatches(matches, rem - 2 ** (Math.floor(mod) - 1), r);
                r++;
                Algorithms.blankMatches(matches, 2 ** (Math.floor(mod) - 1), r);
                r++;
            }
        }
        // Create the remainder of the loser's bracket.
        let p = Math.floor(mod) - 2;
        do {
            for (let z = 0; z < 2; z++) {
                Algorithms.blankMatches(matches, 2 ** p, r);
                r++;
            }
            p--;
        } while (p > -1);
        let fillCount = 0;
        let winnerRound = startRound;
        let loserRound = diff + 1;
        // Routing path from winner's bracket to loser's bracket for first round or two.
        if (rem === 0) {
            const winnerRound1 = matches.filter(r => r.round === winnerRound);
            const loserRound1 = matches.filter(r => r.round === loserRound);
            const first = Algorithms.loserFill(winnerRound1.length, fillCount);
            fillCount++;
            let d = 0;
            loserRound1.forEach(x => {
                for (let z = 0; z < 2; z++) {
                    const m = winnerRound1.find(y => y.matchNumber === first[d]);
                    m.loserPath = x;
                    d++;
                }
            });
            winnerRound++ && loserRound++;
        } else if (rem <= 2 ** Math.floor(mod) / 2) {
            const winnerRound1 = matches.filter(r => r.round === winnerRound);
            const loserRound1 = matches.filter(r => r.round === loserRound);
            const first = Algorithms.loserFill(winnerRound1.length, fillCount);
            fillCount++;
            loserRound1.forEach((x, i) => {
                const m = winnerRound1.find(y => y.matchNumber === first[i]);
                m.loserPath = x;
            });
            winnerRound++ && loserRound++;
            const winnerRound2 = matches.filter(r => r.round === winnerRound);
            const loserRound2 = matches.filter(r => r.round === loserRound);
            const second = Algorithms.loserFill(winnerRound2.length, fillCount);
            fillCount++;
            let d = 0;
            let e = 0;
            let lessCopy = [...less];
            loserRound2.forEach(x => {
                for (let z = 0; z < 2; z++) {
                    const m = winnerRound2.find(y => y.matchNumber === second[d]);
                    if (lessCopy.includes(x.matchNumber)) {
                        m.loserPath = matches.filter(r => r.round === loserRound - 1)[e];
                        e++;
                        lessCopy.splice(lessCopy.indexOf(x.matchNumber), 1);
                    } else m.loserPath = x;
                    d++;
                }
            });
            winnerRound++ && loserRound++;
        } else {
            const winnerRound1 = matches.filter(r => r.round === winnerRound);
            const loserRound1 = matches.filter(r => r.round === loserRound);
            loserRound++;
            const loserRound2 = matches.filter(r => r.round === loserRound);
            const first = Algorithms.loserFill(winnerRound1.length, fillCount);
            fillCount++;
            let d = 0;
            let e = 0;
            loserRound2.forEach(x => {
                const m = winnerRound1.find(y => y.matchNumber === first[d]);
                if (great.includes(x.matchNumber)) {
                    const o = loserRound1[e];
                    m.loserPath = o;
                    d++ && e++;
                    const n = winnerRound1.find(y => y.matchNumber === first[d]);
                    n.loserPath = o;
                } else m.loserPath = x;
                d++;
            });
            winnerRound++;
        }
        // Route all remaining winner's bracket matches.
        let z = 0;
        for (let i = winnerRound; i < diff; i++) {
            const w = matches.filter(r => r.round === i);
            const l = matches.filter(r => r.round === loserRound + z);
            const fill = Algorithms.loserFill(w.length, fillCount);
            fillCount++;
            l.forEach((x, i) => {
                const m = w.find(y => y.matchNumber === fill[i]);
                m.loserPath = x;
            });
            loserRound++ && z++;
        }
        if (rem !== 0) {
            if (rem <= 2 ** Math.floor(mod) / 2) {
                const n = matches.filter(r => r.round === diff + 1);
                n.forEach((m, i) => {
                    m.winnerPath = matches.filter(r => r.round === m.round + 1).find(z => z.matchNumber === less[i])
                });
            } else {
                const n = matches.filter(r => r.round === diff + 1);
                n.forEach((m, i) => m.winnerPath = matches.filter(r => r.round === m.round + 1).find(z => z.matchNumber === great[i]));
            }
        }
        // Route winners in loser's bracket.
        for (let i = diff + 1 + (rem !== 0); i < matches.reduce((x, y) => Math.max(x, y.round), 0); i++) {
            const n = matches.filter(r => r.round === i);
            const l = matches.filter(r => r.round === i + 1);
            if (n.length === l.length) n.forEach((x, i) => x.winnerPath = l[i]);
            else n.forEach((x, i) => x.winnerPath = l[Math.floor(i / 2)]);
        }
        // Connect the two brackets.
        const last = matches.filter(r => r.round === matches.reduce((x, y) => Math.max(x, y.round), 0))[0];
        last.winnerPath = matches.filter(r => r.round === diff)[0];
    },
    /**
     * Swiss pairing algorithm.
     * @param {Match[]} matches The matches for the tournament.
     * @param {Player[]} players The active players to pair.
     * @param {Number} round The round number.
     * @param {Number} maxPoints The maximum number of match points a player could have.
     * @param {?String} sort Order of sorting players. Null is not sorting.
     * @return {Match[]}
     */
    swiss: (matches, players, round, maxPoints, sort) => {
        let hold = [];
        let newMatches = [];
        let loopCheck = 0;
        let success;
        const pairAttempt = (p, u) => {
            let matchNumber = 1;
            newMatches = [];
            do {
                // Get everyone with the current amount of points (maximum to start).
                let thesePlayers = u.filter(x => x.matchPoints === p);
                // If no one has the amount of points.
                if (thesePlayers.length === 0) {
                    // If we're at the end and someone is on hold, give them the bye.
                    if (p === 0 && hold.length > 0) {
                        if (hold.length > 1) return false;
                        let newId;
                        do {
                            newId = Utilities.randomString(12);
                        } while (matches.findIndex(m => m.id === newId) > -1 || newMatches.findIndex(m => m.id === newId) > -1);
                        newMatches.push(new Match(newId, round, 0, [hold[0], null]));
                        return true;
                    // Otherwise, move to next amount of points.
                    } else {
                        p = u.reduce((x, y) => y.matchPoints >= p ? x : Math.max(x, y.matchPoints), 0);
                        continue;
                    }
                }
                // Either sort or shuffle.
                if (typeof sort === 'string') Utilities.seedSort(thesePlayers, sort);
                else Utilities.shuffle(thesePlayers);
                // Putting players who have received byes at the top to more likely pair them.
                // Yes, it is rare that someone may receive the bye twice, but this is better than a loop failing.
                if (u.filter(x => x.matchPoints < p).length === 0) {
                    const receivedByes = thesePlayers.filter(player => player.byes > 0);
                    receivedByes.forEach(player => thesePlayers.splice(thesePlayers.findIndex(x => x.id === player.id), 1));
                    receivedByes.forEach(player => thesePlayers.unshift(player));
                }
                let l = 0;
                while (hold.length > 0) {
                    // If there's no one to pair the hold with, and we're at 0 points, give them the bye.
                    if (thesePlayers.length === 0 && p === 0) {
                        if (hold.length > 1) return false;
                        let newId;
                        do {
                            newId = Utilities.randomString(12);
                        } while (matches.findIndex(m => m.id === newId) > -1 || newMatches.findIndex(m => m.id === newId) > -1);
                        newMatches.push(new Match(newId, round, 0, [hold[0], null]));
                        return true;
                    }
                    // If the current player hasn't played the hold, pair them.
                    if (hold[0].results.findIndex(o => o.opponent === thesePlayers[l].id) === -1) {
                        let newId;
                        do {
                            newId = Utilities.randomString(12);
                        } while (matches.findIndex(m => m.id === newId) > -1 || newMatches.findIndex(m => m.id === newId) > -1);
                        const newMatch = new Match(newId, round, matchNumber, [hold[0], thesePlayers[l]]);
                        newMatch.active = true;
                        newMatches.push(newMatch);
                        matchNumber++;
                        hold.splice(0, 1);
                        thesePlayers.splice(l, 1);
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
                    while (i < thesePlayers.length) {
                        // If the current player hasn't played the candidate, pair them.
                        if (thesePlayers[0].results.findIndex(o => o.opponent === thesePlayers[i].id) === -1) {
                            let newId;
                            do {
                                newId = Utilities.randomString(12);
                            } while (matches.findIndex(m => m.id === newId) > -1 || newMatches.findIndex(m => m.id === newId) > -1);
                            const newMatch = new Match(newId, round, matchNumber, [thesePlayers[0], thesePlayers[i]]);
                            newMatch.active = true;
                            newMatches.push(newMatch);
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
                        let newId;
                        do {
                            newId = Utilities.randomString(12);
                        } while (matches.findIndex(m => m.id === newId) > -1 || newMatches.findIndex(m => m.id === newId) > -1);
                        newMatches.push(new Match(newId, round, 0, [thesePlayers[0], null]));
                        return true;
                    } else hold.push(thesePlayers[0]);
                // No one left?
                } else if (thesePlayers.length === 0) {
                    // At the end, we're done, otherwise, next point value.
                    if (p === 0) return true;
                    else {
                        p = u.reduce((x, y) => y.matchPoints >= p ? x : Math.max(x, y.matchPoints), 0);
                        continue;
                    }
                } else return false;
                p = u.reduce((x, y) => y.matchPoints >= p ? x : Math.max(x, y.matchPoints), 0);
            } while (p >= 0);
        };
        do {
            let byePlayers = players.filter(p => p.initialByes >= round);
            let playersToPair = [...players];
            let initialByes = [];
            if (byePlayers.length > 0) {
                byePlayers.forEach(player => {
                    let newId;
                    do {
                        newId = Utilities.randomString(12);
                    } while (matches.findIndex(m => m.id === newId) > -1 || newMatches.findIndex(m => m.id === newId) > -1);
                    initialByes.push(new Match(newId, round, 0, [player, null]));
                    playersToPair.splice(playersToPair.indexOf(player), 1);
                });
            }
            success = pairAttempt(maxPoints, playersToPair);
            loopCheck++;
            if (loopCheck === 10) return [];
            newMatches.push(...initialByes);
        } while (success === false);
        return newMatches;
    },
    /**
     * Dutch pairing algorithm.
     * @param {Match[]} matches The matches for the tournament.
     * @param {Player[]} players The active players to pair.
     * @param {Number} round The round number.
     * @param {Number} maxPoints The maximum number of match points a player could have.
     * @return {Match[]}
     */
    dutch: (matches, players, round, maxPoints) => {
        let hold = [];
        let newMatches = [];
        let collapse = false;
        let loopCheck = 0;
        let success;
        const pairAttempt = (p, u) => {
            let matchNumber = 1;
            newMatches = [];
            do {
                // Get everyone with the current amount of points.
                let thesePlayers = u.filter(x => x.matchPoints === p);
                // If we're collapsing and this is the last nonzero point amount, get the 0-pointers, too.
                if (collapse && u.reduce((x, y) => y.matchPoints >= p ? x : Math.max(x, y.matchPoints), 0) === 0) {
                    thesePlayers = thesePlayers.concat(u.filter(x => x.matchPoints === 0));
                    p = 0;
                }
                // If no one has the amount of points.
                if (thesePlayers.length === 0) {
                    // If we're at the end and someone is on hold, give them the bye.
                    if (p === 0 && hold.length > 0) {
                        if (hold.length > 1 || hold[0].byes === 1) return false;
                        let newId;
                        do {
                            newId = Utilities.randomString(12);
                        } while (matches.findIndex(m => m.id === newId) > -1 || newMatches.findIndex(m => m.id === newId) > -1);
                        newMatches.push(new Match(newId, round, 0, [hold[0], null]));
                        return true;
                    // Otherwise, move on to next amount of points.
                    } else {
                        p = u.reduce((x, y) => y.matchPoints >= p ? x : Math.max(x, y.matchPoints), 0);
                        continue;
                    }
                }
                // Sort everyone and combine them.
                if (hold.length > 1) hold.sort((a, b) => b.seed - a.seed);
                if (thesePlayers.length > 1) thesePlayers.sort((a, b) => b.seed - a.seed);
                let allPlayers = hold.concat(thesePlayers);
                // Split group in half, with any odd person in lower half.
                const s1 = allPlayers.splice(0, Math.ceil((thesePlayers.length + hold.length) / 2));
                const s2 = allPlayers.splice(-Math.ceil((thesePlayers.length + hold.length) / 2));
                if (s1.length > s2.length) s2.unshift(s1.pop());
                // Reset holding space.
                hold = [];
                // Pair people with the designated point amount.
                while (s1.length + s2.length > 1) {
                    // Sort by largest color preference difference.
                    s2.sort((x, y) => Math.abs(s1[0].colorPref - y.colorPref) - Math.abs(s1[0].colorPref - x.colorPref));
                    let i = 0;
                    // Find a compatible opponent.
                    while (i < s2.length) {
                        // Can't pair people with the same absolute color preference.
                        if (s1[0].results.findIndex(o => o.opponent === s2[i].id) > -1 || (s1[0].colorPref === 2 && s2[i].colorPref === 2) || (s1[0].colorPref === -2 && s2[i].colorPref === -2)) i++;
                        else {
                            // Determine if they can be paired, and who is player 1 and who is player 2.
                            const order = Algorithms.pairCompare(s1[0], s2[i]);
                            if (order === null) i++;
                            else {
                                let newId;
                                do {
                                    newId = Utilities.randomString(12);
                                } while (matches.findIndex(m => m.id === newId) > -1 || newMatches.findIndex(m => m.id === newId) > -1);
                                const newMatch = new Match(newId, round, matchNumber, order);
                                newMatch.active = true;
                                newMatches.push(newMatch);
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
                        let newId;
                        do {
                            newId = Utilities.randomString(12);
                        } while (matches.findIndex(m => m.id === newId) > -1 || newMatches.findIndex(m => m.id === newId) > -1);
                        newMatches.push(new Match(newId, round, 0, [s1[0], null]));
                        return true;
                    } else hold.push(s1[0]);
                } else if (s2.length === 1) {
                    if (p === 0) {
                        if (s2[0].byes === 1) return false;
                        let newId;
                        do {
                            newId = Utilities.randomString(12);
                        } while (matches.findIndex(m => m.id === newId) > -1 || newMatches.findIndex(m => m.id === newId) > -1);
                        newMatches.push(new Match(newId, round, 0, [s2[0], null]));
                        return true;
                    } else hold.push(s2[0]);
                // If there's no one left, either we're done, or move to next point value.
                } else if (s1.length === 0 && s2.length === 0) {
                    if (p === 0) return true;
                    else {
                        p = u.reduce((x, y) => y.matchPoints >= p ? x : Math.max(x, y.matchPoints), 0);
                        continue;
                    }
                } else return false;
                p = u.reduce((x, y) => y.matchPoints >= p ? x : Math.max(x, y.matchPoints), 0);
            } while (p >= 0);
        };
        do {
            let byePlayers = players.filter(p => p.initialByes >= round);
            let playersToPair = [...players];
            let initialByes = [];
            if (byePlayers.length > 0) {
                byePlayers.forEach(player => {
                    let newId;
                    do {
                        newId = Utilities.randomString(12);
                    } while (matches.findIndex(m => m.id === newId) > -1 || newMatches.findIndex(m => m.id === newId) > -1);
                    initialByes.push(new Match(newId, round, 0, [player, null]));
                    playersToPair.splice(playersToPair.indexOf(player), 1);
                });
            }
            success = pairAttempt(maxPoints, playersToPair);
            loopCheck++;
            if (loopCheck === 10) return [];
            newMatches.push(...initialByes);
        } while (success === false);
        newMatches.forEach(m => {
            if (m.playerTwo !== null) {
                m.playerOne.colorPref++;
                m.playerOne.colors.push('w');
                m.playerTwo.colorPref--;
                m.playerTwo.colors.push('b');
            }
        });
        return newMatches;
    },
    /**
     * Round-robin algorithm (Berger tables).
     * @param {Player[]|Array.Player[]} players An array of players, or an array of arrays of players.
     * @param {Boolean} groups If players represents an array of arrays of players or not.
     * @param {Boolean} double If players play each other once or twice.
     * @return {Match[]}
     */
    robin: (players, groups, double) => {
        let matches = [];
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
                        if (j === 0) Algorithms.blankMatches(matches, players.length * (g.length / 2), r);
                        const newPairings = matches.filter(p => p.round === r);
                        // Round 1 pairing method.
                        if (k === 0) {
                            for (let x = 0; x < g.length / 2; x++) {
                                const m = newPairings[ffw + x];
                                m.playerOne = g[x];
                                m.playerTwo = g[g.length - x - 1];
                                if (m.playerOne !== null && m.playerTwo !== null) m.active = true;
                            }
                        // Subsequent round pairing method (Berger tables).
                        } else {
                            // Need previous round.
                            const oldPairings = matches.filter(p => p.round === r - 1);
                            // Loop through each match.
                            for (let l = 0; l < g.length / 2; l++) {
                                const m = newPairings[ffw + l];
                                // First match may contain bye, since the bye would be the last player in the group.
                                if (l === 0) {
                                    if (oldPairings[ffw + l].playerTwo === g[g.length - 1] || oldPairings[l].playerTwo === null) {
                                        m.playerOne = g[g.length - 1];
                                        let i1 = g.findIndex(p => p.id === oldPairings[ffw + l].playerOne.id);
                                        i1 = i1 + (g.length / 2) > g.length - 2 ? i1 - (g.length / 2) + 1 : i1 + (g.length / 2);
                                        m.playerTwo = g[i1];
                                    } else {
                                        m.playerTwo = g[g.length - 1];
                                        let i1 = g.findIndex(p => p.id === oldPairings[ffw + l].playerTwo.id);
                                        i1 = i1 + (g.length / 2) > g.length - 2 ? i1 - (g.length / 2) + 1 : i1 + (g.length / 2);
                                        m.playerOne = g[i1];
                                    }
                                // Pairing all other matches.
                                } else {
                                    const oldMatch = oldPairings[ffw + l];
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
                    Algorithms.blankMatches(matches, thesePlayers.length / 2, r);
                    const newPairings = matches.filter(p => p.round === r);
                    // Round 1 pairing method.
                    if (j === 0) {
                        newPairings.forEach((m, k) => {
                            m.playerOne = thesePlayers[k];
                            m.playerTwo = thesePlayers[thesePlayers.length - k - 1];
                            if (m.playerOne !== null && m.playerTwo !== null) m.active = true;
                        });
                    // Subsequent round pairing method (Berger tables).
                    } else {
                        // Need previous round.
                        const oldPairings = matches.filter(p => p.round === r - 1);
                        // Loop through each match.
                        newPairings.forEach((m, k) => {
                            // First match may contain bye, since the bye would be the last player in the group.
                            if (k === 0) {
                                if (oldPairings[0].playerTwo === thesePlayers[thesePlayers.length - 1] || oldPairings[0].playerTwo === null) {
                                    m.playerOne = thesePlayers[thesePlayers.length - 1];
                                    let i1 = thesePlayers.findIndex(p => p.id === oldPairings[0].playerOne.id);
                                    i1 = i1 + (thesePlayers.length / 2) > thesePlayers.length - 2 ? i1 - (thesePlayers.length / 2) + 1 : i1 + (thesePlayers.length / 2);
                                    m.playerTwo = thesePlayers[i1];
                                } else {
                                    m.playerTwo = thesePlayers[thesePlayers.length - 1];
                                    let i1 = thesePlayers.findIndex(p => p.id === oldPairings[0].playerTwo.id);
                                    i1 = i1 + (thesePlayers.length / 2) > thesePlayers.length - 2 ? i1 - (thesePlayers.length / 2) + 1 : i1 + (thesePlayers.length / 2);
                                    m.playerOne = thesePlayers[i1];
                                }
                            // Pairing all other matches.
                            } else {
                                const oldMatch = oldPairings[k];
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
                }
            }
        }
        return matches;
    }
};

module.exports = Algorithms;