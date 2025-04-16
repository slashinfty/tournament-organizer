import assert from 'assert';
import TournamentOrganizer from '../../src/index.js';
import { Player } from '../../src/components/Player.js';

describe('Manager', () => {
    it('plays a single-elimination tournament with 4 players', () => {
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

    it('can export tournament to store it somewhere, and reload it', () => {
        const organizer = new TournamentOrganizer();

        const tournament = organizer.createTournament('test', {
            players: [
                new Player('1', 'A'),
                new Player('2', 'B'),
                new Player('3', 'C'),
                new Player('4', 'D'),
            ],
        });

        tournament.start();

        tournament.meta['tournamentMeta'] = 'tournamentMetaOk';
        tournament.matches[0].meta['matchMeta'] = 'matchMetaOk';
        tournament.players[0].meta['playerMeta'] = 'playerMetaOk';

        assert.strictEqual(tournament.matches.length, 3);
        assert.strictEqual(tournament.players.length, 4);
        assert.strictEqual(tournament.meta['tournamentMeta'], 'tournamentMetaOk');
        assert.strictEqual(tournament.matches[0].meta['matchMeta'], 'matchMetaOk');
        assert.strictEqual(tournament.players[0].meta['playerMeta'], 'playerMetaOk');

        // Simulate storing tournament to database or any storage
        const json = JSON.stringify(tournament);

        // Simulate reloading tournament from database or any storage
        const organizer2 = new TournamentOrganizer();

        const tournament2 = organizer2.reloadTournament(JSON.parse(json));

        assert.strictEqual(tournament2.matches.length, 3);
        assert.strictEqual(tournament2.players.length, 4);
        assert.strictEqual(tournament2.meta['tournamentMeta'], 'tournamentMetaOk', 'Meta properties on tournament should not be lost');
        assert.strictEqual(tournament2.matches[0].meta['matchMeta'], 'matchMetaOk', 'Meta properties on matches should not be lost');
        assert.strictEqual(tournament2.players[0].meta['playerMeta'], 'playerMetaOk', 'Meta properties on players should not be lost');
    });

    it('creates a round robin tournament with 3 players', () => {
        const organizer = new TournamentOrganizer();

        const tournament = organizer.createTournament('test', {
            stageOne: {
                format: 'round-robin',
            },
            players: [
                new Player('a', 'a'),
                new Player('b', 'b'),
                new Player('c', 'c'),
            ],
        });

        tournament.start();

        // there is 3 bye matches
        const byeMatches = tournament.matches.filter(match => !match.player1.id || !match.player2.id);

        assert.strictEqual(byeMatches.length, 3);
        assert.ok(byeMatches.every(match => match.bye));
    });
});
