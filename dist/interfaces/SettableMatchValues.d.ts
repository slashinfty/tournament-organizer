/**
 * All properties that can be set with {@link Match.set}.
 *
 * See {@link MatchValues} for detailed descriptions of properties.
 */
export interface SettableMatchValues {
    round?: number;
    match?: number;
    active?: boolean;
    bye?: boolean;
    loss?: boolean;
    player1?: {
        id?: string | null;
        win?: number;
        loss?: number;
        draw?: number;
    };
    player2?: {
        id?: string | null;
        win?: number;
        loss?: number;
        draw?: number;
    };
    path?: {
        win?: string | null;
        loss?: string | null;
    };
    meta?: {
        [key: string]: any;
    };
}
