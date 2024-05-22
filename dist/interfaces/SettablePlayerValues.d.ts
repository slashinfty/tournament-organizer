/**
 * All properties that can be set with {@link Player.values}.
 *
 * See {@link PlayerValues} for detailed descriptions of properties.
 */
export interface SettablePlayerValues {
    name?: string;
    active?: boolean;
    value?: number;
    matches?: Array<{
        id: string;
        opponent: string | null;
        pairUpDown: boolean;
        color: 'w' | 'b' | null;
        bye: boolean;
        win: number;
        loss: number;
        draw: number;
    }>;
    meta?: {
        [key: string]: any;
    };
}
