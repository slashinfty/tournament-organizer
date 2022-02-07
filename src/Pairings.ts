import cryptoRandomString from 'crypto-random-string';
import arrayShuffle from 'array-shuffle';
import blossom from 'edmonds-blossom';
import { Structure } from './Tournament.js';
import { Match } from './Match.js';

/**
 * Creates matches for a single elimination tournament/playoffs.
 * @param tournament The tournament for which matches are being created.
 * @internal
 */
const singleElimination = (tournament: Structure): void => {

    // Get active players
    let players = tournament.players.filter(player => player.active === true);

    // Sort players if necessary, otherwise shuffle them
    if (tournament.status === 'playoffs' || tournament.sorting === 'ascending') {
        players.sort((a, b) => a.seed - b.seed);
    } else if (tournament.sorting === 'descending') {
        players.sort((a, b) => b.seed - a.seed);
    } else {
        players = arrayShuffle(players);
    }

    // Important values (determines bracket sizing)
    const exponent = Math.log2(players.length);
    const remainder = Math.round(2 ** exponent) % (2 ** Math.floor(exponent));

    // Create bracket
    const bracket = [1, 4, 2, 3];
    for (let i = 3; i <= Math.floor(exponent); i++) {
        for (let j = 0; j < bracket.length; j += 2) {
            bracket.splice(j + 1, 0, 2 ** i + 1 - bracket[j]);
        }
    }

    // Create first round, if players.length != power of 2
    const startingRound = tournament.currentRound;
    let round = startingRound;
    if (remainder !== 0) {
        for (let i = 0; i < remainder; i++) {
            let matchID = cryptoRandomString({length: 10, type: 'alphanumeric'});
            while (tournament.matches.some(match => match.id === matchID)) {
                matchID = cryptoRandomString({length: 10, type: 'alphanumeric'});
            }
            tournament.matches.push(new Match({
                id: matchID,
                round: round,
                match: i + 1
            }));
        }
        round++;
    }

    // Create all other rounds
    let matchExponent = Math.floor(exponent) - 1;
    let firstIterationComplete = false;
    do {
        for (let i = 0; i < 2 ** matchExponent; i++) {
            let matchID = cryptoRandomString({length: 10, type: 'alphanumeric'});
            while (tournament.matches.some(match => match.id === matchID)) {
                matchID = cryptoRandomString({length: 10, type: 'alphanumeric'});
            }
            tournament.matches.push(new Match({
                id: matchID,
                round: round,
                match: i + 1
            }));
        }
        if (firstIterationComplete === false) firstIterationComplete = true;
        else {
            tournament.matches.filter(match => match.round === round - 1).forEach(match => {
                match.winnersPath = tournament.matches.find(m => m.round === round && m.match === Math.ceil(match.match / 2)).id;
            });
        }
        round++;
        matchExponent--;
    } while (round < startingRound + Math.ceil(exponent));

    // Assign players to starting matches
    let roundToAssign = remainder === 0 ? startingRound : startingRound + 1;
    tournament.matches.filter(match => match.round === roundToAssign).forEach((match, i) => {
        match.playerOne = players[bracket[2 * i] - 1].id;
        match.playerTwo = players[bracket[2 * i + 1] - 1].id;
        match.active = true;
    });

    // Assign players to the first round, if players.length != power of 2
    if (remainder !== 0) {
        const firstRound = tournament.matches.filter(match => match.round === startingRound);
        firstRound.forEach((match, i) => {
            match.playerOne = players[2 ** Math.floor(exponent) + i].id;
            const playerTwo = players[2 ** Math.floor(exponent) - i - 1].id;
            const nextMatch = tournament.matches.find(match => match.round === startingRound + 1 &&
                ((match.playerOne !== null && match.playerOne === playerTwo) || (match.playerTwo !== null && match.playerTwo === playerTwo)));
            if (nextMatch.playerOne === playerTwo) nextMatch.playerOne = null;
            else if (nextMatch.playerTwo === playerTwo) nextMatch.playerTwo = null;
            match.playerTwo = playerTwo;
            match.winnersPath = nextMatch.id;
            match.active = true;
            nextMatch.active = false;
        });
    }

    // Create the consolation match, if necessary
    if (tournament.consolation === true) {
        const lastRound = tournament.matches.reduce((currentMax, currentMatch) => Math.max(currentMax, currentMatch.round), 0);
        const lastMatch = tournament.matches.filter(match => match.round === lastRound).reduce((currentMax, currentMatch) => Math.max(currentMax, currentMatch.match), 0);
        let matchID = cryptoRandomString({length: 10, type: 'alphanumeric'});
        while (tournament.matches.some(match => match.id === matchID)) {
            matchID = cryptoRandomString({length: 10, type: 'alphanumeric'});
        }
        tournament.matches.push(new Match({
            id: matchID,
            round: lastRound,
            match: lastMatch + 1
        }));
        tournament.matches.filter(match => match.round === lastRound - 1).forEach(match => {
            match.losersPath = matchID;
        });
    }
}

/**
 * Creates matches for a double elimination tournament/playoffs.
 * @param tournament The tournament for which matches are being created.
 * @internal
 */
const doubleElimination = (tournament: Structure): void => {

    // Get active players
    let players = tournament.players.filter(player => player.active === true);

    // Sort players if necessary, otherwise shuffle them
    if (tournament.status === 'playoffs' || tournament.sorting === 'ascending') {
        players.sort((a, b) => a.seed - b.seed);
    } else if (tournament.sorting === 'descending') {
        players.sort((a, b) => b.seed - a.seed);
    } else {
        players = arrayShuffle(players);
    }

    // Important values (determines bracket sizing)
    const exponent = Math.log2(players.length);
    const remainder = Math.round(2 ** exponent) % (2 ** Math.floor(exponent));

    // Create bracket
    const bracket = [1, 4, 2, 3];
    for (let i = 3; i <= Math.floor(exponent); i++) {
        for (let j = 0; j < bracket.length; j += 2) {
            bracket.splice(j + 1, 0, 2 ** i + 1 - bracket[j]);
        }
    }

    // Create first round, if players.length != power of 2
    const startingRound = tournament.currentRound;
    let round = startingRound;
    if (remainder !== 0) {
        for (let i = 0; i < remainder; i++) {
            let matchID = cryptoRandomString({length: 10, type: 'alphanumeric'});
            while (tournament.matches.some(match => match.id === matchID)) {
                matchID = cryptoRandomString({length: 10, type: 'alphanumeric'});
            }
            tournament.matches.push(new Match({
                id: matchID,
                round: round,
                match: i + 1
            }));
        }
        round++;
    }

    // Create all other rounds
    let matchExponent = Math.floor(exponent) - 1;
    let firstIterationComplete = false;
    do {
        for (let i = 0; i < 2 ** matchExponent; i++) {
            let matchID = cryptoRandomString({length: 10, type: 'alphanumeric'});
            while (tournament.matches.some(match => match.id === matchID)) {
                matchID = cryptoRandomString({length: 10, type: 'alphanumeric'});
            }
            tournament.matches.push(new Match({
                id: matchID,
                round: round,
                match: i + 1
            }));
        }
        if (firstIterationComplete === false) firstIterationComplete = true;
        else {
            tournament.matches.filter(match => match.round === round - 1).forEach(match => {
                match.winnersPath = tournament.matches.find(m => m.round === round && m.match === Math.ceil(match.match / 2)).id;
            });
        }
        round++;
        matchExponent--;
    } while (round < startingRound + Math.ceil(exponent));

    // Assign players to starting matches
    let roundToAssign = remainder === 0 ? startingRound : startingRound + 1;
    tournament.matches.filter(match => match.round === roundToAssign).forEach((match, i) => {
        match.playerOne = players[bracket[2 * i] - 1].id;
        match.playerTwo = players[bracket[2 * i + 1] - 1].id;
        match.active = true;
    });

    // Assign players to the first round, if players.length != power of 2
    if (remainder !== 0) {
        const firstRound = tournament.matches.filter(match => match.round === startingRound);
        firstRound.forEach((match, i) => {
            match.playerOne = players[2 ** Math.floor(exponent) + i].id;
            const playerTwo = players[2 ** Math.floor(exponent) - i - 1].id;
            const nextMatch = tournament.matches.find(match => match.round === startingRound + 1 &&
                ((match.playerOne !== null && match.playerOne === playerTwo) || (match.playerTwo !== null && match.playerTwo === playerTwo)));
            if (nextMatch.playerOne === playerTwo) nextMatch.playerOne = null;
            else if (nextMatch.playerTwo === playerTwo) nextMatch.playerTwo = null;
            match.playerTwo = playerTwo;
            match.winnersPath = nextMatch.id;
            match.active = true;
            nextMatch.active = false;
        });
    }

    // Create final round for winners of each bracket
    let finalMatchID = cryptoRandomString({length: 10, type: 'alphanumeric'});
    while (tournament.matches.some(match => match.id === finalMatchID)) {
        finalMatchID = cryptoRandomString({length: 10, type: 'alphanumeric'});
    }
    tournament.matches.push(new Match({
        id: finalMatchID,
        round: round,
        match: 1
    }));
    tournament.matches.find(match => match.round === round - 1).winnersPath = finalMatchID;
    round++;

    // Create first loser's bracket rounds, if players.length != power of 2
    const roundDifference = round - 1;
    if (remainder !== 0) {
        if (remainder <= 2 ** Math.floor(exponent) / 2) {
            for (let i = 0; i < remainder; i++) {
                let matchID = cryptoRandomString({length: 10, type: 'alphanumeric'});
                while (tournament.matches.some(match => match.id === matchID)) {
                    matchID = cryptoRandomString({length: 10, type: 'alphanumeric'});
                }
                tournament.matches.push(new Match({
                    id: matchID,
                    round: round,
                    match: i + 1
                }));
            }
            round++;
        } else {
            for (let i = 0; i < remainder - 2 ** (Math.floor(exponent) - 1); i++) {
                let matchID = cryptoRandomString({length: 10, type: 'alphanumeric'});
                while (tournament.matches.some(match => match.id === matchID)) {
                    matchID = cryptoRandomString({length: 10, type: 'alphanumeric'});
                }
                tournament.matches.push(new Match({
                    id: matchID,
                    round: round,
                    match: i + 1
                }));
            }
            round++;
            for (let i = 0; i < 2 ** (Math.floor(exponent) - 1); i++) {
                let matchID = cryptoRandomString({length: 10, type: 'alphanumeric'});
                while (tournament.matches.some(match => match.id === matchID)) {
                    matchID = cryptoRandomString({length: 10, type: 'alphanumeric'});
                }
                tournament.matches.push(new Match({
                    id: matchID,
                    round: round,
                    match: i + 1
                }));
            }
            round++;
        }
    }

    // Create the remainder of the loser's bracket
    let loserExponent = Math.floor(exponent) - 2;
    do {
        for (let i = 0; i < 2; i++) {
            for (let j = 0; j < 2 ** loserExponent; j++) {
                let matchID = cryptoRandomString({length: 10, type: 'alphanumeric'});
                while (tournament.matches.some(match => match.id === matchID)) {
                    matchID = cryptoRandomString({length: 10, type: 'alphanumeric'});
                }
                tournament.matches.push(new Match({
                    id: matchID,
                    round: round,
                    match: j + 1
                }));
            }
            round++;
        }
        loserExponent--;
    } while (loserExponent > -1);

    // Route the winner's bracket to the loser's bracket
    // Method depends on the remainder's value
    const fillPattern = (matchCount, fillCount) => {
        const arr = Array.from({length: matchCount}, (_, i) => i + 1);
        const count = fillCount % 4;
        const firstHalf = arr.slice(0, arr.length / 2);
        const secondHalf = arr.slice(arr.length / 2);
        return count === 0 ? arr :
            count === 1 ? arr.reverse() :
            count === 2 ? firstHalf.reverse().concat(secondHalf.reverse()) :
            secondHalf.concat(firstHalf);
    }
    let fillCount = 0;
    let winnerRoundCount = startingRound;
    let loserRoundCount = roundDifference + 1;
    if (remainder === 0) {
        const winnerRound = tournament.matches.filter(match => match.round === winnerRoundCount);
        const loserRound = tournament.matches.filter(match => match.round === loserRoundCount);
        const fill = fillPattern(winnerRound.length, fillCount);
        fillCount++;
        let counter = 0;
        loserRound.forEach(match => {
            for (let i = 0; i < 2; i++) {
                const winnerMatch = winnerRound.find(m => m.match === fill[counter]);
                winnerMatch.losersPath = match.id;
                counter++;
            }
        });
        winnerRoundCount++;
        loserRoundCount++;
    } else if (remainder <= 2 ** Math.floor(exponent) / 2) {
        let winnerRound = tournament.matches.filter(match => match.round === winnerRoundCount);
        let loserRound = tournament.matches.filter(match => match.round === loserRoundCount);
        let fill = fillPattern(winnerRound.length, fillCount);
        fillCount++;
        loserRound.forEach((match, index) => {
            const winnerMatch = winnerRound.find(m => m.match === fill[index]);
            winnerMatch.losersPath = match.id;
        });
        winnerRoundCount++;
        loserRoundCount++;
        winnerRound = tournament.matches.filter(match => match.round === winnerRoundCount);
        loserRound = tournament.matches.filter(match => match.round === loserRoundCount);
        fill = fillPattern(winnerRound.length, fillCount);
        fillCount++;
        let counterA = 0;
        let counterB = 0;
        let matchNumbersToRoute = tournament.matches.filter(match => match.round === startingRound + 1 && (match.playerOne === null || match.playerTwo === null)).map(match => Math.ceil(match.match / 2));
        let copyOfMatchNumbers = [...matchNumbersToRoute];
        loserRound.forEach(match => {
            for (let i = 0; i < 2; i++) {
                const winnerMatch = winnerRound.find(m => m.match === fill[counterA]);
                if (copyOfMatchNumbers.some(num => num === match.match)) {
                    winnerMatch.losersPath = tournament.matches.filter(m => m.round === loserRoundCount - 1)[counterB].id;
                    counterB++;
                    copyOfMatchNumbers.splice(copyOfMatchNumbers.indexOf(match.match), 1);
                } else {
                    winnerMatch.losersPath = match.id;
                }
                counterA++;
            }
        });
        winnerRoundCount++;
        loserRoundCount++;
        const lastRoundToRoute = tournament.matches.filter(match => match.round === roundDifference + 1);
        lastRoundToRoute.forEach((match, i) => {
            match.winnersPath = tournament.matches.filter(m => m.round === match.round + 1).find(m => m.match === matchNumbersToRoute[i]).id;
        });
    } else {
        const winnerRound = tournament.matches.filter(match => match.round === winnerRoundCount);
        const firstLoserRound = tournament.matches.filter(match => match.round === loserRoundCount);
        loserRoundCount++;
        const secondLoserRound = tournament.matches.filter(match => match.round === loserRoundCount);
        const fill = fillPattern(winnerRound.length, fillCount);
        fillCount++;
        let counterA = 0;
        let counterB = 0;
        let matchNumbersToRoute = tournament.matches.filter(match => match.round === startingRound + 1 && match.playerOne === null && match.playerTwo === null).map(match => match.match);
        secondLoserRound.forEach(match => {
            const firstWinnerMatch = winnerRound.find(m => m.match === fill[counterA]);
            if (matchNumbersToRoute.some(num => num === match.match)) {
                const loserMatch = firstLoserRound[counterB];
                firstWinnerMatch.losersPath = loserMatch.id;
                counterA++;
                counterB++;
                const secondWinnerMatch = winnerRound.find(m => m.match === fill[counterA]);
                secondWinnerMatch.losersPath = loserMatch.id;
            } else firstWinnerMatch.losersPath = match.id;
            counterA++;
        });
        winnerRoundCount++;
        const lastRoundToRoute = tournament.matches.filter(match => match.round === roundDifference + 1);
        lastRoundToRoute.forEach((match, i) => {
            match.winnersPath = tournament.matches.filter(m => m.round === match.round + 1).find(m => m.match === matchNumbersToRoute[i]).id;
        });
    }

    // Route all remaining winner's bracket matches
    let fastForward = 0;
    for (let i = winnerRoundCount; i < roundDifference; i++) {
        const winnerRound = tournament.matches.filter(match => match.round === i);
        let loserRound = tournament.matches.filter(match => match.round === loserRoundCount - winnerRoundCount + fastForward + i);
        const nextLoserRound = tournament.matches.filter(match => match.round === loserRoundCount - winnerRoundCount + fastForward + i + 1);
        if (nextLoserRound.length === loserRound.length) {
            loserRound = nextLoserRound;
            fastForward++;
        }
        const fill = fillPattern(winnerRound.length, fillCount);
        fillCount++;
        loserRound.forEach((match, index) => {
            const winnerMatch = winnerRound.find(m => m.match === fill[index]);
            winnerMatch.losersPath = match.id;
        });
    }

    // Route winners in the loser's bracket
    const loserStart = remainder === 0 ? roundDifference + 1 : roundDifference + 2;
    for (let i = loserStart; i < tournament.matches.reduce((currentMax, currentMatch) => Math.max(currentMax, currentMatch.round), 0); i++) {
        const current = tournament.matches.filter(match => match.round === i);
        const next = tournament.matches.filter(match => match.round === i + 1);
        if (current.length === next.length) {
            current.forEach((match, index) => match.winnersPath = next[index].id);
        } else {
            current.forEach((match, index) => match.winnersPath = next[Math.floor(index / 2)].id);
        }
    }

    // Connect the two brackets
    const lastMatch = tournament.matches.filter(match => match.round === tournament.matches.reduce((currentMax, currentMatch) => Math.max(currentMax, currentMatch.round), 0))[0];
    lastMatch.winnersPath = tournament.matches.filter(match => match.round === roundDifference)[0].id;
}

/**
 * Creates Swiss pairings for a single round
 * @param tournament The tournament for which matches are being created.
 * @internal
 */
const swiss = (tournament: Structure): void => {

    // Get active players
    let players = tournament.players.filter(player => player.active === true);

    // Give each player an index
    players.forEach((player, index) => player.bsn = index);

    // Get all score groups
    const scoreGroups = [...new Set(players.map(player => player.matchPoints))].sort((a, b) => a - b);

    // Get all score sums
    const scoreSums = [...new Set(scoreGroups.map((score, index, array) => {
        let sums = [];
        for (let i = index; i < array.length; i++) {
            sums.push(score + array[i]);
        }
        return sums;
    }).flat())].sort((a, b) => a - b);

    // Get all possible pairings and assign weight
    let blossomInput = [];
    let allowSecondPairing = false;
    do {
        for (let i = 0; i < players.length; i++) {

            // Get current player and all other players who haven't been paired with them yet
            const currentPlayer = players[i];
            const upcomingPlayers = players.slice(i + 1);

            // Sort players relative to current player, if tournament sorts players
            let sorted = tournament.sorting !== 'none' ? [...players.filter(player => player.id !== currentPlayer.id)].sort((a, b) => Math.abs(currentPlayer.seed - a.seed) - Math.abs(currentPlayer.seed - b.seed)) : [];

            // Go through upcoming players
            for (let j = 0; j < upcomingPlayers.length; j++) {

                // Get next player
                const upcomingPlayer = upcomingPlayers[j];

                // Skip if the players have played each other before
                if (currentPlayer.results.some(result => result.opponent === upcomingPlayer.id) && allowSecondPairing === false) continue;

                // Determine weight of pairing
                let weight = 0;

                // Weight is determined in the following order:
                // Give each pair a base value based on score sum
                weight += 12 * Math.log10(scoreSums.findIndex(sum => sum === currentPlayer.matchPoints + upcomingPlayer.matchPoints) + 1);
                // Assign a value based on how different their points are - higher value assigned to equal and neighboring points
                const scoreGroupDifference = Math.abs(scoreGroups.findIndex(score => score === currentPlayer.matchPoints) - scoreGroups.findIndex(score => score === upcomingPlayer.matchPoints));
                weight += scoreGroupDifference < 2 ? 5 / (2 * Math.log10(scoreGroupDifference + 2)) : 1 / Math.log10(scoreGroupDifference + 2);
                if (scoreGroupDifference === 1) {
                    weight += 1.1;
                }
                // Assign a value based on how close their seed value is, if players are sorted
                if (sorted.length > 0) {
                    weight += (1 / 3) * (Math.log2(sorted.length) - Math.log2(sorted.findIndex(player => player.id === upcomingPlayer.id) + 1));
                }
                // If the player has received a bye before, scale up their weights to encourage pairing
                if (currentPlayer.pairingBye === true) {
                    weight *= 1.25;
                }
                blossomInput.push([currentPlayer.bsn, upcomingPlayer.bsn, weight]);
            }
        }

        // If no one can be paired, allow players to be paired against other players they've already played against
        // This is an extremely rare corner case
        if (blossomInput.length === 0) {
            allowSecondPairing = true;
            continue;
        } else break;
    } while (true);


    // Get best pairings via Blossom Algorithm
    const blossomOutput = blossom(blossomInput, true);

    // Create matches
    let playersCopy = [...players];
    let byeArray = [];
    let matchCount = 1;
    do {
        const bsnA = playersCopy[0].bsn;
        const bsnB = blossomOutput[bsnA];
        if (bsnB === -1) {
            byeArray.push(playersCopy.splice(0, 1)[0]);
            continue;
        }
        playersCopy.splice(0, 1);
        playersCopy.splice(playersCopy.findIndex(player => player.bsn === bsnB), 1);
        let matchID = cryptoRandomString({length: 10, type: 'alphanumeric'});
        while (tournament.matches.some(match => match.id === matchID)) {
            matchID = cryptoRandomString({length: 10, type: 'alphanumeric'});
        }
        tournament.matches.push(new Match({
            id: matchID,
            match: matchCount++,
            round: tournament.currentRound,
            playerOne: players.find(player => player.bsn === bsnA).id,
            playerTwo: players.find(player => player.bsn === bsnB).id,
            active: true
        }));
    } while (playersCopy.length > blossomOutput.reduce((sum, bsn) => bsn === -1 ? sum + 1 : sum, 0));
    byeArray = [...byeArray, ...playersCopy];

    // Assign byes for remaining players
    for (let i = 0; i < byeArray.length; i++) {
        let matchID = cryptoRandomString({length: 10, type: 'alphanumeric'});
        while (tournament.matches.some(match => match.id === matchID)) {
            matchID = cryptoRandomString({length: 10, type: 'alphanumeric'});
        }
        tournament.matches.push(new Match({
            id: matchID,
            match: matchCount++,
            round: tournament.currentRound,
            playerOne: byeArray[i].id,
            playerTwo: null
        }));
    }

    // Reset index for each player
    players.forEach(player => player.bsn = 0);
}

/**
 * Creates Round Robin pairings for a tournament
 * @param tournament The tournament for which matches are being created.
 * @internal
 */
const roundRobin = (tournament: Structure): void => {

    // Get active players
    let players = tournament.players.filter(player => player.active === true);

    // Add null if the player length is odd
    if (players.length % 2 === 1) players.push(null);

    // Loop to repeat if double round-robin
    const loopCount = tournament.double === true ? 2 : 1;
    for (let loop = 0; loop < loopCount; loop++) {

        // Pair all rounds
        const startingRound = tournament.matches.reduce((currentMax, currentMatch) => Math.max(currentMax, currentMatch.round), 0);
        for (let round = 1 + startingRound; round < players.length + startingRound; round++) {

            // Create matches
            let currentMatches = [];
            for (let i = 0; i < players.length / 2; i++) {
                let matchID = cryptoRandomString({length: 10, type: 'alphanumeric'});
                while (tournament.matches.some(match => match.id === matchID)) {
                    matchID = cryptoRandomString({length: 10, type: 'alphanumeric'});
                }
                currentMatches.push(new Match({
                    id: matchID,
                    round: round,
                    match: i + 1
                }));
            }

            // How to pair the first round
            if (round === 1) {
                currentMatches.forEach((match, index) => {
                    match.playerOne = players[index] === null ? null : players[index].id;
                    match.playerTwo = players[players.length - index - 1] === null ? null : players[players.length - index - 1].id;
                    if (match.playerOne !== null && match.playerTwo !== null) match.active = true;
                });

            // Pairing subsequent rounds via Berger tables
            } else {

                // Get previous round's matches
                const previousMatches = tournament.matches.filter(match => match.round === round - 1);

                // Pair up each match for current round
                for (let i = 0; i < currentMatches.length; i++) {

                    // Get previous match and current match
                    const previousMatch = previousMatches[i];
                    const currentMatch = currentMatches[i];

                    // First match may contain a bye, since, if there's a bye, the last player would be null
                    if (i === 0) {
                        if (previousMatch.playerTwo === players[players.length - 1].id || previousMatch.playerTwo === null) {
                            currentMatch.playerOne = players[players.length - 1] === null ? null : players[players.length - 1].id;
                            let index = players.findIndex(player => player.id === previousMatch.playerOne);
                            index = index + (players.length / 2) > players.length - 2 ? index + 1 - (players.length / 2) : index + (players.length / 2);
                            currentMatch.playerTwo = players[index].id;
                        } else {
                            currentMatch.playerTwo = players[players.length - 1] === null ? null : players[players.length - 1].id;
                            let index = players.findIndex(player => player.id === previousMatch.playerTwo);
                            index = index + (players.length / 2) > players.length - 2 ? index + 1 - (players.length / 2) : index + (players.length / 2);
                            currentMatch.playerOne = players[index].id;
                        }

                    // Pair all remaining matches
                    } else {
                        let indexA = players.findIndex(player => player.id === previousMatch.playerOne);
                        indexA = indexA + (players.length / 2) > players.length - 2 ? indexA + 1 - (players.length / 2) : indexA + (players.length / 2);
                        currentMatch.playerOne = players[indexA].id;
                        let indexB = players.findIndex(player => player.id === previousMatch.playerTwo);
                        indexB = indexB + (players.length / 2) > players.length - 2 ? indexB + 1 - (players.length / 2) : indexB + (players.length / 2);
                        currentMatch.playerTwo = players[indexB].id;
                    }
                }
            }
            tournament.matches = [...tournament.matches, ...currentMatches];
        }
    }
}

export { singleElimination, doubleElimination, swiss, roundRobin }