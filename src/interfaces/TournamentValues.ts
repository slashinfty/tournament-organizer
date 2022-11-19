import { Player } from '../Player.js';
import { Match } from '../Match.js';

export interface TournamentValues {
    id: string,
    name: string,
    status: 'setup' | 'stage-one' | 'stage-two' | 'complete',
    round: number,
    players: Array<Player>,
    matches: Array<Match>,
    sorting: 'ascending' | 'descending' | 'none',
    scoring: {
        bestOf: number,
        win: number,
        draw: number,
        loss: number,
        bye: number,
        tiebreaks: Array<
            'median buchholz' |
            'solkoff' |
            'sonneborn berger' |
            'cumulative' |
            'versus' |
            'game win percentage' |
            'opponent game win percentage' |
            'opponent match win percentage' |
            'opponent opponent match win percentage'
        >
    },
    stageOne: {
        format: 'single-elimination' | 'double-elimination' | 'stepladder' | 'swiss' | 'round-robin' | 'double-round-robin',
        consolation: boolean,
        rounds: number,
        maxPlayers: number
    },
    stageTwo: {
        format: 'single-elimination' | 'double-elimination' | 'stepladder' | null,
        consolation: boolean,
        advance: {
            value: number,
            method: 'points' | 'rank'
        }
    }
}