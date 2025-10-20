import { LoadableTournamentValues } from '../interfaces/LoadableTournamentValues.js';
import { SettableTournamentValues } from '../interfaces/SettableTournamentValues.js';
import { Tournament } from './Tournament.js';
/**
 * Class representing a tournament manager.
 */
export declare class Manager {
    /** Array of all tournaments being managed. */
    private tournaments;
    /** Create a tournament manager. */
    constructor();
    /**
     * @returns An array of tournaments being managed
     */
    getTournaments(): Array<Tournament>;
    /**
     * @param id The ID of a tournament
     * @returns The tournament with the corresponding ID
     */
    getTournament(id: string): Tournament;
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
    loadTournament(tourney: LoadableTournamentValues): Tournament;
    /**
     * Remove a tournament from the manager.
     *
     * Throws an error if no tournament has the specified ID.
     * @param id ID of the tournament to be removed
     * @returns The removed tournament
     */
    removeTournament(id: string): Tournament;
}
