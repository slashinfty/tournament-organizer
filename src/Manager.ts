import cryptoRandomString from 'crypto-random-string';
import { Tournament } from './Tournament';

/** Class representing an event manager. */
export class EventManager {
    tournaments: Array<Tournament>;
    
    constructor() {
        this.tournaments = [];
    }

    /**
     * Create a new tournament.
     * @param options User-defined options for a new tournament.
     * @returns New tournament.
     */
    newTournament(options?: object): Tournament {
        
        // Default values
        let opt = Object.assign({
            id: cryptoRandomString({length: 10, type: 'alphanumeric'}),
            name: 'New Tournament',
            format: 'Single Elimination'
        }, options === undefined ? {} : options);
        
        // No duplicate IDs
        while (this.tournaments.some(tournament => tournament.id === opt.id) {
            opt.id = cryptoRandomString({length: 10, type: 'alphanumeric'});
        }
        
        // Create tournament
        let tournament;
        // TODO
        
        // Add tournament to list
        this.tournaments.push(tournament);
        
        return tournament;
    }

    // TODO
    loadTournament(tournament) {
        let reloadedTournament;
        if (tournament.format === 'swiss') reloadedTournament = new Tournament.SwissReloaded(tournament);
        else if (tournament.format === 'robin') reloadedTournament = new Tournament.RoundRobinReloaded(tournament);
        else reloadedTournament = new Tournament.EliminationReloaded(tournament);
        return reloadedTournament;
    }

    /**
     * Remove a tournament from the manager.
     * @param {Tournament} tournament The tournament to be removed.
     * @return {Boolean} If the tournament was removed.
     */
    deleteTournament(string: id): Tournament | undefined {
        
        // Find tournament
        const index = this.tournaments.findIndex(t => t.eventID === id);
        
        // Delete tournament (if found)
        if (index > -1) {
            const tournament = this.tournaments[index];
            
            // If active, end the tournament
            // TODO
            
            // Remove the tournament from the list
            this.tournaments.splice(index, 1);
            return tournament;
        } else return undefined;
    }
}
