import { MatchValues } from "./interfaces/MatchValues.js";
import { SettableMatchValues } from "./interfaces/SettableMatchValues.js";
/**
 * Class representing a match.
 *
 * See {@link MatchValues} for detailed descriptions of properties.
 */
export declare class Match {
    /** Unique ID of the match */
    id: MatchValues['id'];
    /** Round number for the match */
    round: MatchValues['round'];
    /** Match number for the match */
    match: MatchValues['match'];
    /** If the match is active */
    active: MatchValues['active'];
    /** If the match is a bye */
    bye: MatchValues['bye'];
    /** Details for player one */
    player1: MatchValues['player1'];
    /** Details for player two */
    player2: MatchValues['player2'];
    /** Next match for winners and losers */
    path: MatchValues['path'];
    /** Any extra information */
    meta: MatchValues['meta'];
    /** Create a new match. */
    constructor(id: string, round: number, match: number);
    /** Set information about the match (only changes in information need to be included in the object) */
    set values(options: SettableMatchValues);
}
