import { Player } from '../components/Player.js';
import { Match } from '../components/Match.js';
import { Tournament } from '../components/Tournament.js';
import { TournamentValues } from './TournamentValues.js';

/**
 * All properties that can be set with {@link Tournament.settings}.
 * 
 * See {@link TournamentValues} for detailed descriptions of properties.
 */
export interface SettableTournamentValues {
    name?: string,
    status?: 'setup' | 'stage-one' | 'stage-two' | 'complete',
    round?: number,
    matches?: Array<Match>,

    /**
     * If the order of players in matches matters.
     * If enabled, this will switch players' seating before a match begins
     * to help balance color assignments and prevent players from playing the same color too often.
     * Initialized as `false`
     */
    seating?: boolean,
    sorting?: 'ascending' | 'descending' | 'none',
    scoring?: {
        bestOf?: number,
        win?: number,
        draw?: number,
        loss?: number,
        bye?: number,
        tiebreaks?: Array<
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
    stageOne?: {
        format?: 'single-elimination' | 'double-elimination' | 'stepladder' | 'swiss' | 'round-robin' | 'double-round-robin',
        consolation?: boolean,
        rounds?: number,
        initialRound?: number,
        maxPlayers?: number
    },
    stageTwo?: {
        format?: 'single-elimination' | 'double-elimination' | 'stepladder' | null,
        consolation?: boolean,
        advance?: {
            value?: number,
            method?: 'points' | 'rank' | 'all'
        }
    },
    meta?: {
        [key: string]: any
    }
}
