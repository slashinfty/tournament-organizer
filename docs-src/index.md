An ES module for organizing tournaments, written in TypeScript.

## Quick Links
- Installation
- Walkthrough Guide

## About
Tournaments can be paired by single elimination, double elimination, stepladder, round-robin, double round-robin, and Swiss. Playoffs can be paired by single elimination, double elimination, and stepladder.

Details on the pairing algorithms can be found in the [`tournament-pairings`](https://github.com/slashinfty/tournament-pairings#algorithms) readme.

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

## Contributing
Source code is available on [GitHub](https://github.com/slashinfty/tournament-organizer).

Please submit an issue if you encounter a bug or have a feature suggestion.

If you are interested in contributing, please feel free to fork and clone the repository, then submit a pull request.