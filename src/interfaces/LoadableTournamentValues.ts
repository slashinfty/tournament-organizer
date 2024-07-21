import { MatchValues } from "./MatchValues.js";
import { PlayerValues } from "./PlayerValues.js";
import { SettableTournamentValues } from "./SettableTournamentValues.js";
import { TournamentValues } from "./TournamentValues.js";

export interface LoadableTournamentValues
  extends Omit<SettableTournamentValues, "matches" | "players"> {
  id: TournamentValues["id"];
  matches: Array<MatchValues>;
  players: Array<PlayerValues>;
}
