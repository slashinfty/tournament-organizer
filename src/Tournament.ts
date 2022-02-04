import cryptoRandomString from 'crypto-random-string';
import { Match } from './Match.js';
import { Player } from './Player.js';
import * as Pairings from './Pairings.js';
import * as Tiebreakers from './Tiebreakers.js';

interface Structure {
    id: string;
    name: string;
    format: 'single elimination' | 'double elimination' | 'swiss' | 'round robin' | 'double round robin';
    sorting: 'none' | 'ascending' | 'descending';
    consolation: boolean;
    playerLimit: number;
    pointsForWin: number;
    pointsForDraw: number;
    currentRound: number;
    startTime: Date;
    players: Array<Player>;
    matches: Array<Match>;
    status: 'registration' | 'active' | 'playoffs' | 'aborted' | 'finished';
    rounds?: number;
    playoffs?: 'none' | 'single elimination' | 'double elimination';
    bestOf?: number;
    cut?: {
        type: 'none' | 'rank' | 'points',
        limit: number
    };
    tiebreakers?: [
        'median buchholz' |
        'solkoff' |
        'sonneborn berger' |
        'cumulative' |
        'versus' |
        'game win percentage' |
        'opponent game win percentage' |
        'opponent match win percentage' |
        'opponent opponent match win percentage'
    ];
    double?: boolean;
    //addPlayer: (opt: object) => Player;
}

type BasicTournamentProperties = {
    id: string,
    name: string,
    format: 'single elimination' | 'double elimination' | 'swiss' | 'round robin' | 'double round robin',
    sorting?: 'none' | 'ascending' | 'descending',
    consolation?: boolean,
    playerLimit?: number,
    pointsForWin?: number,
    pointsForDraw?: number
}

/** Class representing a tournament. */
class Tournament implements Structure {

    /** Unique ID of the tournament. */
    id: string;

    /** Name of the tournament. */
    name: string;

    /** Format for the first stage of the tournament. */
    format: 'single elimination' | 'double elimination' | 'swiss' | 'round robin' | 'double round robin';

    /** If players are sorted by a seed value, and the direction in which to sort them. */
    sorting: 'none' | 'ascending' | 'descending';

    /** If there is a third place consolation match. Only used in elimination formats/playoffs. */
    consolation: boolean;

    /** Maximum number of players allowed to register for the tournament. If equal to 0, then there is no maximum. */
    playerLimit: number;
    
    /** Number of points assigned to a match win. */
    pointsForWin: number;

    /** Number of points assigned to a drawn match. */
    pointsForDraw: number;

    /** Current round of the tournament. */
    currentRound: number;

    /** Creation date and time of the tournament. */
    startTime: Date;

    /** Array of all players in the tournament. */
    players: Player[];

    /** Array of all matches in the tournament. */
    matches: Match[];

    /** The current status of the tournament. */
    status: 'registration' | 'active' | 'playoffs' | 'aborted' | 'finished';

    constructor(opt: BasicTournamentProperties) {
        
        // Default values
        let options = Object.assign({
            sorting: 'none',
            consolation: false,
            playerLimit: 0,
            pointsForWin: 1,
            pointsForDraw: 0
        }, opt);
        
        this.id = options.id;
        this.name = options.name;
        this.format = options.format;
        this.sorting = options.sorting;
        this.consolation = options.consolation;
        this.playerLimit = options.playerLimit;
        this.pointsForWin = options.pointsForWin;
        this.pointsForDraw = options.pointsForDraw;
        this.startTime = new Date(Date.now());
        this.currentRound = 0;
        this.players = [];
        this.matches = [];
        this.status = 'registration';
    }

    /**
     * Get the current standings of the tournament.
     * @param active If only active players are included in standings (default is true).
     * @returns Sorted array of players
     */
    standings(active?: boolean) : Player[] {
        
        // Default value
        const activeOnly = arguments.length === 1 ? active : true;

        // Compute tiebreakers
        Tiebreakers.compute(this);

        // Get players to sort
        const playersToSort = activeOnly ? this.players.filter(player => player.active) : [...this.players];

        // Sort players
        return Tiebreakers.sort(playersToSort, this);
    }

    /**
     * Create a new player and add them to the tournament.
     * @param tournament The tournament for which the player is being added.
     * @param options User-defined options for a new player.
     * @returns The newly created player.
     */
        static newPlayer(tournament: Structure, options: {
            alias: string,
            id: string,
            seed: number,
            initialByes: number
        }): Player {
    
            // Times when a player can not be added
            if (tournament.playerLimit > 0 && tournament.players.length === tournament.playerLimit) {
                throw `Player maximum of ${tournament.playerLimit} has been reached. Player can not be added.`
            }
    
            if (['Playoffs', 'Aborted', 'Finished'].some(str => str === tournament.status)) {
                throw `Current tournament status is ${tournament.status}. Player can not be added.`;
            }
    
            if (options.hasOwnProperty('id') && tournament.players.some(player => player.id === options.id)) {
                throw `A player with ID ${options.id} is already enrolled in the tournament. Duplicate player can not be added.`;
            }
    
            if (tournament.format !== 'swiss') {
                throw `Players can not be added late to ${tournament.format} tournaments.`;
            }
    
            // No duplicate IDs
            while (tournament.players.some(player => player.id === options.id)) {
                options.id = cryptoRandomString({length: 10, type: 'alphanumeric'});
            }
    
            // Create new player
            const newPlayer = new Player(options);
            tournament.players.push(newPlayer);
    
            return newPlayer;
        }

    /**
     * Record a result during an elimination tournament/playoff. Called by subclasses.
     * @param tournament The tournament for which the result is being reported.
     * @param res Array containing player one's games won and player two's games won.
     */
    static eliminationResult(tournament: Structure, res: {
        match: string,
        result: [number, number]
    }) : void {
        
        // Wins can not be equal, as elimination needs a winner
        if (res.result[0] === res.result[1]) {
            throw 'One player must win more games than the other during elimination.';
        }

        // Get the match
        const match = tournament.matches.find(m => m.id === res.match);
        if (match === undefined) {
            throw `No match found with the ID ${res.match}.`;
        }

        // Get the players
        const playerOne = tournament.players.find(player => player.id === match.playerOne);
        const playerTwo = tournament.players.find(player => player.id === match.playerTwo);

        // Set result
        match.result.playerOneWins = res.result[0];
        playerOne.results.push({
            match: match.id,
            round: match.round,
            opponent: match.playerTwo,
            outcome: res.result[0] > res.result[1] ? 'win' : 'loss',
            matchPoints: res.result[0] > res.result[1] ? tournament.pointsForWin : 0,
            gamePoints: res.result[0] * tournament.pointsForWin,
            games: res.result.reduce((sum, points) => sum + points, 0)
        });
        const playerOneResult = playerOne.results[playerOne.results.length - 1];
        playerOne.matchCount++;
        playerOne.matchPoints += playerOneResult.matchPoints;
        playerOne.gameCount += playerOneResult.games;
        playerOne.gamePoints += playerOneResult.gamePoints;
        
        match.result.playerTwoWins = res.result[1];
        playerTwo.results.push({
            match: match.id,
            round: match.round,
            opponent: match.playerOne,
            outcome: res.result[1] > res.result[0] ? 'win' : 'loss',
            matchPoints: res.result[1] > res.result[0] ? tournament.pointsForWin : 0,
            gamePoints: res.result[1] * tournament.pointsForWin,
            games: res.result.reduce((sum, points) => sum + points, 0)
        });
        const playerTwoResult = playerTwo.results[playerTwo.results.length - 1];
        playerTwo.matchCount++;
        playerTwo.matchPoints += playerTwoResult.matchPoints;
        playerTwo.gameCount += playerTwoResult.games;
        playerTwo.gamePoints += playerTwoResult.gamePoints;
        match.active = false;

        // Move players to next matches (or end event)
        let winner: Player, loser: Player;
        if (res.result[0] > res.result[1]) {
            winner = playerOne;
            loser = playerTwo;
        } else {
            winner = playerTwo;
            loser = playerOne;
        }
        if (match.winnersPath === null) {
            tournament.status = 'finished';
            return;
        } else {
            const winnersMatch = tournament.matches.find(m => m.id === match.winnersPath);
            if (winnersMatch.playerOne === null) {
                winnersMatch.playerOne = winner.id;
            } else if (winnersMatch.playerTwo === null) {
                winnersMatch.playerTwo = winner.id;
                winnersMatch.active = true;
            }
        }
        if (match.losersPath === null) {
            loser.active = false;
        } else {
            const losersMatch = tournament.matches.find(m => m.id === match.losersPath);
            if (losersMatch.playerOne === null) {
                losersMatch.playerOne = loser.id;
            } else if (losersMatch.playerTwo === null) {
                losersMatch.playerTwo = loser.id;
                losersMatch.active = true;
            }
        }
    }

    /**
     * Record a result during an swiss or round-robin tournament. Called by subclasses.
     * @param tournament The tournament for which the result is being reported.
     * @param res Array containing player one's games won, player two's games won, and the number of games drawn.
     */
    static standardResult(tournament: Structure, res: {
        match: string,
        result: [number, number, number]
    }) : void {

        // Get the match
        const match = tournament.matches.find(m => m.id === res.match);
        if (match === undefined) {
            throw `No match found with the ID ${res.match}.`;
        }

        // Get the players and result
        const playerOne = tournament.players.find(player => player.id === match.playerOne);
        const playerTwo = tournament.players.find(player => player.id === match.playerTwo);

        // Set result
        match.result.playerOneWins = res.result[0];
        playerOne.results.push({
            match: match.id,
            round: match.round,
            opponent: match.playerTwo,
            outcome: res.result[0] > res.result[1] ? 'win' : res.result[1] > res.result[0] ? 'loss': 'draw',
            matchPoints: res.result[0] > res.result[1] ? tournament.pointsForWin : res.result[1] > res.result[0] ? 0 : tournament.pointsForDraw,
            gamePoints: res.result[0] * tournament.pointsForWin + res.result[2] * tournament.pointsForDraw,
            games: res.result.reduce((sum, points) => sum + points, 0)
        });
        const playerOneResult = playerOne.results[playerOne.results.length - 1];
        playerOne.matchCount++;
        playerOne.matchPoints += playerOneResult.matchPoints;
        playerOne.gameCount += playerOneResult.games;
        playerOne.gamePoints += playerOneResult.gamePoints;
        
        match.result.playerTwoWins = res.result[1];
        playerTwo.results.push({
            match: match.id,
            round: match.round,
            opponent: match.playerOne,
            outcome: res.result[1] > res.result[0] ? 'win' : res.result[0] > res.result[1] ?'loss': 'draw',
            matchPoints: res.result[1] > res.result[0] ? tournament.pointsForWin : res.result[0] > res.result[1] ? 0 : tournament.pointsForDraw,
            gamePoints: res.result[1] * tournament.pointsForWin + res.result[2] * tournament.pointsForDraw,
            games: res.result.reduce((sum, points) => sum + points, 0)
        });
        const playerTwoResult = playerTwo.results[playerTwo.results.length - 1];
        playerTwo.matchCount++;
        playerTwo.matchPoints += playerTwoResult.matchPoints;
        playerTwo.gameCount += playerTwoResult.games;
        playerTwo.gamePoints += playerTwoResult.gamePoints;
        match.result.draws = res.result[2];
        match.active = false;
    }

    static eliminationRemovePlayer(tournament: Structure, player: Player): void {
        
        // Find the player's current match
        const match = tournament.matches.find(m => m.round === tournament.currentRound && (m.playerOne === player.id || m.playerTwo === player.id));
        if (match !== undefined) {
            if (match.active === true) {
                const result: [number, number] = match.playerOne === player.id ? [0, Math.ceil(tournament.bestOf / 2)] : [Math.ceil(tournament.bestOf / 2), 0];
                Tournament.eliminationResult(tournament, {
                    match: match.id,
                    result: result
                });
            }

            // If the player was in the winner's bracket of a double elimination tournament, fix routing in loser's bracket
            if (match.losersPath !== null) {
                const nextMatch = tournament.matches.find(m => m.id === match.losersPath);
                if (nextMatch.playerTwo === null) {
                    const moveToMatchID = nextMatch.winnersPath;
                    const moveFromMatch = tournament.matches.find(m => (m.winnersPath === nextMatch.id || m.losersPath === nextMatch.id) && m.playerOne !== player.id && m.playerTwo !== player.id);
                    if (moveFromMatch.winnersPath === nextMatch.id) {
                        moveFromMatch.winnersPath = moveToMatchID;
                    } else {
                        moveFromMatch.losersPath = moveToMatchID;
                    }
                } else {
                    nextMatch.active = false;
                    const winnersMatch = tournament.matches.find(m => m.id === nextMatch.winnersPath);
                    if (winnersMatch.playerOne === null) {
                        winnersMatch.playerOne = nextMatch.playerOne;
                    } else if (winnersMatch.playerTwo === null) {
                        winnersMatch.playerTwo = nextMatch.playerOne;
                        winnersMatch.active = true;
                    }
                }
            }
        }
    }

}

/** Class representing a Swiss pairing tournament. */
class Swiss extends Tournament {
    
    /** Number of rounds in the tournament. If 0, it will be determined by the number of players (base 2 logarithm of the number of players, rounded up). */
    rounds: number;

    /** Format for the playoffs. */
    playoffs: 'none' | 'single elimination' | 'double elimination';

    /** Number of possible games for a match. */
    bestOf: number;

    /** How to cut for playoffs. */
    cut: {
        type: 'none' | 'rank' | 'points',
        limit: number
    };

    /** Tiebreakers that will be used for the tournament in order of precedence.  */
    tiebreakers: [
        'median buchholz' |
        'solkoff' |
        'sonneborn berger' |
        'cumulative' |
        'versus' |
        'game win percentage' |
        'opponent game win percentage' |
        'opponent match win percentage' |
        'opponent opponent match win percentage'
    ];

    constructor(opt: {
        rounds?: number,
        playoffs?: 'none' | 'single elimination' | 'double elimination',
        bestOf?: number,
        cut?: {
            type: 'none' | 'rank' | 'points',
            limit: number
        },
        tiebreakers?: [
            'median buchholz' |
            'solkoff' |
            'sonneborn berger' |
            'cumulative' |
            'versus' |
            'game win percentage' |
            'opponent game win percentage' |
            'opponent match win percentage' |
            'opponent opponent match win percentage'
        ]
    } & BasicTournamentProperties) {
        super(opt);

        // Default values
        let options = Object.assign({
            rounds: 0,
            playoffs: 'none',
            bestOf: 1,
            cut: {
                type: 'none',
                limit: 0
            },
            tiebreakers: ['solkoff', 'cumulative']
        }, opt);

        this.rounds = options.rounds;
        this.playoffs = options.playoffs;
        this.bestOf = options.bestOf;
        this.cut = options.cut;
        this.tiebreakers = options.tiebreakers;
    }

    /**
     * Starts the tournament.
     */
    startEvent(): void {

        // Need at least 8 players
        if (this.players.length < 8) {
            throw `Swiss tournaments require at least 8 players, and there are currently ${this.players.length} players enrolled.`;
        }

        // Set tournament as active
        this.status = 'active';

        // Determine number of rounds, if not initially set
        if (this.rounds === 0) this.rounds = Math.ceil(Math.log2(this.players.length));

        // Create matches
        this.currentRound++;
        Pairings.swiss(this);

        // Process byes
        const byes = this.matches.filter(match => match.round === this.currentRound && match.playerTwo === null);
        byes.forEach(bye => {
            const player = this.players.find(p => p.id === bye.playerOne);
            player.results.push({
                match: bye.id,
                round: bye.round,
                opponent: null,
                outcome: 'bye',
                matchPoints: this.pointsForWin,
                gamePoints: Math.ceil(this.bestOf / 2) * this.pointsForWin,
                games: Math.ceil(this.bestOf / 2)
            });
            player.pairingBye = true;
            player.matchCount++;
            player.matchPoints += this.pointsForWin;
            player.gameCount += Math.ceil(this.bestOf / 2);
            player.gamePoints += Math.ceil(this.bestOf / 2) * this.pointsForWin;
            bye.result.playerOneWins = Math.ceil(this.bestOf / 2);
        });
    }

    /**
     * Create the next round of the tournament.
     */
    nextRound(): void {

        // Can't start the next round if there are active matches
        if (this.matches.some(match => match.active === true)) {
            throw `Can not start the next round with ${this.matches.reduce((sum, match) => match.active === true ? sum + 1 : sum, 0)} active matches remaining.`;
        }

        // Can't create new rounds while the tournament isn't active
        if (this.status !== 'active') {
            throw `Tournament can only create new rounds while active, and the current status is ${this.status}.`;
        }

        // Check if it's time to start playoffs
        if (this.currentRound === this.rounds) {
            if (this.playoffs === 'none') {
                this.status = 'finished';
                return;
            } else {
                if (this.cut.type === 'points') {
                    if (this.cut.limit !== 0) {
                        const cutPlayers = this.players.filter(player => player.matchPoints < this.cut.limit);
                        cutPlayers.forEach(player => player.active = false);
                    }
                } else if (this.cut.type === 'rank') {
                    if (this.cut.limit !== 0) {
                        Tiebreakers.compute(this);
                        const sortedPlayers = Tiebreakers.sort(this.players.filter(player => player.active === true), this);
                        const cutPlayers = sortedPlayers.slice(this.cut.limit);
                        cutPlayers.forEach(player => player.active = false);
                    }
                }
                if (this.playoffs === 'single elimination') {
                    Pairings.singleElimination(this);
                } else {
                    Pairings.doubleElimination(this);
                }
                return;
            }
        }

        // Create matches
        this.currentRound++;
        Pairings.swiss(this);

        // Process byes
        const byes = this.matches.filter(match => match.round === this.currentRound && match.playerTwo === null);
        byes.forEach(bye => {
            const player = this.players.find(p => p.id === bye.playerOne);
            player.results.push({
                match: bye.id,
                round: bye.round,
                opponent: null,
                outcome: 'bye',
                matchPoints: this.pointsForWin,
                gamePoints: Math.ceil(this.bestOf / 2) * this.pointsForWin,
                games: Math.ceil(this.bestOf / 2)
            });
            player.pairingBye = true;
            player.matchCount++;
            player.matchPoints += this.pointsForWin;
            player.gameCount += Math.ceil(this.bestOf / 2);
            player.gamePoints += Math.ceil(this.bestOf / 2) * this.pointsForWin;
            bye.result.playerOneWins = Math.ceil(this.bestOf / 2);
        });
    }

    /**
     * Record a result during an elimination tournament/playoff. Called by subclasses.
     * @param res Array containing player one's games won and player two's games won.
     */
     result(res: {
        match: string,
        result: [number, number, number?]
    }) : void {

        const result = res.result[2] === undefined ? [...res.result, 0] : [...res.result];

        // If it's the playoffs, use elimination to process the result
        if (this.status === 'playoffs') {
            Tournament.eliminationResult(this, {
                match: res.match,
                result: [result[0], result[1]]
            });
            return;
        }

        // Otherwise use standard result process
        Tournament.standardResult(this, {
            match: res.match,
            result: [result[0], result[1], result[2]]
        });
        return;
    }

    /**
     * Create a new player and add them to the tournament.
     * @param opt User-defined options for a new player.
     * @returns The newly created player.
     */
    addPlayer(opt: {
        alias: string,
        id?: string,
        seed?: number,
        initialByes?: number,
        missingResults?: 'byes' | 'losses'
    }) : Player {

        // Default values
        let options = Object.assign({
            id: cryptoRandomString({length: 10, type: 'alphanumeric'}),
            seed: 0,
            initialByes: 0,
            missingResults: 'losses'
        }, opt);

        const player = Tournament.newPlayer(this, {
            alias: options.alias,
            id: options.id,
            seed: options.seed,
            initialByes: options.initialByes
        });

        // Handling missed rounds due to tardiness
        if (this.status === 'active') {
            for (let i = 0; i < this.currentRound; i++) {
                let matchID = cryptoRandomString({length: 10, type: 'alphanumeric'});
                while (this.matches.some(match => match.id === matchID)) {
                    matchID = cryptoRandomString({length: 10, type: 'alphanumeric'});
                }
                const match = new Match({
                    id: matchID,
                    match: 0,
                    round: i + 1,
                    playerOne: player.id,
                    playerTwo: null
                });
                if (options.missingResults === 'byes') {
                    player.results.push({
                        match: matchID,
                        round: i + 1,
                        opponent: null,
                        outcome: 'bye',
                        matchPoints: this.pointsForWin,
                        gamePoints: Math.ceil(this.bestOf / 2) * this.pointsForWin,
                        games: Math.ceil(this.bestOf / 2)
                    });
                    player.pairingBye = true;
                    player.matchCount++;
                    player.matchPoints += this.pointsForWin;
                    player.gameCount += Math.ceil(this.bestOf / 2);
                    player.gamePoints += Math.ceil(this.bestOf / 2) * this.pointsForWin;
                    match.result.playerOneWins = Math.ceil(this.bestOf / 2);
                } else {
                    player.results.push({
                        match: matchID,
                        round: i + 1,
                        opponent: null,
                        outcome: 'loss',
                        matchPoints: 0,
                        gamePoints: 0,
                        games: Math.ceil(this.bestOf / 2)
                    });
                    player.matchCount++;
                    player.gameCount += Math.ceil(this.bestOf / 2);
                }
            }
        }

        return player;
    }

    /**
     * Remove a player from the tournament.
     * @param id ID of the player to remove.
     * @returns The player that was removed.
     */
    removePlayer(id: string): Player {
        
        const player = this.players.find(p => p.id === id);

        // If the player can't be found
        if (player === undefined) {
            throw `Can not find a player with ID ${id}.`;
        }

        // If the player has already been removed
        if (player.active === false) {
            throw `${player.alias} has already been removed from the tournament.`;
        }

        // No removing players once the tournament is over
        if (this.status === 'finished' || this.status === 'aborted') {
            throw `Can not remove players if the tournament is ${this.status}.`;
        }

        // Remove the player from the tournament
        if (this.status === 'registration') {
            const index = this.players.findIndex(p => p.id === player.id);
            this.players.splice(index, 1);
        } else if (this.status === 'playoffs') {
            Tournament.eliminationRemovePlayer(this, player);
        } else {
            const match = this.matches.find(m => m.round === this.currentRound && (m.playerOne === player.id || m.playerTwo === player.id));
            if (match !== undefined && match.active === true) {
                const result: [number, number, number] = match.playerOne === player.id ? [0, Math.ceil(this.bestOf / 2), 0] : [Math.ceil(this.bestOf / 2), 0, 0];
                Tournament.standardResult(this, {
                    match: match.id,
                    result: result
                });
            }
            player.active = false;
        }

        return player;
    }
}

/** Class representing a round-robin pairing tournament. */
class RoundRobin extends Tournament {

    /** Format for the playoffs. */
    playoffs: 'none' | 'single elimination' | 'double elimination';

    /** Number of possible games for a match. */
    bestOf: number;

    /** How to cut for playoffs. */
    cut: {
        type: 'none' | 'rank' | 'points',
        limit: number
    };

    /** If the tournament is double round-robin or not. */
    double: boolean;

    /** Tiebreakers that will be used for the tournament in order of precedence.  */
    tiebreakers: [
        'median buchholz' |
        'solkoff' |
        'sonneborn berger' |
        'cumulative' |
        'versus' |
        'game win percentage' |
        'opponent game win percentage' |
        'opponent match win percentage' |
        'opponent opponent match win percentage'
    ];

    constructor(opt: {
        playoffs?: 'none' | 'single elimination' | 'double elimination',
        bestOf?: number,
        cut?: {
            type: 'none' | 'rank' | 'points',
            limit: number
        },
        double?: boolean,
        tiebreakers?: [
            'median buchholz' |
            'solkoff' |
            'sonneborn berger' |
            'cumulative' |
            'versus' |
            'game win percentage' |
            'opponent game win percentage' |
            'opponent match win percentage' |
            'opponent opponent match win percentage'
        ]
    } & BasicTournamentProperties) {
        super(opt);

        // Default values
        let options = Object.assign({
            playoffs: 'none',
            bestOf: 1,
            cut: {
                type: 'none',
                limit: 0
            },
            double: false,
            tiebreakers: ['sonneborn berger', 'versus']
        }, opt);

        this.playoffs = options.playoffs;
        this.bestOf = options.bestOf;
        this.cut = options.cut;
        this.double = options.double;
        this.tiebreakers = options.tiebreakers;
    }

    /**
     * Starts the tournament.
     */
    startEvent(): void {
        
        // Need at least 4 players
        if (this.players.length < 4) {
            throw `Round-Robin tournaments require at least 4 players, and there are currently ${this.players.length} players enrolled`;
        }

        // Set tournament as active
        this.status = 'active';

        // Create matches
        this.currentRound++;
        Pairings.roundRobin(this);

        // Process bye, if necessary
        const byes = this.matches.filter(match => match.round === this.currentRound && (match.playerOne === null || match.playerTwo === null));
        byes.forEach(bye => {
            const id = bye.playerTwo === null ? bye.playerOne : bye.playerTwo;
            const player = this.players.find(p => p.id === id);
            player.results.push({
                match: bye.id,
                round: bye.round,
                opponent: null,
                outcome: 'bye',
                matchPoints: this.pointsForWin,
                gamePoints: Math.ceil(this.bestOf / 2) * this.pointsForWin,
                games: Math.ceil(this.bestOf / 2)
            });
            player.pairingBye = true;
            player.matchCount++;
            player.matchPoints += this.pointsForWin;
            player.gameCount += Math.ceil(this.bestOf / 2);
            player.gamePoints += Math.ceil(this.bestOf / 2) * this.pointsForWin;
            if (bye.playerTwo === null) bye.result.playerOneWins = Math.ceil(this.bestOf / 2);
            else bye.result.playerTwoWins = Math.ceil(this.bestOf / 2);
        });
    }

    /**
     * Create the next round of the tournament.
     */
     nextRound(): void {

        // Can't start the next round if there are active matches
        if (this.matches.some(match => match.active === true)) {
            throw `Can not start the next round with ${this.matches.reduce((sum, match) => match.active === true ? sum + 1 : sum, 0)} active matches remaining`;
        }

        // Can't create new rounds while the tournament isn't active
        if (this.status !== 'active') {
            throw `Tournament can only create new rounds while active, and the current status is ${this.status}.`;
        }

        // Check if it's time to start playoffs
        if (this.currentRound === this.matches.reduce((currentMax, currentMatch) => Math.max(currentMax, currentMatch.round), 0)) {
            if (this.playoffs === 'none') {
                this.status = 'finished';
                return;
            } else {
                if (this.cut.type === 'points') {
                    if (this.cut.limit !== 0) {
                        const cutPlayers = this.players.filter(player => player.matchPoints < this.cut.limit);
                        cutPlayers.forEach(player => player.active = false);
                    }
                } else if (this.cut.type === 'rank') {
                    if (this.cut.limit !== 0) {
                        Tiebreakers.compute(this);
                        const sortedPlayers = Tiebreakers.sort(this.players.filter(player => player.active === true), this);
                        const cutPlayers = sortedPlayers.slice(this.cut.limit);
                        cutPlayers.forEach(player => player.active = false);
                    }
                }
                if (this.playoffs === 'single elimination') {
                    Pairings.singleElimination(this);
                } else {
                    Pairings.doubleElimination(this);
                }
                return;
            }
        }

        // Create matches
        this.currentRound++;
        Pairings.swiss(this);

        // Process byes
        const byes = this.matches.filter(match => match.round === this.currentRound && (match.playerOne === null || match.playerTwo === null));
        for (let i = 0; i < byes.length; i++) {
            const bye = byes[i];
            if (bye.playerOne === null && bye.playerTwo === null) continue;
            const id = bye.playerTwo === null ? bye.playerOne : bye.playerTwo;
            const player = this.players.find(p => p.id === id);
            player.results.push({
                match: bye.id,
                round: bye.round,
                opponent: null,
                outcome: 'bye',
                matchPoints: this.pointsForWin,
                gamePoints: Math.ceil(this.bestOf / 2) * this.pointsForWin,
                games: Math.ceil(this.bestOf / 2)
            });
            player.pairingBye = true;
            player.matchCount++;
            player.matchPoints += this.pointsForWin;
            player.gameCount += Math.ceil(this.bestOf / 2);
            player.gamePoints += Math.ceil(this.bestOf / 2) * this.pointsForWin;
            if (bye.playerTwo === null) bye.result.playerOneWins = Math.ceil(this.bestOf / 2);
            else bye.result.playerTwoWins = Math.ceil(this.bestOf / 2);
        };
    }

    /**
     * Record a result during an elimination tournament/playoff. Called by subclasses.
     * @param res Array containing player one's games won and player two's games won.
     */
     result(res: {
        match: string,
        result: [number, number, number?]
    }) : void {

        const result = res.result[2] === undefined ? [...res.result, 0] : [...res.result];

        // If it's the playoffs, use elimination to process the result
        if (this.status === 'playoffs') {
            Tournament.eliminationResult(this, {
                match: res.match,
                result: [result[0], result[1]]
            });
            return;
        }

        // Otherwise use standard result process
        Tournament.standardResult(this, {
            match: res.match,
            result: [result[0], result[1], result[2]]
        });
        return;
    }

    /**
     * Create a new player and add them to the tournament.
     * @param opt User-defined options for a new player.
     * @returns The newly created player.
     */
    addPlayer(opt: {
        alias: string,
        id?: string,
        seed?: number
    }) : Player {

        // Default values
        let options = Object.assign({
            id: cryptoRandomString({length: 10, type: 'alphanumeric'}),
            seed: 0,
            initialByes: 0
        }, opt);

        const player = Tournament.newPlayer(this, {
            alias: options.alias,
            id: options.id,
            seed: options.seed,
            initialByes: options.initialByes
        });

        return player;
    }

    /**
     * Remove a player from the tournament.
     * @param id ID of the player to remove.
     * @returns The player that was removed.
     */
    removePlayer(id: string): Player {
        
        const player = this.players.find(p => p.id === id);

        // If the player can't be found
        if (player === undefined) {
            throw `Can not find a player with ID ${id}.`;
        }

        // If the player has already been removed
        if (player.active === false) {
            throw `${player.alias} has already been removed from the tournament.`;
        }

        // No removing players once the tournament is over
        if (this.status === 'finished' || this.status === 'aborted') {
            throw `Can not remove players if the tournament is ${this.status}.`;
        }

        // Remove the player from the tournament
        if (this.status === 'registration') {
            const index = this.players.findIndex(p => p.id === player.id);
            this.players.splice(index, 1);
        } else if (this.status === 'playoffs') {
            Tournament.eliminationRemovePlayer(this, player);
        } else {
            const match = this.matches.find(m => m.round === this.currentRound && (m.playerOne === player.id || m.playerTwo === player.id));
            if (match !== undefined && match.active === true) {
                const result: [number, number, number] = match.playerOne === player.id ? [0, Math.ceil(this.bestOf / 2), 0] : [Math.ceil(this.bestOf / 2), 0, 0];
                Tournament.standardResult(this, {
                    match: match.id,
                    result: result
                });
            }
            for (let i = this.currentRound + 1; i < this.matches.reduce((currentMax, currentMatch) => Math.max(currentMax, currentMatch.round), 0); i++) {
                const futureMatch = this.matches.find(m => m.round === i && (m.playerOne === player.id || m.playerTwo === player.id));
                if (futureMatch.playerOne === player.id) {
                    futureMatch.playerOne = null;
                } else {
                    futureMatch.playerTwo = null;
                }
            }
            player.active = false;
        }

        return player;
    }
}

/**
 * Class representing an elimination tournament.
 * @extends Tournament
 */
class Elimination extends Tournament {
    
    /** Whether or not to do double elimination. */
    double: boolean;

    constructor(opt: {
        double?: boolean
    } & BasicTournamentProperties) {
        super(opt);

        // Default values
        let options = Object.assign({
            double: false
        }, opt);

        this.double = options.double;
    }

    /**
     * Starts the tournament.
     */
    startEvent(): void {
        
        // Need at least 4 players
        if (this.players.length < 4) {
            throw `Elimination tournaments require at least 8 players, and there are currently ${this.players.length} players enrolled`;
        }

        // Set tournament as active
        this.status = 'active';

        // Create matches
        if (this.double) {
            Pairings.doubleElimination(this);
        } else {
            Pairings.singleElimination(this);
        }
    }

    /**
     * Record a result during an elimination tournament/playoff. Called by subclasses.
     * @param res Array containing player one's games won and player two's games won.
     */
    result(res: {
        match: string,
        result: [number, number]
    }) : void {
        
        // Use elimination result
        Tournament.eliminationResult(this, res);
    }

    /**
     * Create a new player and add them to the tournament.
     * @param opt User-defined options for a new player.
     * @returns The newly created player.
     */
     addPlayer(opt: {
        alias: string,
        id?: string,
        seed?: number
    }) : Player {

        // Default values
        let options = Object.assign({
            id: cryptoRandomString({length: 10, type: 'alphanumeric'}),
            seed: 0,
            initialByes: 0
        }, opt);

        const player = Tournament.newPlayer(this, {
            alias: options.alias,
            id: options.id,
            seed: options.seed,
            initialByes: options.initialByes
        });

        return player;
    }

    /**
     * Remove a player from the tournament.
     * @param id ID of the player to remove.
     * @returns The player that was removed.
     */
    removePlayer(id: string): Player {
        
        const player = this.players.find(p => p.id === id);

        // If the player can't be found
        if (player === undefined) {
            throw `Can not find a player with ID ${id}.`;
        }

        // If the player has already been removed
        if (player.active === false) {
            throw `${player.alias} has already been removed from the tournament.`;
        }

        // No removing players once the tournament is over
        if (this.status === 'finished' || this.status === 'aborted') {
            throw `Can not remove players if the tournament is ${this.status}.`;
        }

        // Remove the player from the tournament
        if (this.status === 'registration') {
            const index = this.players.findIndex(p => p.id === player.id);
            this.players.splice(index, 1);
        } else {
            Tournament.eliminationRemovePlayer(this, player);
        }

        return player;
    }
}

export { BasicTournamentProperties, Structure, Tournament, Swiss, RoundRobin, Elimination };
