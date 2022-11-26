import cryptoRandomString from 'crypto-random-string';
import { Match } from './Match.js';
import { Tournament } from './Tournament.js';
import { SettableTournamentValues } from './interfaces/SettableTournamentValues.js';
import { TournamentValues } from './interfaces/TournamentValues.js';

/** Class representing a tournament manager */
export class Manager {
    /** All tournaments being managed */
    tournaments: Array<Tournament>;

    /** Create a tournament manager */
    constructor() {
        this.tournaments = [];
    }

    /**
     * Create a new tournament
     * @param name Name of the tournament
     * @param settings Settings of the tournament
     * @param id ID of the tournament (randomly assigned if omitted)
     * @returns The newly created tournament
     */
    createTournament(name: string, settings: SettableTournamentValues = {}, id: string | undefined = undefined): Tournament {
        let ID = id;
        if (ID === undefined) {
            do {
                ID = cryptoRandomString({
                    length: 12,
                    type: 'base64'
                });
            } while (this.tournaments.some(t => t.id === ID));
        } else {
            if (this.tournaments.some(t => t.id === ID)) {
                throw `Tournament with ID ${ID} already exists`;
            }
        }
        const tournament = new Tournament(ID, name);
        tournament.settings = settings;
        this.tournaments.push(tournament);
        return tournament;
    }

    /**
     * Reload an object representing a tournament
     * @param tourney Plain object of a tournament
     * @returns The newly reloaded tournament
     */
    reloadTournament(tourney: TournamentValues): Tournament {
        const tournament = new Tournament(tourney.id, tourney.name);
        tournament.settings = {
            status: tourney.status,
            round: tourney.round,
            sorting: tourney.sorting,
            scoring: tourney.scoring,
            stageOne: tourney.stageOne,
            stageTwo: tourney.stageTwo
        };
        tourney.players.forEach(player => {
            const newPlayer = tournament.createPlayer(player.name, player.id);
            newPlayer.values = {
                active: player.active,
                value: player.value,
                matches: player.matches
            }
        });
        tourney.matches.forEach(match => {
            const newMatch = new Match(match.id, match.round, match.match);
            newMatch.values = {
                active: match.active,
                bye: match.bye,
                player1: match.player1,
                player2: match.player2,
                path: match.path
            }
            tournament.matches.push(newMatch);
        });
        return tournament;
    }

    // remove tournament
    removeTournament(id: string): Tournament {

        return;
    }
}