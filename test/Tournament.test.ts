import { expect } from "chai";
import { MatchValues } from "../src/interfaces/MatchValues";
import { Player } from "../src/components/Player";
import { Tournament } from "../src/components/Tournament";

describe('Tournament class', () => {
    let tournament: Tournament;
    beforeEach(() => tournament = new Tournament('a1b2c3d4e5f6', 'Test Tournament'));

    describe('Setup', () => {
        it('createPlayer method', () => {
            const firstPlayer = tournament.createPlayer('First Player');

            // firstPlayer is a player
            expect(firstPlayer).to.be.an.instanceOf(Player, 'Created player is not a Player');

            // firstPlayer has the default values
            expect(firstPlayer.getValues()).to.deep.include({
                name: 'First Player',
                active: true,
                value: 0,
                matches: [],
                meta: {}
            }, 'Default player settings do not match');

            const secondPlayer = tournament.createPlayer('Second Player', 'a1b2c3d4e5f6');

            // secondPlayer has custom ID with default values
            expect(secondPlayer.getValues()).to.deep.include({
                id: 'a1b2c3d4e5f6',
                name: 'Second Player',
                active: true,
                value: 0,
                matches: [],
                meta: {}
            }, 'Default player with custom ID settings does not match');

            // error thrown when creating a player with a duplicate ID
            expect(() => tournament.createPlayer('Duplicate Player', 'a1b2c3d4e5f6'), 'Duplicate player created').to.throw();

            tournament.set({
                stageOne: { maxPlayers: 2 }
            });

            // error thrown when attempting to add a player beyond max number of players
            expect(() => tournament.createPlayer('Extra Player'), 'Players allowed beyond set maximum').to.throw();
        });

        it('getPlayer method', () => {
            const defaultPlayer = tournament.createPlayer('Default Player');
            const foundPlayer = tournament.getPlayer(defaultPlayer.getId());

            // foundPlayer is defaultPlayer
            expect(foundPlayer.getValues()).to.deep.equal(defaultPlayer.getValues(), 'Found player does not match');

            // error thrown when no player exists
            expect(() => tournament.getPlayer(''), 'No error on missing player').to.throw();
        });

        it('removePlayer method', () => {
            const defaultPlayer = tournament.createPlayer('Default Player');
            tournament.removePlayer(defaultPlayer.getId());

            // defaultPlayer is no longer active
            expect(defaultPlayer.isActive(), 'Removed player is still active').to.be.false;

            // error thrown when player is already inactive
            expect(() => tournament.removePlayer(defaultPlayer.getId()), 'Removed an inactive player').to.throw();
        });

        it('getActivePlayers method', () => {
            for (let i = 0; i < 5; i++) {
                tournament.createPlayer(`Player ${i + 1}`);
            }

            // gets all players if all players are active
            expect(tournament.getActivePlayers().length).to.equal(5, 'Amount of active players is incorrect');
            expect(tournament.getActivePlayers()).to.deep.equal(tournament.getPlayers(), 'Amount of active players does not match all players when all active');

            tournament.removePlayer(tournament.getPlayers()[0].getId());

            // returns the appropriate number of active players
            expect(tournament.getActivePlayers().length).to.equal(tournament.getPlayers().length - 1, 'Amount of active players does not match all players minus one when all but one is active');
        });

        it('startTournament method', () => {
            // error thrown if not enough players
            expect(() => tournament.startTournament(), 'No error when not enough players to start').to.throw();

            for (let i = 0; i < 4; i++) {
                tournament.createPlayer(`Player ${i + 1}`);
            }
            tournament.startTournament();

            // status is up to date
            expect(tournament.getStatus()).to.equal('stage-one', 'Tournament status is not stage-one after starting');

            // round is accurate set
            expect(tournament.getRoundNumber()).to.equal(tournament.getStageOne().initialRound, 'Starting round number is inaccurate');
        });
    });

    describe('Stage one, single elimination', () => {
        beforeEach(() => {
            for (let i = 0; i < 8; i++) {
                tournament.createPlayer(`Player ${i + 1}`);
            }
            tournament.startTournament();
        });

        it('createPlayer method', () => {
            // error thrown when tournament has started
            expect(() => tournament.createPlayer('Failed Player'), 'Player added to elimination tournament after starting').to.throw();
        });

        it('removePlayer method', () => {
            const removedPlayer = tournament.getPlayer(tournament.getPlayers()[0].getId());
            tournament.removePlayer(removedPlayer.getId());
            const origMatch = tournament.getMatch(removedPlayer.getMatches()[0].id);
            const winMatch = tournament.getMatch(origMatch.getPath().win as string);
            
            // opponent from existing match is moved forward
            expect(winMatch.getPlayer1().id).to.equal((origMatch.getWinner() as MatchValues['player1']).id, 'Opponent of removed player is not moved to appropriate match');
        });

        it('nextRound method', () => {
            // error thrown when trying to nextRound in elimination
            expect(() => tournament.nextRound(), 'No error when next round is called during elimination').to.throw();
        });

        it('enterResult method', () => {
            const match = tournament.getMatch(tournament.getMatches()[0].getId());

            // error thrown if wins are more than allowed
            expect(() => tournament.enterResult(match.getId(), tournament.getScoring().bestOf + 1, 0), 'No error when more wins than possible is entered').to.throw();

            // error thrown if a draw
            expect(() => tournament.enterResult(match.getId(), 0, 0), 'No error when players draw in elimination').to.throw();

            tournament.enterResult(match.getId(), Math.round(tournament.getScoring().bestOf / 2), 0);

            // match is inactive
            expect(match.isActive(), 'Match is still active after entered result').to.be.false;

            // player one's scores are updated in Match
            expect(match.getPlayer1()).to.deep.include({
                win: Math.round(tournament.getScoring().bestOf / 2),
                loss: 0
            }, `Player one's scores not updated correctly`);

            // player one's scores are updated in Match
            expect(match.getPlayer2()).to.deep.include({
                win: 0,
                loss: Math.round(tournament.getScoring().bestOf / 2)
            }, `Player two's scores not updated correctly`);

            // winner's match is updated in Player
            expect(tournament.getPlayer(match.getPlayer1().id as string).getMatches().find(m => m.id === match.getId())).to.deep.include({
                opponent: match.getPlayer2().id,
                win: Math.round(tournament.getScoring().bestOf / 2),
                loss: 0,
                draw: 0
            }, `Winner's match not updated correctly`);

            // loser's match is updated in Player
            expect(tournament.getPlayer(match.getPlayer2().id as string).getMatches().find(m => m.id === match.getId())).to.deep.include({
                opponent: match.getPlayer1().id,
                win: 0,
                loss: Math.round(tournament.getScoring().bestOf / 2),
                draw: 0
            }, `Loser's match not updated correctly`)

            // loser is now inactive
            expect(tournament.getPlayer((match.getLoser() as MatchValues['player1']).id as string).isActive(), 'Loser is still active in single elimination').to.be.false;

            const winMatch = tournament.getMatch(match.getPath().win as string);

            // winner moved to next match
            expect(winMatch.getPlayer1().id).to.equal((match.getWinner() as MatchValues['player1']).id, 'Winner is not moved to appropriate match');
        });

        it('clearResult method', () => {
            const match = tournament.getMatch(tournament.getMatches()[0].getId());

            // error thrown is match is currently active
            expect(() => tournament.clearResult(match.getId()), 'No error when clearing an active match').to.throw();

            tournament.enterResult(match.getId(), Math.round(tournament.getScoring().bestOf / 2), Math.round(tournament.getScoring().bestOf / 2) - 1, 1);
            tournament.clearResult(match.getId());

            // match is active
            expect(match.isActive(), 'Match is still inactive after clearing result').to.be.true;

            // player one's scores are reset in Match
            expect(match.getPlayer1()).to.deep.include({
                win: 0,
                loss: 0,
                draw: 0
            }, `Player one's scores not reset`);

            // player two's scores are reset in Match
            expect(match.getPlayer2()).to.deep.include({
                win: 0,
                loss: 0,
                draw: 0
            }, `Player two's scores not reset`);

            // player one's match is reset in Player
            expect(tournament.getPlayer(match.getPlayer1().id as string).getMatches().find(m => m.id === match.getId())).to.deep.include({
                win: 0,
                loss: 0,
                draw: 0
            }, `Player one's match not reset`);

            // player two's match is reset in Player
            expect(tournament.getPlayer(match.getPlayer2().id as string).getMatches().find(m => m.id === match.getId())).to.deep.include({
                win: 0,
                loss: 0,
                draw: 0
            }, `Player two's match not reset`);

            const winMatch = tournament.getMatch(match.getPath().win as string);

            // player one is not part of the winning match
            expect(winMatch.getPlayer1().id).to.not.equal(match.getPlayer1().id, `Player one is player one in winning match`);
            expect(winMatch.getPlayer2().id).to.not.equal(match.getPlayer1().id, `Player one is player two in winning match`);
            expect(tournament.getPlayer(match.getPlayer1().id as string).getMatches().some(m => m.id === winMatch.getId()), `Winning match is included in player one's matches`).to.be.false;
        });

        it('assignBye method', () => {
            // error thrown when assigning a bye in non-Swiss
            expect(() => tournament.assignBye(tournament.getPlayers()[0].getId(), tournament.getRoundNumber() + 1), `Allowed to assign bye in single elimination`).to.throw();
        });

        it('assignLoss method', () => {
            // error thrown when assigning a loss in non-Swiss
            expect(() => tournament.assignLoss(tournament.getPlayers()[0].getId(), tournament.getRoundNumber() + 1), `Allowed to assign loss in single elimination`).to.throw();
        });
    });
});