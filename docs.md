An Node.js package for organizing tournaments, written in TypeScript.

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

## Installation

All methods require `type: "module"` as this package is an ECMAScript module.

### Using Node.js
Installation:
```shell
npm i tournament-organizer
```

Importing:
```ts
import TournamentOrganizer from 'tournament-organizer';
```

### Using a CDN
Importing:
```js
import TournamentOrganizer from "https://cdn.jsdelivr.net/npm/tournament-organizer/dist/index.js";
```

### Additional Imports
By default, the above import statements import the `Manager` class. There are additional imports available:
```ts
import {
    Manager,
    Match,
    Player,
    Tournament
} from 'tournament-organizer/components';

import {
    ExportedTournamentValues,
    LoadableTournamentValues,
    MatchValues,
    PlayerValues,
    SettableMatchValues,
    SettablePlayerValues,
    SettableTournamentValues,
    StandingsValues,
    TournamentValues
} from 'tournament-organizer/interfaces';
```

## Contributing
Source code is available on [GitHub](https://github.com/slashinfty/tournament-organizer).

Please submit an issue if you encounter a bug or have a feature suggestion.

If you are interested in contributing, please feel free to fork and clone the repository, then submit a pull request.