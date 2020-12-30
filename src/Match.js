'use strict';

/** Class representing a match. */
class Match {
    /**
     * Create a new match.
     * @param {Number} round The round number for the match.
     * @param {Number} matchNumber The match number.
     * @param {?Player[]} players Array of players for the match.
     */
    constructor(round, matchNumber, players = null) {
        /**
         * Round number for the match.
         * @type {Number}
         */
        this.round = round;

        /**
         * Match number.
         * @type {Number}
         */
        this.matchNumber = matchNumber;

        /**
         * Player number one in the match.
         * If null, the player has not been determined.
         * @type {?Player}
         * @default null
         */
        this.playerOne = null;

        /**
         * Player number two in the match.
         * If null, the player has not been determined.
         * @type {?Player}
         * @default null
         */
        this.playerTwo = null;

        // Setting players if in the constructor.
        if (players !== null && players.length === 2) {
            this.playerOne = players[0];
            this.playerTwo = players[1];
        }

        /**
         * The status of the match.
         * @type {Boolean}
         * @default false
         */
        this.active = false;

        /**
         * Number of wins for player one.
         * @type {Number}
         * @default 0
         */
        this.playerOneWins = 0;

        /**
         * Number of wins for player two.
         * @type {Number}
         * @default 0
         */
        this.playerTwoWins = 0;

        /**
         * Number of draws.
         * @type {Number}
         * @default 0
         */
        this.draws = 0;

        /**
         * Next match for the winner.
         * Used in elimination formats.
         * @type {?Match}
         * @default null
         */
        this.winnerPath = null;

        /**
         * Next match for the loser.
         * Used in elimination formats.
         * @type {?Match}
         * @default null
         */
        this.loserPath = null;
    }

    /**
     * Updates player values for a result.
     * @param {Number} wv The value of a win. 
     * @param {Number} lv The value of a loss.
     * @param {Number} dv The value of a draw.
     */
    resultForPlayers(wv, lv, dv) {
        this.playerOne.gamePoints += this.playerOneWins * wv + this.draws * dv;
        this.playerTwo.gamePoints += this.playerTwoWins * wv + this.draws * dv;
        this.playerOne.games += this.playerOneWins + this.playerTwoWins + this.draws;
        this.playerTwo.games += this.playerOneWins + this.playerTwoWins + this.draws;
        this.playerOne.matchPoints += this.playerOneWins > this.playerTwoWins ? wv : this.playerOneWins < this.playerTwoWins ? lv : dv;
        this.playerTwo.matchPoints += this.playerTwoWins > this.playerOneWins ? wv : this.playerTwoWins < this.playerOneWins ? lv : dv;
        this.playerOne.matches++;
        this.playerTwo.matches++;
        this.playerOne.opponents.push(this.playerTwo);
        this.playerTwo.opponents.push(this.playerOne);
    }

    /**
     * Assign a bye to player one.
     */
    assignBye(wv) {
        this.playerOne.gamePoints += this.playerOneWins * wv;
        this.playerOne.games += this.playerOneWins;
        this.playerOne.matchPoints += wv;
        this.playerOne.matches++;
        this.playerOne.byes++;
    }
}

module.exports = Match;
