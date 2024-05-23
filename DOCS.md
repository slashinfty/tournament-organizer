A Node.js [ESM module](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c) for organizing tournaments, written in TypeScript.

## Installation
```shell
npm i tournament-organizer
```

### Importing
In Node.js:
```ts
import TournamentOrganizer from 'tournament-organizer';
```

In the browser:
```js
import TournamentOrganizer from "https://unpkg.com/tournament-organizer/dist/index.module.js";
```

The following imports are also available:
```ts
import {
    Match,
    Player,
    Tournament
} from 'tournament-organizer/components';

import {
    MatchValues,
    PlayerValues,
    SettableMatchValues,
    SettablePlayerValues,
    SettableTournamentValues,
    StandingsValues,
    TournamentValues
} from 'tournament-organizer/interfaces';
```

## About
For more information, visit the [repository](https://github.com/slashinfty/tournament-organizer).