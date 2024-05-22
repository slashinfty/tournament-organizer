import { Tournament } from './Tournament.js';
import { SettableTournamentValues } from './interfaces/SettableTournamentValues.js';
import { TournamentValues } from './interfaces/TournamentValues.js';
/**
 * Class representing a tournament manager.
 */
export declare class Manager {
    /** Array of all tournaments being managed. */
    tournaments: Array<Tournament>;
    /** Create a tournament manager. */
    constructor();
    /**
     * Create a new tournament.
     *
     * Throws an error if ID is specified and already exists.
     * @param name Name of the tournament
     * @param settings Settings of the tournament
     * @param id ID of the tournament (randomly assigned if omitted)
     * @returns The newly created tournament
     */
    createTournament(name: string, settings?: SettableTournamentValues, id?: string | undefined): Tournament;
    /**
     * Reload an object representing a tournament.
     * @param tourney Plain object of a tournament
     * @returns The newly reloaded tournament
     */
    reloadTournament(tourney: TournamentValues): Tournament;
    /**
     * Remove a tournament from the manager.
     *
     * Throws an error if no tournament has the specified ID.
     * @param id ID of the tournament to be removed
     * @returns The removed tournament
     */
    removeTournament(id: string): Tournament;
}
