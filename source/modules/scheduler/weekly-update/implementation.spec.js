const { assert } = require('chai');
const sinon = require('sinon');
const R = require('ramda');
const moment = require('moment');
const impl = require('./implementation');
const networkRepo = require('../../core/repositories/network');
const dateUtils = require('../../../shared/utils/date');

const createMessage = (id, parent, text, likesCount, commentsCount, children = []) =>
  Object.assign(parent, {
    id,
    userId: '1',
    source: { text, likesCount, commentsCount },
    children,
  });

describe('Weekly update implementation', () => {
  let sandbox;

  before(() => {
    sandbox = sinon.sandbox.create();

    sandbox.stub(networkRepo, 'findTeamsForNetwork').returns(Promise.resolve([
      { id: '1', name: 'Team A' },
      { id: '2', name: 'Team B' },
    ]));
  });

  afterEach(() => (sandbox.restore()));

  describe('calculateScore', () => {
    it('should calculate a score for a message', () => {
      const actual = impl.calculateScore({ source: { likesCount: '4', commentsCount: '2' } });

      assert.equal(actual, '8');
    });
  });

  describe('getTopMessagesForBundle', () => {
    it('should retrieve top 3 messages for a single team and network', () => {
      const bundle = { teamIds: ['1'] };
      const messages = [
        createMessage('1', { parentType: 'network' }, 'A', 1, 0),
        createMessage('2', { parentType: 'team', parentId: '1' }, 'B', 2, 0),
        createMessage('3', { parentType: 'team', parentId: '2' }, 'C', 0, 2),
        createMessage('4', { parentType: 'network' }, 'D', 1, 1),
      ];
      const preparedMessages = R.sort(R.descend(impl.calculateScore), messages);

      const actual = impl.getTopMessagesForBundle(bundle, preparedMessages);

      assert.equal(actual[0].id, '4');
      assert.equal(actual[1].id, '2');
      assert.equal(actual[2].id, '1');
    });

    it('should retrieve top 3 messages for two teams and network', () => {
      const bundle = { teamIds: ['1', '2'] };
      const messages = [
        createMessage('1', { parentType: 'network' }, 'A', 2, 1),
        createMessage('2', { parentType: 'team', parentId: '1' }, 'B', 1, 2),
        createMessage('3', { parentType: 'team', parentId: '2' }, 'C', 0, 1),
        createMessage('4', { parentType: 'team', parentId: '3' }, 'D', 0, 3),
        createMessage('5', { parentType: 'network' }, 'E', 1, 0),
      ];
      const preparedMessages = R.sort(R.descend(impl.calculateScore), messages);

      const actual = impl.getTopMessagesForBundle(bundle, preparedMessages);

      assert.equal(actual[0].id, '2');
      assert.equal(actual[1].id, '1');
      assert.equal(actual[2].id, '3');
    });

    it('should retrieve top 3 messages for just network', () => {
      const bundle = { teamIds: [] };
      const messages = [
        createMessage('1', { parentType: 'network' }, 'A', 2, 1),
        createMessage('2', { parentType: 'network' }, 'B', 2, 2),
        createMessage('3', { parentType: 'network' }, 'C', 2, 0),
      ];
      const preparedMessages = R.sort(R.descend(impl.calculateScore), messages);

      const actual = impl.getTopMessagesForBundle(bundle, preparedMessages);

      assert.equal(actual[0].id, '2');
      assert.equal(actual[1].id, '1');
      assert.equal(actual[2].id, '3');
    });
  });

  describe('isInvitedLastWeek', () => {
    it('should return true if the user has been invited in the previous week', () => {
      const user = { invitedAt: dateUtils.toISOString(moment().subtract(2, 'days')) };

      const actual = impl.isInvitedLastWeek(user);

      assert.isTrue(actual);
    });

    it('should return false if the user has been invited before the previous week', () => {
      const user = { invitedAt: dateUtils.toISOString(moment().subtract(2, 'weeks')) };

      const actual = impl.isInvitedLastWeek(user);

      assert.isFalse(actual);
    });
  });

  describe('createBundles', () => {
    it('should create an unique key for teams', () => {
      const expected = '1-2-3';

      const actual = impl.uniqueTeamIds({ teamIds: ['1', '2', '3'] });

      assert.equal(actual, expected);
    });

    it('should transform values to usable objects', () => {
      const bundledUsers = [
        { email: 'test1@flex-appeal.nl', teamIds: ['1', '2'] },
        { email: 'test2@flex-appeal.nl', teamIds: ['1', '2'] },
      ];

      const expected = {
        teamIds: ['1', '2'],
        mailTo: ['test1@flex-appeal.nl', 'test2@flex-appeal.nl'],
      };

      const actual = impl.transformBundleData(bundledUsers);

      assert.deepEqual(actual, expected);
    });

    it('should create bundles', () => {
      const users = [
        { id: '1', email: 'liam+1@flex-appeal.nl', teamIds: ['1'] },
        { id: '2', email: 'liam+2@flex-appeal.nl', teamIds: ['1', '2'] },
        { id: '3', email: 'liam+3@flex-appeal.nl', teamIds: ['1', '2'] },
        { id: '4', email: 'liam+4@flex-appeal.nl', teamIds: [] },
      ];

      const expected = [
        { teamIds: ['1'], mailTo: ['liam+1@flex-appeal.nl'] },
        { teamIds: ['1', '2'], mailTo: ['liam+2@flex-appeal.nl', 'liam+3@flex-appeal.nl'] },
        { teamIds: [], mailTo: ['liam+4@flex-appeal.nl'] },
      ];

      const actual = impl.createBundles(users);

      assert.deepEqual(actual, expected);
    });
  });

  describe('addTeamsToUser', () => {
    it('should add team objects to the user object', () => {
      const user = { teamIds: ['1'] };
      const expected = Object.assign(user, { teams: [{ id: '1' }] });

      const lookup = { 1: { id: '1' }, 2: { id: '2' } };
      const actual = impl.addTeamsToUser(user, lookup);

      assert.deepEqual(actual, expected);
    });

    it('should excluse teams which can\'t be found', () => {
      const user = { teamIds: ['1', '2'] };
      const expected = Object.assign(user, { teams: [{ id: '1' }] });

      const lookup = { 1: { id: '1' } };
      const actual = impl.addTeamsToUser(user, lookup);

      assert.deepEqual(actual, expected);
    });
  });

  describe('isValidBundle', () => {
    it('should return true when bundle has messages', () => {
      const actual = impl.isValidBundle({ messages: [{}] }, []);

      assert.isTrue(actual);
    });

    it('should return true when there are new colleagues', () => {
      const actual = impl.isValidBundle({ messages: [] }, [{}]);

      assert.isTrue(actual);
    });

    it('should return true when bundle has messages and new colleagues', () => {
      const actual = impl.isValidBundle({ messages: [{}] }, [{}]);

      assert.isTrue(actual);
    });

    it('should return false there are no messages or new colleagues', () => {
      const actual = impl.isValidBundle({ messages: [] }, []);

      assert.isFalse(actual);
    });
  });

  describe('isValidMessageForMail', () => {
    it('should return true when message has text', () => {
      const message = { children: [], source: { text: 'Message' } };
      const actual = impl.isValidMessageForMail(message);

      assert.isTrue(actual);
    });

    it('should return true when message has no text but an attachment', () => {
      const message = { children: [{ objectType: 'attachment' }], source: { text: null } };
      const actual = impl.isValidMessageForMail(message);

      assert.isTrue(actual);
    });

    it('should return true when message has text and a poll', () => {
      const message = { children: [{ objectType: 'poll' }], source: { text: 'Message' } };
      const actual = impl.isValidMessageForMail(message);

      assert.isTrue(actual);
    });

    it('should false when message has no text and no attachments', () => {
      const message = { children: [], source: { text: null } };
      const actual = impl.isValidMessageForMail(message);

      assert.isFalse(actual);
    });

    it('should false when message has no text but a poll', () => {
      const message = { children: [{ objectType: 'poll' }], source: { text: null } };
      const actual = impl.isValidMessageForMail(message);

      assert.isFalse(actual);
    });
  });

  describe('prepareMessages', () => {
    it('should return a list of messages with additional information', () => {
      const messages = [
        createMessage('1', { parentType: 'network' }, 'A', 2, 1),
        createMessage('2', { parentType: 'network' }, 'B', 2, 2),
        createMessage('3', { parentType: 'network' }, 'C', 2, 0),
      ];
      const users = [{ id: '1', email: 'liam+1@flex-appeal.nl' }];
      const lookups = {
        network: { id: '1', name: 'Foo Network' },
        teams: {},
      };

      const expected = [
        {
          id: '1',
          children: [],
          parentType: 'network',
          source: { text: 'A', likesCount: 2, commentsCount: 1 },
          parent: { id: '1', name: 'Foo Network' },
          score: 4,
          userId: '1',
          user: { id: '1', email: 'liam+1@flex-appeal.nl' },
        },
        {
          id: '2',
          children: [],
          parentType: 'network',
          source: { text: 'B', likesCount: 2, commentsCount: 2 },
          parent: { id: '1', name: 'Foo Network' },
          score: 6,
          userId: '1',
          user: { id: '1', email: 'liam+1@flex-appeal.nl' },
        },
        {
          id: '3',
          children: [],
          parentType: 'network',
          source: { text: 'C', likesCount: 2, commentsCount: 0 },
          parent: { id: '1', name: 'Foo Network' },
          score: 2,
          userId: '1',
          user: { id: '1', email: 'liam+1@flex-appeal.nl' },
        },
      ];

      const actual = impl.prepareMessages(users, lookups)(messages);

      assert.deepEqual(actual, expected);
    });
  });
});
