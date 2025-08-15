All methods require `type: "module"` as this package is an ECMAScript module.

## Using Node.js
Installation:
```shell
npm i tournament-organizer
```

Importing:
```ts
import TournamentOrganizer from 'tournament-organizer';
```

## Using a CDN
Importing:
```js
import TournamentOrganizer from "https://cdn.jsdelivr.net/npm/tournament-organizer/dist/index.js";
```

## Additional Imports
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