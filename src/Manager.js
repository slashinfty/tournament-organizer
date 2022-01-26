import cryptoRandomString from 'crypto-random-string';
import { Tournament } from './Tournament';

/** Class representing an event manager. */
export class EventManager {
    /**
     * Create an event manager.
     */
    constructor() {
        /**
         * Array of all tournaments being managed.
         * @type {Array.<Tournament>}
         */
        this.tournaments = [];
    }

    /**
     * Create a new tournament.
     * @param {?String} [id=null] User-defined ID.
     * @param {Object} [options={}] Options a user can define for a tournament.
     * @return {Tournament} The newly created tournament.
     */
    createTournament(options?: object) {
        
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

    reloadTournament(tournament) {
        let reloadedTournament;
        if (tournament.format === 'swiss') reloadedTournament = new Tournament.SwissReloaded(tournament);
        else if (tournament.format === 'robin') reloadedTournament = new Tournament.RoundRobinReloaded(tournament);
        else reloadedTournament = new Tournament.EliminationReloaded(tournament);
        return reloadedTournament;
    }

    /**
     * Remove an existing tournament from the manager.
     * @param {Tournament} tournament The tournament to be removed.
     * @return {Boolean} If the tournament was removed.
     */
    removeTournament(tournament) {
        const index = this.tournaments.findIndex(t => t.eventID === tournament.eventID);
        if (index > -1) {
            this.tournaments.splice(index, 1);
            return true;
        } else return false;
    }
}

module.exports = EventManager;
