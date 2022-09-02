## Tournament Organizer
A Node.js module for organizing tournaments, written in TypeScript.

If you are upgrading from v1.X to v2.X, it is strongly recommended you read the [documentation](#Documentation), as a lot has changed.

[![npm](https://img.shields.io/npm/v/tournament-organizer?style=flat-square)](https://npmjs.org/package/tournament-organizer) [![GitHub last commit](https://img.shields.io/github/last-commit/slashinfty/tournament-organizer?style=flat-square)](https://github.com/slashinfty/tournament-organizer/commits/main) [![GitHub issues](https://img.shields.io/github/issues-raw/slashinfty/tournament-organizer?style=flat-square)](https://github.com/slashinfty/tournament-organizer/issues) [![GitHub pull requests](https://img.shields.io/github/issues-pr-raw/slashinfty/tournament-organizer?style=flat-square)](https://github.com/slashinfty/tournament-organizer/pulls) [![GitHub](https://img.shields.io/github/license/slashinfty/tournament-organizer?style=flat-square)](https://github.com/slashinfty/tournament-organizer/blob/main/LICENSE) [![Ko-Fi](https://img.shields.io/badge/Ko--Fi-Buy%20Me%20a%20Coffee-a87b00)](https://ko-fi.com/mattbraddock)

If you are only interested in creating tournament pairings, check out [`tournament-pairings`](https://github.com/slashinfty/tournament-pairings).

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
For double elimination, the method in which players move to the loser's bracket follows the same four alternating orders shown [here](https://miro.medium.com/max/1400/1*p9OYmhVdnAAMiHo_OM4PjQ.png) to avoid rematches.

For round-robin (and double round-robin), players are paired via [Berger Tables](https://en.wikipedia.org/wiki/Round-robin_tournament#Berger_tables).

Swiss pairings are generated using a weighted [Blossom Algorithm](https://brilliant.org/wiki/blossom-algorithm/) with maximum cardinality.

## Installation
```shell
npm i tournament-organizer
```

## Documentation
To see all methods and properties, please visit the [Wiki](https://github.com/slashinfty/tournament-organizer/wiki).

## Implementations
* [Bracketeer](https://slashinfty.github.io/bracketeer) - A Discord bot that runs tournaments
* [Song Tournament](https://songtournament.netlify.app/) - Create elimination brackets for your Spotify playlists

## Contributing
Please submit an issue if you encounter a bug or have a feature suggestion.

If you are interested in contributing, please feel free to fork and clone the repository (on main branch), then submit a pull request.

I am a high school teacher, and would appreciate any and all support in continuing this project.