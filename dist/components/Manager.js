import { Match } from './Match.js';
import { Tournament } from './Tournament.js';
/**
 * Class representing a tournament manager.
 */
export class Manager {
    /** Array of all tournaments being managed. */
    tournaments;
    /** Create a tournament manager. */
    constructor() {
        this.tournaments = [];
    }
    /**
     * @returns An array of tournaments being managed
     */
    getTournaments() {
        return this.tournaments;
    }
    /**
     * @param id The ID of a tournament
     * @returns The tournament with the corresponding ID
     */
    getTournament(id) {
        const tournament = this.tournaments.find(t => t.getId() === id);
        if (tournament === undefined) {
            throw new Error(`No tournament with ID ${id} exists`);
        }
        return tournament;
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
    createTournament(name, settings = {}, id = undefined) {
        let ID = id;
        if (ID === undefined) {
            do {
                ID = crypto.randomUUID();
            } while (this.tournaments.some(t => t.getId() === ID));
        }
        else {
            if (this.tournaments.some(t => t.getId() === ID)) {
                throw new Error(`Tournament with ID ${ID} already exists`);
            }
        }
        const tournament = new Tournament(ID, name);
        tournament.set(settings);
        this.tournaments.push(tournament);
        return tournament;
    }
    /**
     * Reload an object representing a tournament.
     * @param tourney Plain object of a tournament
     * @returns The newly reloaded tournament
     */
    loadTournament(tourney) {
        const tournament = new Tournament(tourney.id, tourney.name);
        tournament.set({
            round: tourney.round,
            sorting: tourney.sorting,
            seating: tourney.seating,
            scoring: tourney.scoring,
            stageOne: tourney.stageOne,
            stageTwo: tourney.stageTwo,
            meta: tourney.meta
        });
        tourney.players.forEach(player => {
            const newPlayer = tournament.createPlayer(player.name, player.id);
            newPlayer.set({
                active: player.active,
                value: player.value,
                matches: player.matches,
                meta: player.meta
            });
        });
        const newMatches = [];
        tourney.matches.forEach(match => {
            const newMatch = new Match(match.id, match.round, match.match);
            newMatch.set({
                active: match.active,
                bye: match.bye,
                player1: match.player1,
                player2: match.player2,
                path: match.path,
                meta: match.meta
            });
            newMatches.push(newMatch);
        });
        tournament.set({
            matches: newMatches,
            status: tourney.status
        });
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
    removeTournament(id) {
        const tournament = this.getTournament(id);
        tournament.endTournament();
        this.tournaments.splice(this.tournaments.findIndex(t => t.getId() === tournament.getId()), 1);
        return tournament;
    }
}
//# sourceMappingURL=Manager.js.map