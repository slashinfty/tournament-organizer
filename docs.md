An Node.js package for organizing tournaments, written in TypeScript.

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

## Details
Tournament format options include:
* Single elimination
* Double elimination
* Stepladder
* Round-Robin
* Double Round-Robin
* Swiss

Elimination playoffs can be implemented if using a non-elimination format for the tournament.

Details on the pairing algorithms can be found in the [`tournament-pairings`](https://github.com/slashinfty/tournament-pairings#algorithms) readme.

The following tiebreakers are supported:
* Solkoff
    * Sum of opponents' match points
* Median-Buchholz
    * Sum of opponents' match points, excluding the maximum and minimum point totals
* Sonneborn-Berger
    * Sum of defeated opponents' match points and half the sum of drawn opponents' match points
* Koya System
    * Match points versus opponents who have at least half the maximum number of match points
* Cumulative
    * Sum of a player's running match points (progressive)
    * Includes a second tiebreaker of the sum of opponents' cumulative scores
* Earned Wins
    * Number of match wins earned against opponents
* Earned Losses
    * Number of match losses earned against opponents
* Neighboring Points
    * Match points versus opponents with match points equal to the player's total match points
* Versus
    * Records versus opponents who are tied with the player
* Mutual Versus
    * Records versus mutual opponents of opponents who are tied with the player
* Opponents' Match Win Percentage
    * Mean match win percentage of opponents
* Game Win Percentage
    * Percentage of individual games won
* Opponents' Game Win Percentage
    * Mean game win percentage of opponents
* Opponents' Opponents' Match Win Percentage
    * Mean match win percentage of the opponents of all opponents

Source code is available on [GitHub](https://github.com/slashinfty/tournament-organizer).