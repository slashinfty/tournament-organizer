import { expect } from "chai";
import { Manager } from '../src/components/Manager';
import { Tournament } from "../src/components/Tournament";
import { LoadableTournamentValues } from "../src/interfaces/LoadableTournamentValues";

describe('Manager class', () => {
    let manager: Manager;
    beforeEach(() => manager = new Manager());

    it('createTournament method', () => {
        const defaultTournament = manager.createTournament('Default Tournament');

        // defaultTournament is a Tournament
        expect(defaultTournament).to.be.an.instanceOf(Tournament, 'Created tournament is not a Tournament');

        // defaultTournament has the default values
        expect(defaultTournament.getValues()).to.deep.include({
            name: 'Default Tournament',
            status: 'setup',
            round: 0,
            players: [],
            matches: [],
            seating: false,
            sorting: 'none',
            scoring: {
                bestOf: 1,
                win: 1,
                draw: 0.5,
                loss: 0,
                bye: 1,
                tiebreaks: []
            },
            stageOne: {
                format: 'single-elimination',
                consolation: false,
                rounds: 0,
                initialRound: 1,
                maxPlayers: 0
            },
            stageTwo: {
                format: null,
                consolation: false,
                advance: {
                    value: 0,
                    method: 'all'
                }
            },
            meta: {}
        }, 'Default tournament settings do not match');

        const customTournament = manager.createTournament('Custom Tournament', {
            seating: true,
            sorting: 'ascending',
            scoring: {
                bestOf: 3,
                win: 3,
                draw: 1,
                bye: 3,
                tiebreaks: ['opponent match win percentage', 'versus']
            },
            stageOne: {
                format: 'swiss',
                maxPlayers: 64
            },
            stageTwo: {
                format: 'single-elimination',
                consolation: true,
                advance: {
                    value: 8,
                    method: 'rank'
                }
            }
        });

        // customTournament has the values passed at creation
        expect(customTournament.getValues()).to.deep.include({
            name: 'Custom Tournament',
            status: 'setup',
            round: 0,
            players: [],
            matches: [],
            seating: true,
            sorting: 'ascending',
            scoring: {
                bestOf: 3,
                win: 3,
                draw: 1,
                loss: 0,
                bye: 3,
                tiebreaks: ['opponent match win percentage', 'versus']
            },
            stageOne: {
                format: 'swiss',
                consolation: false,
                rounds: 0,
                initialRound: 1,
                maxPlayers: 64
            },
            stageTwo: {
                format: 'single-elimination',
                consolation: true,
                advance: {
                    value: 8,
                    method: 'rank'
                }
            },
            meta: {}
        }, 'Custom settings not applied when creating a tournament');
        
        // error thrown when creating a tournament with a duplicate ID
        expect(() => manager.createTournament('Duplicate Tournament', {}, defaultTournament.getId()), 'Duplicate tournament created').to.throw();
    });

    it('getTournament method', () => {
        const defaultTournament = manager.createTournament('Default Tournament');
        const foundTournament = manager.getTournament(defaultTournament.getId());

        // foundTournament is defaultTournament
        expect(foundTournament.getValues()).to.deep.equal(defaultTournament.getValues(), 'Found tournament does not match');

        // error thrown when no tournament exists
        expect(() => manager.getTournament(''), 'No error on missing tournament').to.throw();
    });

    it('loadTournament method', () => {
        let tournamentValues: LoadableTournamentValues = {
            "id": "C3H7qtMqqRpD",
            "name": "Default Tournament",
            "status": "setup",
            "round": 0,
            "players": [],
            "matches": [],
            "seating": false,
            "sorting": "none",
            "scoring": {
                "bestOf": 1,
                "win": 1,
                "draw": 0.5,
                "loss": 0,
                "bye": 1,
                "tiebreaks": []
            },
            "stageOne": {
                "format": "single-elimination",
                "consolation": false,
                "rounds": 0,
                "initialRound": 1,
                "maxPlayers": 0
            },
            "stageTwo": {
                "format": null,
                "consolation": false,
                "advance": {
                    "value": 0,
                    "method": "all"
                }
            },
            "meta": {}
        }

        let loadedTournament = manager.loadTournament(tournamentValues);

        // basic loading of a tournament
        expect(loadedTournament.getValues()).to.deep.include(tournamentValues, 'Loaded default tournament settings not applied');

        tournamentValues = {
            "id": "8MCC89WFJjLO",
            "name": "Default Tournament",
            "status": "stage-one",
            "round": 1,
            "players": [
                {
                    "id": "ZfwWj7LElTx6",
                    "name": "Player 1",
                    "active": true,
                    "value": 0,
                    "matches": [
                        {
                            "pairUpDown": false,
                            "seating": -1,
                            "bye": false,
                            "win": 0,
                            "loss": 0,
                            "draw": 0,
                            "id": "CaNJgse25EEP",
                            "opponent": "z2DclIRCZ9f4"
                        }
                    ],
                    "meta": {}
                },
                {
                    "id": "wfziplzZNaqV",
                    "name": "Player 2",
                    "active": true,
                    "value": 0,
                    "matches": [
                        {
                            "pairUpDown": false,
                            "seating": -1,
                            "bye": false,
                            "win": 0,
                            "loss": 0,
                            "draw": 0,
                            "id": "x2OM4azL7fKM",
                            "opponent": "z62IkZmfu3yK"
                        }
                    ],
                    "meta": {}
                },
                {
                    "id": "z62IkZmfu3yK",
                    "name": "Player 3",
                    "active": true,
                    "value": 0,
                    "matches": [
                        {
                            "pairUpDown": false,
                            "seating": 1,
                            "bye": false,
                            "win": 0,
                            "loss": 0,
                            "draw": 0,
                            "id": "x2OM4azL7fKM",
                            "opponent": "wfziplzZNaqV"
                        }
                    ],
                    "meta": {}
                },
                {
                    "id": "z2DclIRCZ9f4",
                    "name": "Player 4",
                    "active": true,
                    "value": 0,
                    "matches": [
                        {
                            "pairUpDown": false,
                            "seating": 1,
                            "bye": false,
                            "win": 0,
                            "loss": 0,
                            "draw": 0,
                            "id": "CaNJgse25EEP",
                            "opponent": "ZfwWj7LElTx6"
                        }
                    ],
                    "meta": {}
                }
            ],
            "matches": [
                {
                    "id": "x2OM4azL7fKM",
                    "round": 1,
                    "match": 1,
                    "active": true,
                    "bye": false,
                    "loss": false,
                    "player1": {
                        "id": "z62IkZmfu3yK",
                        "win": 0,
                        "loss": 0,
                        "draw": 0
                    },
                    "player2": {
                        "id": "wfziplzZNaqV",
                        "win": 0,
                        "loss": 0,
                        "draw": 0
                    },
                    "path": {
                        "win": null,
                        "loss": null
                    },
                    "meta": {}
                },
                {
                    "id": "CaNJgse25EEP",
                    "round": 1,
                    "match": 2,
                    "active": true,
                    "bye": false,
                    "loss": false,
                    "player1": {
                        "id": "z2DclIRCZ9f4",
                        "win": 0,
                        "loss": 0,
                        "draw": 0
                    },
                    "player2": {
                        "id": "ZfwWj7LElTx6",
                        "win": 0,
                        "loss": 0,
                        "draw": 0
                    },
                    "path": {
                        "win": null,
                        "loss": null
                    },
                    "meta": {}
                }
            ],
            "seating": true,
            "sorting": "ascending",
            "scoring": {
                "bestOf": 3,
                "win": 3,
                "draw": 1,
                "loss": 0,
                "bye": 3,
                "tiebreaks": [
                    "cumulative",
                    "versus"
                ]
            },
            "stageOne": {
                "format": "swiss",
                "consolation": false,
                "rounds": 2,
                "initialRound": 1,
                "maxPlayers": 64
            },
            "stageTwo": {
                "format": "single-elimination",
                "consolation": true,
                "advance": {
                    "value": 8,
                    "method": "rank"
                }
            },
            "meta": {}
        }

        loadedTournament = manager.loadTournament(tournamentValues);

        // more complex loading of a tournament
        expect(loadedTournament.getValues()).to.deep.include(tournamentValues, 'Loaded custom tournament settings not applied');
    });

    it('removeTournament method', () => {
        const defaultTournament = manager.createTournament('Default Tournament');
        const secondTournament = manager.createTournament('Second Tournament');

        const removedTournament = manager.removeTournament(secondTournament.getId());

        // removed tournament is complete
        expect(removedTournament.getStatus()).to.equal('complete', 'Removed tournament is not complete');

        // only one tournament remaining
        expect(manager.getTournaments().length).to.equal(1, 'Removed tournament still in Tournaments array');
    });
});