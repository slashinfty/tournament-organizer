import cryptoRandomString from 'crypto-random-string';
import * as Tournament from './Tournament.js';

/** Class representing an event manager. */
export class Manager {

    /** Array of tournaments being managed. */
    tournaments: Array<Tournament.Elimination | Tournament.Swiss | Tournament.RoundRobin>;
    
    constructor() {
        this.tournaments = [];
    }

    /**
     * Create a new tournament.
     * @param options User-defined options for a new tournament.
     * @returns New tournament.
     */
    newTournament(opt?: object): Tournament.Elimination | Tournament.Swiss | Tournament.RoundRobin {

        let defaults: {
            id: string,
            name: string,
            format: 'single elimination' | 'double elimination' | 'swiss' | 'round robin' | 'double round robin'
        } = {
            id: cryptoRandomString({length: 10, type: 'alphanumeric'}),
            name: 'New Tournament',
            format: 'single elimination'
        }
        
        // Default values
        let options: Tournament.BasicTournamentProperties = Object.assign(defaults, opt === undefined ? {} : opt);
        
        // No duplicate IDs
        while (this.tournaments.some(tournament => tournament.id === options.id)) {
            options.id = cryptoRandomString({length: 10, type: 'alphanumeric'});
        }
        
        // Create tournament
        let tournament: Tournament.Elimination | Tournament.Swiss | Tournament.RoundRobin;
        switch (options.format) {
            case 'single elimination':
                tournament = new Tournament.Elimination(options);
                break;
            case 'double elimination':
                options = Object.assign({
                    double: true
                }, options);
                tournament = new Tournament.Elimination(options);
                break;
            case 'swiss':
                tournament = new Tournament.Swiss(options);
                break;
            case 'round robin':
                tournament = new Tournament.RoundRobin(options);
                break;
            case 'double round robin':
                options = Object.assign({
                    double: true
                }, options);
                tournament = new Tournament.RoundRobin(options);
                break;
        }
        
        // Add tournament to list
        this.tournaments.push(tournament);
        
        return tournament;
    }

    /**
     * Reload a saved tournament.
     * @param tournament The tournament (object) to be reloaded.
     * @returns The reloaded tournament.
     */
    loadTournament(tournament: Tournament.Structure): Tournament.Elimination | Tournament.Swiss | Tournament.RoundRobin {
        
        // No loading a tournament already in the manager
        if (this.tournaments.some(t => t.id === tournament.id)) {
            throw `Tournament with ID ${tournament.id} already exists.`;
        }

        // Create tournament
        let loadedTournament: Tournament.Elimination | Tournament.Swiss | Tournament.RoundRobin;
        switch (tournament.format) {
            case 'single elimination':
                loadedTournament = new Tournament.Elimination(tournament);
                break;
            case 'swiss':
                loadedTournament = new Tournament.Swiss(tournament);
                break;
            case 'round robin':
            case 'double round robin':
                loadedTournament = new Tournament.RoundRobin(tournament);
                break;
        }

        // Copy over all data
        Object.assign(loadedTournament, tournament);

        // Add tournament to list
        this.tournaments.push(loadedTournament);
        
        return loadedTournament;
    }

    /**
     * Remove a tournament from the manager.
     * @param id ID of the tournament to be removed.
     * @returns The deleted tournament.
     */
    deleteTournament(id: string): Tournament.Elimination | Tournament.Swiss | Tournament.RoundRobin {
        
        // Find tournament
        const index = this.tournaments.findIndex(t => t.id === id);
        if (index === -1) {
            throw `Tournament with ID ${id} was not found.`;
        }
        const tournament = this.tournaments[index];
            
        // If active, end the tournament
        if (tournament.status !== 'finished') tournament.status = 'aborted';
        
        // Remove the tournament from the list
        this.tournaments.splice(index, 1);
        return tournament;
    }
}
