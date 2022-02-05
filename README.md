## Tournament Organizer
A [pure ESM](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c) module for organizing tournaments.

[![npm](https://img.shields.io/npm/v/tournament-organizer?style=flat-square)](https://npmjs.org/package/tournament-organizer) [![GitHub last commit](https://img.shields.io/github/last-commit/slashinfty/tournament-organizer?style=flat-square)](https://github.com/slashinfty/tournament-organizer/commits/main) [![GitHub issues](https://img.shields.io/github/issues-raw/slashinfty/tournament-organizer?style=flat-square)](https://github.com/slashinfty/tournament-organizer/issues) [![GitHub pull requests](https://img.shields.io/github/issues-pr-raw/slashinfty/tournament-organizer?style=flat-square)](https://github.com/slashinfty/tournament-organizer/pulls) [![GitHub](https://img.shields.io/github/license/slashinfty/tournament-organizer?style=flat-square)](https://github.com/slashinfty/tournament-organizer/blob/main/LICENSE) [![Ko-Fi](https://img.shields.io/badge/Ko--Fi-Buy%20Me%20a%20Coffee-a87b00)](https://ko-fi.com/mattbraddock)

### About
This JavaScript module for Node.js facilitates the organization and execution of tournaments.

Tournaments can be paired by single elimination, double elimination, round-robin, double round-robin, and Swiss.

If round-robin, double round-robin, or Swiss are chosen, then a single elimination or double elimination playoffs can follow.

For non-elimination tournaments, the following tiebreakers systems are supported:
* Solkoff
* Median-Buchholz
* Sonneborn-Berger
* Cumulative
* Versus
* Opponent's match win percentage
* Game win percentage
* Opponent's game win percentage
* Opponent's opponent's match win percentage

### A Couple Details
For double elimination, the method in which players move to the loser's bracket follows the same four alternating orders as explained [here](https://blog.smash.gg/changes-in-the-world-of-brackets-695ecb777a4c).

For round-robin (and double round-robin), players are paired via [Berger Tables](https://en.wikipedia.org/wiki/Round-robin_tournament#Berger_tables).

## Installation
```shell
npm install tournament-organizer
```

## Basic Usage
```js
import TournamentOrganizer from 'tournament-organizer';

// Create an event manager

const manager = new TournamentOrganizer();

// Create a tournament
// First parameter can be set to a custom ID
// More options are available to set

const tourney = manager.createTournament(null, {
    name: 'My Example Tournament',
    format: 'swiss',
    playoffs: 'elim',
    cutLimit: 8,
    bestOf: 3,
    winValue: 3,
    drawValue: 1,
    tiebreakers: ['magic-tcg']
});

// Add players

tourney.addPlayer('Liam S');
tourney.addPlayer('Emma P.');
tourney.addPlayer('Noah B.');
tourney.addPlayer('Sophia R.');
// As many as desired

// Start the tournament

tourney.startEvent();

// Get all active matches

const active = tourney.activeMatches();

// Record a result

tourney.result(active[0], 2, 1);

// Get standings

const standings = tourney.standings();
```

## Implementations
* [Bracketeer](https://slashinfty.github.io/bracketeer) - A Discord bot that runs tournaments
* [Song Tournament](https://songtournament.netlify.app/) - Create elimination brackets for your Spotify playlists

## Contributing
Please submit an issue if you encounter a bug or have a feature suggestion.

If you are interested, please feel free to fork and clone the repository (on main branch), then submit a pull request.

I am a high school teacher, and would appreciate any and all support in continuing this project.
