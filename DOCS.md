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
* throws an error if `id` is specified and already exists

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
* throws an error if no player has an ID equaling `id`
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
result(
    id: string,
    player1Wins: number,
    player2Wins: number,
    draws: number = 0,
    bye: boolean = false
): void
```
* updates the result of a match
---
```ts
standings(
    activeOnly: boolean = true
): Array<StandingsValues>
```
* computes tiebreakers for all players
* returns an array of players with scores and tiebreaker values
---
## `Player` Class

### Properties

### Setter

### Methods

## `Match` Class

### Properties

### Setter

### Methods

## Interfaces

### `SettableTournamentValues`

### `SettablePlayerValues`

### `SettableMatchValues`

### `StandingsValues`