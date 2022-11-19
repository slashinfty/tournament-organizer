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

* `tournaments: Array<Tournament>`
    * an array of all tournaments

### Methods

* `createTournament(name: string, settings: SettableTournamentValues = {}, id: string | undefined = undefined): Tournament` 
    * creates a new tournament and returns it
    * throws an error if `id` is specified and already exists

## `Tournament` Class

### Properties

### Setter

### Methods

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