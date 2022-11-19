export interface PlayerValues {
    id: string,
    name: string,
    active: boolean,
    value: number,
    matches: Array<{
        id: string,
        opponent: string | null,
        pairUpDown: boolean,
        bye: boolean,
        win: number,
        loss: number,
        draw: number
    }>
}