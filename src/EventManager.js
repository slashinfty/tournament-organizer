'use strict';

import { Util } from '../lib/Utilities';
import { Tournament } from './Tournament';

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
     * @param {Object} [options={}] Options a user can define for a tournament.
     * @param {?String[]} [tiebreakers=null] Array of tiebreakers to use in round-robin and swiss formats.
     * @return {Tournament} The newly created tournament.
     */
    createTournament(options = {}, tiebreakers = null) {
        let id = Util.randomString(16);
        while (this.tournaments.findIndex(i => i.eventID === id) > -1) {
            id = Util.randomString(16);
        }
        const tournament = new Tournament(id, options, tiebreakers);
        this.tournaments.push(tournament);
        return tournament;
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
