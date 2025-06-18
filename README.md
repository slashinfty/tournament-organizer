## Tournament Organizer
A Node.js module for organizing tournaments, written in TypeScript.

**Version 3 is now an ESM module.** If you don't understand what this means for you, [read this](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c).

[![npm](https://img.shields.io/npm/v/tournament-organizer?style=flat-square)](https://npmjs.org/package/tournament-organizer) [![GitHub last commit](https://img.shields.io/github/last-commit/slashinfty/tournament-organizer?style=flat-square)](https://github.com/slashinfty/tournament-organizer/commits/main) [![GitHub issues](https://img.shields.io/github/issues-raw/slashinfty/tournament-organizer?style=flat-square)](https://github.com/slashinfty/tournament-organizer/issues) [![GitHub pull requests](https://img.shields.io/github/issues-pr-raw/slashinfty/tournament-organizer?style=flat-square)](https://github.com/slashinfty/tournament-organizer/pulls) [![GitHub](https://img.shields.io/github/license/slashinfty/tournament-organizer?style=flat-square)](https://github.com/slashinfty/tournament-organizer/blob/main/LICENSE) [![Ko-Fi](https://img.shields.io/badge/Ko--Fi-Buy%20Me%20a%20Coffee-a87b00)](https://ko-fi.com/mattbraddock)

### About
This JavaScript module for Node.js facilitates the organization and execution of tournaments.

Supports many tournament formats:
* single elimination
* double elimination
* stepladder
* round-robin
* double round-robin
* Swiss

Supports 2-stage tournaments. Playoffs can be paired by:
* single elimination
* double elimination
* stepladder

For non-elimination tournaments, the following tiebreaker systems are supported (their details can be found [here](https://en.wikipedia.org/wiki/Tie-breaking_in_Swiss-system_tournaments)):
* Solkoff
* Median-Buchholz
* Sonneborn-Berger
* Cumulative
* Versus
* Opponent's match win percentage
* Game win percentage
* Opponent's game win percentage
* Opponent's opponent's match win percentage

## Installation
```shell
npm i tournament-organizer
```

### Import
In Node.js:
```ts
import TournamentOrganizer from 'tournament-organizer';
```

In the browser:
```js
import TournamentOrganizer from "https://esm.sh/tournament-organizer/dist/index.module.js";
```

## Usage

### Single elimination

Example with a simple single elimination tournament and 4 players:
```ts
import TournamentOrganizer from 'tournament-organizer';

// Instanciate a TournamentOrganizer.
// It will holds your tournaments.
const tournamentOrganizer = new TournamentOrganizer();

const tournament = tournamentOrganizer.createTournament('test');

tournament.createPlayer('A');
tournament.createPlayer('B');
tournament.createPlayer('C');
tournament.createPlayer('D');

tournament;
/*
{
  name: 'test',
  status: 'setup',
  players: [...],
  stageOne: { format: 'single-elimination' },
}
*/

// Start tournament, initialize pairings
tournament.start();

tournament.matches;
/*
[
  {
    id: '3g1LWbUhAIjm',
    round: 1,
    match: 1,
    active: true,
    bye: false,
    player1: { id: 'c5xGn25WhfAP', win: 0, loss: 0, draw: 0 },
    player2: { id: 'lrm1mxzinTVA', win: 0, loss: 0, draw: 0 },
    path: { win: 'B8r1eAuvNEcu', loss: null },
    meta: {}
  },
  ...
]
*/

// Round 1, match 1 ended, player1 won 1 - 0. Enter results
const match0 = tournament.matches[0];

tournament.enterResult(match0.id, 1, 0);

// ...

// Final ended, end tournament
tournament.end();

// Get standings, scores and tiebreaks
tournament.standings(false);
/*
[
  {
    player: Player {
      id: 'm4Nx41c5F9v5',
      name: 'c',
      ...
    },
    gamePoints: 2,
    games: 2,
    matchPoints: 2,
    matches: 2,
    tiebreaks: {
      medianBuchholz: 0,
      solkoff: 1,
      sonnebornBerger: 1,
      cumulative: 3,
      oppCumulative: 2,
      matchWinPct: 1,
      oppMatchWinPct: 0.25,
      oppOppMatchWinPct: 0.75,
      gameWinPct: 1,
      oppGameWinPct: 0.25
    }
  },
  ...
]
*/
```

Add a match to determine the third place player:
```ts
const tournament = tournamentOrganizer.createTournament('test', {
    stageOne: {
        format: 'single-elimination',
        consolation: true,
    },
});
```

### Swiss

Create a Swiss tournament:
```ts
import TournamentOrganizer from 'tournament-organizer';

const tournamentOrganizer = new TournamentOrganizer();

const tournament = tournamentOrganizer.createTournament('test', {
    stageOne: {
        format: 'swiss',
    },
});
```

Number of rounds is automatically calculated depending on number of players, following the formula: `ceil(log2(number of players))`.

Specify the number of rounds with:

```ts
const tournament = tournamentOrganizer.createTournament('test', {
    stageOne: {
        format: 'swiss',
        rounds: 5,
    },
});
```


## Contributing
Please submit an issue if you encounter a bug or have a feature suggestion.

If you are interested in contributing, please feel free to fork and clone the repository (on main branch), then submit a pull request.

I am a high school teacher, and would appreciate any and all support in continuing this project.

## Discussion

You can discuss this repository more in my [Discord](https://discord.gg/Q8t9gcZ77s).
