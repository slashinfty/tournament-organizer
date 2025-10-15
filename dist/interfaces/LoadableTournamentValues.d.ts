import { MatchValues } from './MatchValues.js';
import { PlayerValues } from './PlayerValues.js';
import { TournamentValues } from './TournamentValues.js';
/**
 * Properties of tournaments to be loaded with {@link Manager.loadTournament}
 *
 * The only difference from {@link TournamentValues} is that matches and players are arrays of {@link MatchValues} and {@link PlayerValues}, respectively, as opposed to arrays of the classes.
 *
 * See {@link TournamentValues} for detailed descriptions of properties.
 */
export interface LoadableTournamentValues extends Omit<TournamentValues, 'matches' | 'players'> {
    matches: Array<MatchValues>;
    players: Array<PlayerValues>;
}
