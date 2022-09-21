import cryptoRandomString from 'crypto-random-string';
import { Tournament } from './Tournament.js';

/** Class representing a tournament manager */
export class Manager {
    /** All tournaments being managed */
    #tournaments: Array<Tournament>;

    /** Create a tournament manager */
    constructor() {
        this.#tournaments = [];
    }

    /** Get all tournaments */
    get tournaments(): Array<Tournament> {
        return this.#tournaments;
    }

    /**
     * Create a new tournament
     * @param name Name of the tournament
     * @param format Format of the tournament
     * @param id ID of the tournament (randomly assigned if omitted)
     * @returns The newly created tournament
     */
    createTournament(name: string, format: 'single-elimination' | 'double-elimination' | 'swiss' | 'round-robin' | 'double-round-robin', id: string | undefined = undefined): Tournament {
        let ID = id;
        if (ID === undefined) {
            do {
                ID = cryptoRandomString({
                    length: 12,
                    type: 'base64'
                });
            } while (this.#tournaments.some(t => t.id === ID));
        }
        const tournament = new Tournament(ID, name, format);
        this.#tournaments.push(tournament);
        return tournament;
    }

    // reload tournament
}