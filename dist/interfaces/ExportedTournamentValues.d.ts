import { MatchValues } from "./MatchValues.js";
import { PlayerValues } from "./PlayerValues.js";
import { TournamentValues } from "./TournamentValues.js";
export interface ExportedTournamentValues extends Omit<TournamentValues, 'players' | 'matches'> {
    players: Array<PlayerValues>;
    matches: Array<MatchValues>;
}
