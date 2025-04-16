import randomstring from 'randomstring';
import { LoadableTournamentValues } from '../interfaces/LoadableTournamentValues.js';
import { Match } from './Match.js';
import { Tournament } from './Tournament.js';
import { SettableTournamentValues } from '../interfaces/SettableTournamentValues.js';

/** 
 * Class representing a tournament manager.
 */
export class Manager {
    /** Array of all tournaments being managed. */
    tournaments: Array<Tournament>;

    /** Create a tournament manager. */
    constructor() {
        this.tournaments = [];
    }

    /**
     * Create a new tournament.
     * 
     * Throws an error if ID is specified and already exists.
     * @param name Name of the tournament
     * @param settings Settings of the tournament
     * @param id ID of the tournament (randomly assigned if omitted)
     * @returns The newly created tournament
     */
    createTournament(name: string, settings: SettableTournamentValues = {}, id: string | undefined = undefined): Tournament {
        let ID = id;
        if (ID === undefined) {
            do {
                ID = randomstring.generate({
                    length: 12,
                    charset: 'alphanumeric'
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
     * Reload an object representing a tournament.
     * @param tourney Plain object of a tournament
     * @returns The newly reloaded tournament
     */
    reloadTournament(tourney: LoadableTournamentValues): Tournament {
        const tournament = new Tournament(tourney.id, tourney.name);
        tournament.settings = {
            round: tourney.round,
            sorting: tourney.sorting,
            seating: tourney.seating,
            scoring: tourney.scoring,
            stageOne: tourney.stageOne,
            stageTwo: tourney.stageTwo,
            meta: tourney.meta
        };
        tourney.players.forEach(player => {
            const newPlayer = tournament.createPlayer(player.name, player.id);
            newPlayer.values = {
                active: player.active,
                value: player.value,
                matches: player.matches,
                meta: player.meta
            }
        });
        tourney.matches.forEach(match => {
            const newMatch = new Match(match.id, match.round, match.match);
            newMatch.values = {
                active: match.active,
                bye: match.bye,
                player1: match.player1,
                player2: match.player2,
                path: match.path,
                meta: match.meta
            }
            tournament.matches.push(newMatch);
        });
        tournament.settings = {
            status: tourney.status
        };
        this.tournaments.push(tournament);
        return tournament;
    }

    /**
     * Remove a tournament from the manager.
     * 
     * Throws an error if no tournament has the specified ID.
     * @param id ID of the tournament to be removed
     * @returns The removed tournament
     */
    removeTournament(id: string): Tournament {
        const tournament = this.tournaments.find(t => t.id === id);
        if (tournament === undefined) {
            throw `No tournament with ID ${id} exists`;
        }
        tournament.end();
        this.tournaments.splice(this.tournaments.findIndex(t => t.id === tournament.id), 1);
        return tournament;
    }
}
