## Tournament Organizer
A zero dependency module for organizing tournaments

<span style="color:red;font-weight:bold">This is a work in progress and is currently incomplete and nonfunctional</span>.

[![npm](https://img.shields.io/npm/v/tournament-organizer?style=flat-square)](https://npmjs.org/package/tournament-organizer) [![GitHub last commit](https://img.shields.io/github/last-commit/slashinfty/tournament-organizer?style=flat-square)](https://github.com/slashinfty/tournament-organizer/commits/main) [![GitHub issues](https://img.shields.io/github/issues-raw/slashinfty/tournament-organizer?style=flat-square)](https://github.com/slashinfty/tournament-organizer/issues) [![GitHub pull requests](https://img.shields.io/github/issues-pr-raw/slashinfty/tournament-organizer?style=flat-square)](https://github.com/slashinfty/tournament-organizer/pulls) [![GitHub](https://img.shields.io/github/license/slashinfty/tournament-organizer?style=flat-square)](https://github.com/slashinfty/tournament-organizer/blob/main/LICENSE) [![Ko-Fi](https://img.shields.io/badge/Ko--Fi-Buy%20Me%20a%20Coffee-a87b00)](https://ko-fi.com/mattbraddock)

### About
This JavaScript module for Node.js facilitates the organization and execution of tournaments.

Tournaments can be paired by single elimination, double elimination, round-robin, double round-robin, Swiss, and Dutch.

If round-robin, double round-robin, Swiss, or Dutch are chosen, then a single elimination or double elimination playoffs can follow.

For Swiss, Dutch, and round-robin tournaments, the following tiebreakers systems are supported:
* Buchholz Cut 1
* Solkoff (Buchholz)
* Median-Buchholz
* Sonneborn-Berger (Neustadtl)
* Baumbach (Most Wins)
* Cumulative (and Cumulative Opponent's)
* Versus
* Magic TCG
    * Opponent's match win percentage
    * Game win percentage
    * Opponent's game win percentage
* Pokemon TCG
    * Opponent's match win percentage
    * Opponent's opponent's match win percentage

## Installation
```shell
npm install tournament-organizer
```

## Basic Usage
TODO

## Implementations
TODO

## Contributing
Please only submit an issue if you encounter a bug or have a feature suggestion.

If you are interested, please feel free to fork and clone the repository (on main branch), then submit a pull request.

I am a high school teacher, and would appreciate any and all support in continuing this project.
