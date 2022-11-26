# Documentation for tournament-organizer

This is an ESM module. More information is [here](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c).

## Installation

```shell
npm i tournament-organizer
```

## Importing

```ts
import TournamentOrganizer from 'tournament-organizer';

const Manager = new TournamentOrganizer();
```

## `Manager` Class

### Properties

```ts
tournaments: Array<Tournament>
```
* an array of all tournaments
---
### Methods

```ts
createTournament(
    name: string, 
    settings: SettableTournamentValues = {}, 
    id: string | undefined = undefined
): Tournament
```
* creates a new tournament and returns it
* see [Interfaces](#interfaces) for details about `SettableTournamentValues`
* throws an error if `id` is specified and already exists
---
```ts
reloadTournament(
    tourney: TournamentValues
): Tournament
```
* takes a saved tournament object, and returns a proper `Tournament` class instance
---
## `Tournament` Class

### Properties

```ts
id: string
```
* unique ID of the tournament
---
```ts
name: string
```
* name of the tournament
---
```ts
status: 'setup' | 'stage-one' | 'stage-two' | 'complete'
```
* current state of the tournament
* initialized as `'setup'`
---
```ts
round: number
```
* current round of the tournament
* initialized as `0`
---
```ts
players: Array<Player>
```
* array of all players in the tournament
* initialized as `[]`
---
```ts
matches: Array<Match>
```
* array of all matches in the tournament
* initialized as `[]`
---
```ts
sorting: 'ascending' | 'descending' | 'none'
```
* sorting method, if players are rated/seeded
* initialized as `'none'`
---
```ts
scoring: {
    bestOf: number,
    win: number,
    draw: number,
    loss: number,
    bye: number,
    tiebreaks: Array<
        'median buchholz' |
        'solkoff' |
        'sonneborn berger' |
        'cumulative' |
        'versus' |
        'game win percentage' |
        'opponent game win percentage' |
        'opponent match win percentage' |
        'opponent opponent match win percentage'
    >
}
```
* details about scoring, including point values for different outcomes and a sorted list of tiebreakers
* initialized as:
```ts
{
    bestOf: 1,
    win: 1,
    draw: 0.5,
    loss: 0,
    bye: 1,
    tiebreaks: []
}
```
---
```ts
stageOne: {
    format: 'single-elimination' | 'double-elimination' | 'stepladder' | 'swiss' | 'round-robin' | 'double-round-robin',
    consolation: boolean,
    rounds: number,
    maxPlayers: number
}
```
* details about the first stage of the tournament
* `consolation` determines if there is a third place match, if the format is single elimination
* if `maxPlayers` equals zero, then there is no limit
* initialized as:
```ts
{
    format: 'single-elimination',
    consolation: false,
    rounds: 0,
    maxPlayers: 0
}
```
---
```ts
stageTwo: {
    format: 'single-elimination' | 'double-elimination' | 'stepladder' | null,
    consolation: boolean,
    advance: {
        value: number,
        method: 'points' | 'rank'
    }
}
```
* details about the second stage of the tournament
* `consolation` determines if there is a third place match, if the format is single elimination
* `advance` determines how many players qualify for the second stage (greater than or equal for `points`, and less than or equal for `rank`)
* initialized as:
```ts
{
    format: null,
    consolation: false,
    advance: {
        value: 0,
        method: 'rank'
    }
}
```
---
### Setter

```ts
settings = options: SettableTournamentValues
```
* only needs to contain properties that are changing
* see [Interfaces](#interfaces) for details about `SettableTournamentValues`
---
### Methods

```ts
createPlayer(
    name: string,
    id: string | undefined = undefined
): Player
```
* creates a new player and returns it
* throws an error if `id` is specified and already exists, or if the specified maximum number of players has been reached
---
```ts
removePlayer(
    id: string
): void
```
* removes a player from the tournament
* throws an error if no player has the `id` specified or if the player is already inactive
* in active elimination and stepladder formats, adjusts paths for any matches that interact with the match the player is in
* in active round-robin formats, replaces the player in all future matches with a bye
---
```ts
start(): void
```
* starts the tournament
* throws an error if there are an insufficient number of players (4 for elimination, 2 for all other formats)
---
```ts
next(): void
```
* progresses the tournament to the next round
* throws an error if there are active matches, if the tournament is not in the first stage, or if the format is elimination or stepladder
---
```ts
enterResult(
    id: string,
    player1Wins: number,
    player2Wins: number,
    draws: number = 0
): void
```
* updates the result of a match
* throws an error if no match has the `id` specified
* in elimination and stepladder formats, moves players to their appropriate next matches
---
```ts
clearResult(
    id: string
): void
```
* clears the results of a match
* throws an error if no match has the `id` specified or if the match is still active
* in elimination and stepladder formats, it reverses the progression of players in the bracket
---
```ts
standings(
    activeOnly: boolean = true
): Array<StandingsValues>
```
* computes tiebreakers for all players
* returns an array of players with scores and tiebreaker values
* see [Interfaces](#interfaces) for details about `StandingsValues`
---
```ts
end(): void
```
* ends the tournament (sets `status` to `complete`) and marks all players and matches as inactive
---
## `Player` Class

### Properties
```ts
id: string
```
* unique identifier of the player
---
```ts
name: string
```
* name of the player
---
```ts
active: boolean
```
* if the player is active in the tournament
* initialized as `true`
---
```ts
value: number
```
* a value used for seeding, such as rank or rating
* initialized as `0`
---
```ts
matches: Array<{
    id: string,
    opponent: string | null,
    pairUpDown: boolean,
    bye: boolean,
    win: number,
    loss: number,
    draw: number
}>
```
* array of matches that the player is in
* contains information such as match ID, opponent ID, if the opponent has a different number of match points (in Swiss pairings), if the match is a bye, and the number of games won, lost, and drawn
* initialized as `[]`
---
### Setter

```ts
values = options: SettablePlayerValues
```
* only needs to contain properties that are changing
* see [Interfaces](#interfaces) for details about `SettablePlayerValues`
---
### Methods

```ts
addMatch(match: {
    id: string,
    opponent: string | null,
    pairUpDown: boolean,
    bye: boolean,
    win: number,
    loss: number,
    draw: number
}): void
```
* adds a match to the player
* throws an error if attempting to duplicate a match
---
```ts
removeMatch(
    id: string
): void
```
* removes a match from player history
* throws an error if the match doesn't exist in the array
---
```ts
updateMatch({
    id: string,
    values: {
        opponent?: string | null,
        pairUpDown?: boolean,
        bye?: boolean,
        win?: number,
        loss?: number,
        draw?: number
    }
}): void
```
* updates the details of a match
* throws an error if the match doesn't exist in the array
* only needs to contain properties that are changing
---
## `Match` Class

### Properties

```ts
id: string
```
* unique identifier of the match
---
```ts
round: number
```
* round number of the match
---
```ts
match: number
```
* match number of the match
---
```ts
active: boolean
```
* if the match is active in the tournament
* initialized as `false`
---
```ts
bye: boolean
```
* if the match is a bye
* initialized as `false`
---
```ts
player1: {
    id: string | null,
    win: number,
    loss: number,
    draw: number
}
```
* details about player one in the match
* includes the ID of the player and number wins, losses, and draws
* initialized as:
```ts
{
    id: null,
    win: 0,
    loss: 0,
    draw: 0
}
```
---
```ts
player2: {
    id: string | null,
    win: number,
    loss: number,
    draw: number
}
```
* details about player two in the match
* includes the ID of the player and number wins, losses, and draws
* initialized as:
```ts
{
    id: null,
    win: 0,
    loss: 0,
    draw: 0
}
```
---
```ts
path: {
    win: string | null,
    loss: string | null
}
```
* details about paths leaving this match
* each `win` and `loss` are either the ID of a match or `null`
* initialized as:
```ts
{
    win: null,
    loss: null
}
```
---
### Setter

```ts
values = options: SettableMatchValues
```
* only needs to contain properties that are changing
* see [Interfaces](#interfaces) for details about `SettableMatchValues`
---
## Interfaces

### `SettableTournamentValues`

```ts
{
    name?: string,
    status?: 'setup' | 'stage-one' | 'stage-two' | 'complete',
    round?: number,
    players?: Array<Player>,
    matches?: Array<Match>,
    sorting?: 'ascending' | 'descending' | 'none',
    scoring?: {
        bestOf?: number,
        win?: number,
        draw?: number,
        loss?: number,
        bye?: number,
        tiebreaks?: Array<
            'median buchholz' |
            'solkoff' |
            'sonneborn berger' |
            'cumulative' |
            'versus' |
            'game win percentage' |
            'opponent game win percentage' |
            'opponent match win percentage' |
            'opponent opponent match win percentage'
        >
    },
    stageOne?: {
        format?: 'single-elimination' | 'double-elimination' | 'stepladder' | 'swiss' | 'round-robin' | 'double-round-robin',
        consolation?: boolean,
        rounds?: number,
        maxPlayers?: number
    },
    stageTwo?: {
        format?: 'single-elimination' | 'double-elimination' | 'stepladder' | null,
        consolation?: boolean,
        advance?: {
            value?: number,
            method?: 'points' | 'rank'
        }
    }
}
```
---
### `SettablePlayerValues`

```ts
{
    name?: string,
    active?: boolean,
    value?: number,
    matches?: Array<{
        id: string,
        opponent: string | null,
        pairUpDown: boolean,
        bye: boolean,
        win: number,
        loss: number,
        draw: number
    }>
}
```
---
### `SettableMatchValues`

```ts
{
    round?: number,
    match?: number,
    active?: boolean,
    bye?: boolean,
    player1?: {
        id?: string | null,
        win?: number,
        loss?: number,
        draw?: number
    },
    player2?: {
        id?: string | null,
        win?: number,
        loss?: number,
        draw?: number
    },
    path?: {
        win?: string | null,
        loss?: string | null
    }
}
```
---
### `StandingsValues`

```ts
{
    player: Player,
    gamePoints: number,
    games: number,
    matchPoints: number,
    matches: number,
    tiebreaks: {
        medianBuchholz: number,
        solkoff: number,
        sonnebornBerger: number,
        cumulative: number,
        oppCumulative: number,
        matchWinPct: number,
        oppMatchWinPct: number,
        oppOppMatchWinPct: number,
        gameWinPct: number,
        oppGameWinPct: number
    } 
}
```