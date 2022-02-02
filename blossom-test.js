const blossom = require('edmonds-blossom');

const players = [];

for (let i = 0; i < 20; i++) {
    players.push({
        name: `Player${i}`,
        score: 0,
        seed: Math.floor(Math.random() * 1300 + 1200),
        bsn: i
    });
}

let allPossibilities = [];

let scoreGroups = [...new Set(players.map(player => player.score))].sort((x, y) => y - x);
for (let i = 0; i < players.length; i++) {
    const current = players[i];
    const upcomingPlayers = players.slice(i + 1);
    const sorted = [...players.filter(player => player.bsn !== current.bsn).sort((x, y) => Math.abs(current.seed - y.seed) - Math.abs(current.seed - x.seed))];
    for (let j = 0; j < upcomingPlayers.length; j++) {
        const upcoming = upcomingPlayers[j];
        let weight = 0;
        let scoreGroupDifference = Math.abs(scoreGroups.findIndex(score => score === current.score) - scoreGroups.findIndex(score => score === upcoming.score));
        weight += scoreGroupDifference < 2 ? 5 / Math.log10(scoreGroupDifference + 2) : 2 / Math.log10(scoreGroupDifference + 2);
        if (scoreGroupDifference === 1) weight += 4.5;
        weight += Math.log2(sorted.length) - Math.log2(sorted.length - sorted.findIndex(player => player.bsn === upcoming.bsn)) - 1;
        allPossibilities.push([current.bsn, upcoming.bsn, weight]);
    }
}

let results = blossom(allPossibilities, true);
let matches = [];
let readableResults = [];

let allBsn = players.map(player => player.bsn);
do {
    const first = allBsn[0];
    allBsn.splice(0, 1);
    const second = results[first];
    allBsn.splice(allBsn.findIndex(bsn => bsn === second), 1);
    const p1 = players.find(player => player.bsn === first);
    const p2 = players.find(player => player.bsn === second);
    matches.push({
        p1: p1,
        p2: p2
    });
    readableResults.push({
        Player1: `${p1.name} - Score: ${p1.score} - Seed: ${p1.seed}`,
        Player2: `${p2.name} - Score: ${p2.score} - Seed: ${p2.seed}`
    });
} while (allBsn.length > 1);

console.table(readableResults);

matches.forEach(match => {
    const rand = Math.floor(Math.random() * 10);
    if (rand < 4) match.p1.score += 3;
    else if (rand < 8) match.p2.score += 3;
    else {
        match.p1.score += 1;
        match.p2.score += 1;
    }
});

allPossibilities = [];

scoreGroups = [...new Set(players.map(player => player.score))].sort((x, y) => y - x);
for (let i = 0; i < players.length; i++) {
    const current = players[i];
    const upcomingPlayers = players.slice(i + 1);
    const sorted = [...players.filter(player => player.bsn !== current.bsn).sort((x, y) => Math.abs(current.seed - y.seed) - Math.abs(current.seed - x.seed))];
    for (let j = 0; j < upcomingPlayers.length; j++) {
        const upcoming = upcomingPlayers[j];
        let weight = 0;
        let scoreGroupDifference = Math.abs(scoreGroups.findIndex(score => score === current.score) - scoreGroups.findIndex(score => score === upcoming.score));
        weight += scoreGroupDifference < 2 ? 5 / Math.log10(scoreGroupDifference + 2) : 2 / Math.log10(scoreGroupDifference + 2);
        if (scoreGroupDifference === 1) weight += 4.5;
        weight += Math.log2(sorted.length) - Math.log2(sorted.length - sorted.findIndex(player => player.bsn === upcoming.bsn)) - 1;
        allPossibilities.push([current.bsn, upcoming.bsn, weight]);
    }
}

results = blossom(allPossibilities, true);
matches = [];
readableResults = [];

allBsn = players.map(player => player.bsn);
do {
    const first = allBsn[0];
    allBsn.splice(0, 1);
    const second = results[first];
    allBsn.splice(allBsn.findIndex(bsn => bsn === second), 1);
    const p1 = players.find(player => player.bsn === first);
    const p2 = players.find(player => player.bsn === second);
    matches.push({
        p1: p1,
        p2: p2
    });
    readableResults.push({
        Player1: `${p1.name} - Score: ${p1.score} - Seed: ${p1.seed}`,
        Player2: `${p2.name} - Score: ${p2.score} - Seed: ${p2.seed}`
    });
} while (allBsn.length > 1);

console.table(readableResults);

matches.forEach(match => {
    const rand = Math.floor(Math.random() * 10);
    if (rand < 4) match.p1.score += 3;
    else if (rand < 8) match.p2.score += 3;
    else {
        match.p1.score += 1;
        match.p2.score += 1;
    }
});

allPossibilities = [];

scoreGroups = [...new Set(players.map(player => player.score))].sort((x, y) => y - x);
for (let i = 0; i < players.length; i++) {
    const current = players[i];
    const upcomingPlayers = players.slice(i + 1);
    const sorted = [...players.filter(player => player.bsn !== current.bsn).sort((x, y) => Math.abs(current.seed - y.seed) - Math.abs(current.seed - x.seed))];
    for (let j = 0; j < upcomingPlayers.length; j++) {
        const upcoming = upcomingPlayers[j];
        let weight = 0;
        let scoreGroupDifference = Math.abs(scoreGroups.findIndex(score => score === current.score) - scoreGroups.findIndex(score => score === upcoming.score));
        weight += scoreGroupDifference < 2 ? 5 / Math.log10(scoreGroupDifference + 2) : 2 / Math.log10(scoreGroupDifference + 2);
        if (scoreGroupDifference === 1) weight += 4.5;
        weight += Math.log2(sorted.length) - Math.log2(sorted.length - sorted.findIndex(player => player.bsn === upcoming.bsn)) - 1;
        allPossibilities.push([current.bsn, upcoming.bsn, weight]);
    }
}

results = blossom(allPossibilities, true);
matches = [];
readableResults = [];

allBsn = players.map(player => player.bsn);
do {
    const first = allBsn[0];
    allBsn.splice(0, 1);
    const second = results[first];
    allBsn.splice(allBsn.findIndex(bsn => bsn === second), 1);
    const p1 = players.find(player => player.bsn === first);
    const p2 = players.find(player => player.bsn === second);
    matches.push({
        p1: p1,
        p2: p2
    });
    readableResults.push({
        Player1: `${p1.name} - Score: ${p1.score} - Seed: ${p1.seed}`,
        Player2: `${p2.name} - Score: ${p2.score} - Seed: ${p2.seed}`
    });
} while (allBsn.length > 1);

console.table(readableResults);

matches.forEach(match => {
    const rand = Math.floor(Math.random() * 10);
    if (rand < 4) match.p1.score += 3;
    else if (rand < 8) match.p2.score += 3;
    else {
        match.p1.score += 1;
        match.p2.score += 1;
    }
});

allPossibilities = [];

scoreGroups = [...new Set(players.map(player => player.score))].sort((x, y) => y - x);
for (let i = 0; i < players.length; i++) {
    const current = players[i];
    const upcomingPlayers = players.slice(i + 1);
    const sorted = [...players.filter(player => player.bsn !== current.bsn).sort((x, y) => Math.abs(current.seed - y.seed) - Math.abs(current.seed - x.seed))];
    for (let j = 0; j < upcomingPlayers.length; j++) {
        const upcoming = upcomingPlayers[j];
        let weight = 0;
        let scoreGroupDifference = Math.abs(scoreGroups.findIndex(score => score === current.score) - scoreGroups.findIndex(score => score === upcoming.score));
        weight += scoreGroupDifference < 2 ? 5 / Math.log10(scoreGroupDifference + 2) : 2 / Math.log10(scoreGroupDifference + 2);
        if (scoreGroupDifference === 1) weight += 4.5;
        weight += Math.log2(sorted.length) - Math.log2(sorted.length - sorted.findIndex(player => player.bsn === upcoming.bsn)) - 1;
        allPossibilities.push([current.bsn, upcoming.bsn, weight]);
    }
}

results = blossom(allPossibilities, true);
matches = [];
readableResults = [];

console.table(players.sort((x, y) => y.score - x.score).map(player => ({
    Player: player.name,
    Score: player.score
})));

allBsn = players.map(player => player.bsn);
do {
    const first = allBsn[0];
    allBsn.splice(0, 1);
    const second = results[first];
    allBsn.splice(allBsn.findIndex(bsn => bsn === second), 1);
    const p1 = players.find(player => player.bsn === first);
    const p2 = players.find(player => player.bsn === second);
    matches.push({
        p1: p1,
        p2: p2
    });
    readableResults.push({
        Player1: `${p1.name} - Score: ${p1.score} - Seed: ${p1.seed}`,
        Player2: `${p2.name} - Score: ${p2.score} - Seed: ${p2.seed}`
    });
} while (allBsn.length > 1);

console.table(readableResults);