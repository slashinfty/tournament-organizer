import cryptoRandomString from 'crypto-random-string';
import * as Tournament from './Tournament';

/** Class representing an event manager. */
export class Manager {
    /** Array of tournaments being managed. */
    tournaments: Array<Tournament.Structure>;
    
    constructor() {
        this.tournaments = [];
    }

    /**
     * Create a new tournament.
     * @param options User-defined options for a new tournament.
     * @returns New tournament.
     */
    newTournament(opt?: object): Tournament.Structure {
        
        // Default values
        let options = Object.assign({
            id: cryptoRandomString({length: 10, type: 'alphanumeric'}),
            name: 'New Tournament',
            format: 'Single Elimination'
        }, opt === undefined ? {} : opt);
        
        // No duplicate IDs
        while (this.tournaments.some(tournament => tournament.id === options.id)) {
            options.id = cryptoRandomString({length: 10, type: 'alphanumeric'});
        }
        
        // Create tournament
        let tournament;
        // TODO
        
        // Add tournament to list
        this.tournaments.push(tournament);
        
        return tournament;
    }

    /**
     * Reload a saved tournament.
     * @param tournament The tournament to be reloaded.
     * @returns The reloaded tournament.
     */
    loadTournament(tournament: Object): Tournament.Structure {
        //TODO
    }

    /**
     * Remove a tournament from the manager.
     * @param id ID of the tournament to be removed.
     * @returns The deleted tournament.
     */
    deleteTournament(id: string): Tournament.Structure {
        
        // Find tournament
        const index = this.tournaments.findIndex(t => t.id === id);
        
        // Delete tournament (if found)
        if (index > -1) {
            const tournament = this.tournaments[index];
            
            // If active, end the tournament
            // TODO
            
            // Remove the tournament from the list
            this.tournaments.splice(index, 1);
            return tournament;
        } else {
            throw `Tournament with ID ${id} was not found.`;
        }
    }
}
