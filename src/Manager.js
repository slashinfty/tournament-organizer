'use strict';

const Tournament = require('./Tournament');
const Utilities = require('../lib/Utilities');

/** Class representing an event manager. */
class EventManager {
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
    createTournament(id = null, options = {}) {
        let thisid;
        if (id === null) {
            do {
                thisid = Utilities.randomString(16);
            } while (this.tournaments.findIndex(i => i.eventID === thisid) > -1);
        } else {
            thisid = id;
            while (this.tournaments.findIndex(i => i.eventID === thisid) > -1) {
                thisid = Utilities.randomString(16);
            }
        }
        let tournament;
        if (options.format === 'swiss') tournament = new Tournament.Swiss(thisid, options);
        else if (options.format === 'robin') tournament = new Tournament.RoundRobin(thisid, options);
        else tournament = new Tournament.Elimination(thisid, options);
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
