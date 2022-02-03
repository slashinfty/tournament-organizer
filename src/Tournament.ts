import cryptoRandomString from 'crypto-random-string';
import { Match } from './Match';
import { Player } from './Player';
import * as Pairings from './Pairings';
import * as Tiebreakers from './Tiebreakers';

interface Structure {
    id: string;
    name: string;
    format: 'single elimination' | 'double elimination' | 'swiss' | 'round robin' | 'double round robin';
    sorting: 'none' | 'ascending' | 'descending';
    consolation: boolean;
    playerLimit: number;
    pointsForWin: number;
    pointsForDraw: number;
    startTime: Date;
    players: Array<Player>;
    matches: Array<Match>;
    status: 'registration' | 'active' | 'playoffs' | 'aborted' | 'finished';
    rounds?: number;
    currentRound?: number;
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
        this.players = [];
        this.matches = [];
        this.status = 'registration';
    }

    /**
     * Create a new player and add them to the tournament.
     * @param options User-defined options for a new tournament.
     * @returns If the player was created and added.
     */
    newPlayer(opt: {
        alias: string,
        id?: string,
        seed?: number,
        initialByes?: number,
        missingResults?: 'byes' | 'losses'
    }): Player {

        // Times when a player can not be added
        if (this.playerLimit > 0 && this.players.length === this.playerLimit) {
            throw `Player maximum of ${this.playerLimit} has been reached. Player can not be added.`
        }

        if (['Playoffs', 'Aborted', 'Finished'].some(str => str === this.status)) {
            throw `Current tournament status is ${this.status}. Player can not be added.`;
        }

        if (opt.hasOwnProperty('id') && this.players.some(player => player.id === opt.id)) {
            throw `A player with ID ${opt.id} is already enrolled in the tournament. Duplicate player can not be added.`;
        }

        // Default values
        let options = Object.assign({
            id: cryptoRandomString({length: 10, type: 'alphanumeric'}),
            missingResults: 'losses'
        }, opt);

        // No duplicate IDs
        while (this.players.some(player => player.id === opt.id)) {
            opt.id = cryptoRandomString({length: 10, type: 'alphanumeric'});
        }

        // Create new player
        const newPlayer = new Player(options);
        this.players.push(newPlayer);

        // Handling missed rounds due to tardiness
        if (this.status === 'active') {
            //TODO
        }

        return newPlayer;
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

        // If it's the last match, move to playoffs or finish
        if (tournament.matches.every(match => match.active === false) && tournament.currentRound === tournament.rounds) {
            if (tournament.playoffs === 'none') {
                tournament.status = 'finished';
                return;
            } else {
                //TODO move to playoffs
            }
        }
    }
}

/** Class representing a Swiss pairing tournament. */
class Swiss extends Tournament {
    
    /** Number of rounds in the tournament. If 0, it will be determined by the number of players (base 2 logarithm of the number of players, rounded up). */
    rounds: number;

    /** Current round of the tournament. */
    currentRound: number;

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
            currentRound: 0,
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
        this.currentRound = 0;
    }

    /**
     * Starts the tournament.
     */
    startEvent(): void {

        // Need at least 8 players
        if (this.players.length < 8) {
            throw `Swiss tournaments require at least 8 players, and there are currently ${this.players.length} players enrolled`;
        }

        // Set tournament as active
        this.status = 'active';

        // Determine number of rounds, if not initially set
        if (this.rounds === 0) this.rounds = Math.ceil(Math.log2(this.players.length));

        // Create matches
        this.currentRound++;
        Pairings.swiss(this);

        // Process byes
        //TODO
    }

    /**
     * Create the next round of the tournament.
     */
    nextRound(): void {

        // Can't start the next round if there are active matches
        if (this.matches.some(match => match.active === true)) {
            throw `Can not start the next round with ${this.matches.reduce((sum, match) => match.active === true ? sum + 1 : sum, 0)} active matches remaining`;
        }

        // Check if it's time to start playoffs
        if (this.currentRound === this.rounds) {
            //TODO
            return;
        }

        // Create matches
        this.currentRound++;
        Pairings.swiss(this);

        // Process byes
        //TODO
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
}

/**
 * Class recreating a Swiss pairing tournament from an existing object.
 * @extends Swiss
 */
 class SwissReloaded extends Swiss {
    constructor(tournament) {
        super(tournament.id);
        ['players', 'matches'].forEach(prop => tournament[prop] = tournament.hasOwnProperty(prop) ? tournament[prop] : []);
        Object.assign(this, tournament);
        this.players = this.players.map(p => new Player(p));
        this.matches = this.matches.map(m => new Match(m))
        this.matches.forEach(m => {
            if (m.playerOne !== undefined && m.playerOne !== null) {
                const p1 = this.players.find(p => m.playerOne.id === p.id);
                if (p1 !== undefined) m.playerOne = p1;
            }
            if (m.playerTwo !== undefined && m.playerTwo !== null) {
                const p2 = this.players.find(p => m.playerTwo.id === p.id);
                if (p2 !== undefined) m.playerTwo = p2;
            }
        });
    }
 }

/** Class representing a round-robin pairing tournament. */
class RoundRobin extends Tournament {
    
    /** Current round of the tournament. */
    currentRound: number;

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
            currentRound: 0,
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
        this.currentRound = 0;
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
        //TODO
    }

    /**
     * Create the next round of the tournament.
     */
     nextRound(): void {

        // Can't start the next round if there are active matches
        if (this.matches.some(match => match.active === true)) {
            throw `Can not start the next round with ${this.matches.reduce((sum, match) => match.active === true ? sum + 1 : sum, 0)} active matches remaining`;
        }

        // Check if it's time to start playoffs
        if (this.currentRound === this.matches.reduce((currentMax, currentMatch) => Math.max(currentMax, currentMatch.round), 0)) {
            //TODO
            return;
        }

        // Create matches
        this.currentRound++;
        Pairings.swiss(this);

        // Process byes
        //TODO
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
}

/**
 * Class recreating a round-robin pairing tournament from an existing object.
 * @extends RoundRobin
 */
 class RoundRobinReloaded extends RoundRobin {
    constructor(tournament) {
        super(tournament.id);
        ['players', 'matches', 'groups'].forEach(prop => tournament[prop] = tournament.hasOwnProperty(prop) ? tournament[prop] : []);
        Object.assign(this, tournament);
        this.players = this.players.map(p => new Player(p));
        this.matches = this.matches.map(m => new Match(m));
        this.matches.forEach(m => {
            if (m.playerOne !== undefined && m.playerOne !== null) {
                const p1 = this.players.find(p => m.playerOne.id === p.id);
                if (p1 !== undefined) m.playerOne = p1;
            }
            if (m.playerTwo !== undefined && m.playerTwo !== null) {
                const p2 = this.players.find(p => m.playerTwo.id === p.id);
                if (p2 !== undefined) m.playerTwo = p2;
            }
        });
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
}

/**
 * Class recreating an elimination tournament from an existing object.
 * @extends Elimination
 */
 class EliminationReloaded extends Elimination {
    constructor(tournament) {
        super(tournament.id);
        Object.assign(this, tournament);
        this.players = this.players.map(p => new Player(p));
        this.matches = this.matches.map(m => new Match(m));
        this.matches.forEach(m => {
            if (m.playerOne !== undefined && m.playerOne !== null) {
                const p1 = this.players.find(p => m.playerOne.id === p.id);
                if (p1 !== undefined) m.playerOne = p1;
            }
            if (m.playerTwo !== undefined && m.playerTwo !== null) {
                const p2 = this.players.find(p => m.playerTwo.id === p.id);
                if (p2 !== undefined) m.playerTwo = p2;
            }
        });
    }
 }

export { BasicTournamentProperties, Structure, Tournament, Swiss, RoundRobin, Elimination };
