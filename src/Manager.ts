import cryptoRandomString from 'crypto-random-string';
import { Tournament } from './Tournament.js';
import { SettableTournamentValues } from './interfaces/SettableTournamentValues.js';

/** Class representing a tournament manager */
export class Manager {
    /** All tournaments being managed */
    tournaments: Array<Tournament>;

    /** Create a tournament manager */
    constructor() {
        this.tournaments = [];
    }

    /**
     * Create a new tournament
     * @param name Name of the tournament
     * @param settings Settings of the tournament
     * @param id ID of the tournament (randomly assigned if omitted)
     * @returns The newly created tournament
     */
    createTournament(name: string, settings: SettableTournamentValues = {}, id: string | undefined = undefined): Tournament {
        let ID = id;
        if (ID === undefined) {
            do {
                ID = cryptoRandomString({
                    length: 12,
                    type: 'base64'
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

    // reload tournament

    // remove tournament
    
}