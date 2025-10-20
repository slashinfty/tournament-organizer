/**
 * Class representing a match.
 *
 * See {@link MatchValues} for detailed descriptions of properties.
 */
export class Match {
    /** Unique ID of the match */
    id;
    /** Round number for the match */
    round;
    /** Match number for the match */
    match;
    /** If the match is active */
    active;
    /** If the match is an assigned bye */
    bye;
    /** If the match is an assigned loss */
    loss;
    /** Details for player one */
    player1;
    /** Details for player two */
    player2;
    /** Next match for winners and losers */
    path;
    /** Any extra information */
    meta;
    /** Create a new match. */
    constructor(id, round, match) {
        this.id = id;
        this.round = round;
        this.match = match;
        this.active = false;
        this.bye = false;
        this.loss = false;
        this.player1 = {
            id: null,
            win: 0,
            loss: 0,
            draw: 0
        };
        this.player2 = {
            id: null,
            win: 0,
            loss: 0,
            draw: 0
        };
        this.path = {
            win: null,
            loss: null
        };
        this.meta = {};
    }
    /** Set information about the match (only changes in information need to be included in the object) */
    set(options) {
        if (options.hasOwnProperty('round'))
            this.round = options.round;
        if (options.hasOwnProperty('match'))
            this.match = options.match;
        if (options.hasOwnProperty('active'))
            this.active = options.active;
        if (options.hasOwnProperty('bye'))
            this.bye = options.bye;
        if (options.hasOwnProperty('loss'))
            this.loss = options.loss;
        if (options.hasOwnProperty('player1'))
            Object.assign(this.player1, options.player1);
        if (options.hasOwnProperty('player2'))
            Object.assign(this.player2, options.player2);
        if (options.hasOwnProperty('path'))
            Object.assign(this.path, options.path);
        if (options.hasOwnProperty('meta'))
            Object.assign(this.meta, options.meta);
    }
    /**
     * @returns The ID of the match
     */
    getId() {
        return this.id;
    }
    /**
     * @returns The round number for the match
     */
    getRoundNumber() {
        return this.round;
    }
    /**
     * @returns The match number for the match
     */
    getMatchNumber() {
        return this.match;
    }
    /**
     * @returns If the match is active
     */
    isActive() {
        return this.active;
    }
    /**
     * @returns If the match is paired, either with two players, or one player and marked as a bye or loss
     */
    isPaired() {
        return this.player1.id !== null && (this.player2.id !== null || this.bye || this.loss);
    }
    /**
     * @returns If the match has ended with results reported
     */
    hasEnded() {
        return !this.active &&
            (this.player1.win > 0 || this.player1.loss > 0 || this.player1.draw > 0) &&
            (this.player2.win > 0 || this.player2.loss > 0 || this.player2.draw > 0);
    }
    /**
     * @returns If the match is an assigned bye
     */
    isBye() {
        return this.bye;
    }
    /**
     * @returns If the match is an assigned loss
     */
    isLoss() {
        return this.loss;
    }
    /**
     * @returns The details for player one
     */
    getPlayer1() {
        return this.player1;
    }
    /**
     * @returns The details for player two
     */
    getPlayer2() {
        return this.player2;
    }
    /**
     * @returns The details for the player who won the match
     */
    getWinner() {
        if (this.hasEnded() === false)
            return null;
        return this.player1.win > this.player2.win ? this.player1 : this.player2.win > this.player1.win ? this.player2 : null;
    }
    /**
     * @returns The details for the player who loss the match
     */
    getLoser() {
        if (this.hasEnded() === false)
            return null;
        return this.player1.loss > this.player2.loss ? this.player1 : this.player2.loss > this.player1.loss ? this.player2 : null;
    }
    /**
     * @returns If the match is a draw
     */
    isDraw() {
        return this.hasEnded() === true && this.player1.win === this.player2.win && this.player1.loss === this.player2.loss;
    }
    /**
     * @returns The next match for winners and losers
     */
    getPath() {
        return this.path;
    }
    /**
     * @returns Any extra information
     */
    getMeta() {
        return this.meta;
    }
    /**
     * @returns The values of all match details
     */
    getValues() {
        return {
            id: this.id,
            round: this.round,
            match: this.match,
            active: this.active,
            bye: this.bye,
            loss: this.loss,
            player1: this.player1,
            player2: this.player2,
            path: this.path,
            meta: this.meta
        };
    }
}
//# sourceMappingURL=Match.js.map