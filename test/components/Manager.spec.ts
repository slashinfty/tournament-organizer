import assert from 'assert';
import TournamentOrganizer from '../../src/index.js';
import { Player } from '../../src/components/Player.js';

describe('Manager', function () {
    it('plays a single-elimination tournament with 4 players', function () {
        const organizer = new TournamentOrganizer();

        const tournament = organizer.createTournament('test', {
            players: [
                new Player('1', 'A'),
                new Player('2', 'B'),
                new Player('3', 'C'),
                new Player('4', 'D'),
            ],
        });

        assert.strictEqual(tournament.status, 'setup', 'Tournament status is initialized as "setup"');

        tournament.start();

        assert.strictEqual(tournament.status, 'stage-one', 'Tournament status is now "stage-one"');
        assert.strictEqual(tournament.matches.length, 3, 'There is 3 matches in single elimination with 4 players');
        assert.strictEqual(tournament.matches[0].active, true, 'First match is active');
        assert.strictEqual(tournament.matches[1].active, true, 'Second match is active');
        assert.strictEqual(tournament.matches[2].active, false, 'Final match is not yet active');

        tournament.enterResult(tournament.matches[0].id, 1, 0);
        tournament.enterResult(tournament.matches[1].id, 1, 0);

        assert.strictEqual(tournament.matches[0].active, false, 'First match has ended');
        assert.strictEqual(tournament.matches[1].active, false, 'Second match has ended');
        assert.strictEqual(tournament.matches[2].active, true, 'Final match is now active');
        assert.strictEqual(tournament.matches[2].player1.id, tournament.matches[0].player1.id, 'Final match player1 is the winner from round 1 first match');
        assert.strictEqual(tournament.matches[2].player2.id, tournament.matches[1].player1.id, 'Final match player2 is the winner from round 1 second match');
    });
});
