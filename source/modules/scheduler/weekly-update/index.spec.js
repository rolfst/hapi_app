const { assert } = require('chai');
const sinon = require('sinon');
const moment = require('moment');
const mailer = require('../../../shared/services/mailer');
const messageTemplate = require('../../../shared/mails/templates/message');
const colleagueTemplate = require('../../../shared/mails/templates/colleague');
const weeklyUpdate = require('./index');
const userService = require('../../core/services/user');
const impl = require('./implementation');
const networkRepository = require('../../core/repositories/network');
const dateUtils = require('../../../shared/utils/date');

const createMessage = (id, parent, text, likesCount, commentsCount, children = []) =>
  Object.assign(parent, {
    id,
    user: { id: '1', email: 'liam+super@flex-appeal.nl' },
    source: { text, likesCount, commentsCount },
    children,
    score: (commentsCount * 2) + likesCount,
  });

describe('Weekly update', () => {
  let sandbox;
  before(() => {
    sandbox = sinon.sandbox.create();

    const network = {
      id: '1',
      name: 'Foo Network',
      superAdmin: { fullName: 'Super Admin', email: 'liam+super@flex-appeal.nl' },
    };
    const users = [
      {
        id: '1',
        email: 'liam+1@flex-appeal.nl',
        teamIds: ['1'],
        invitedAt: dateUtils.toISOString(moment().subtract(2, 'week')),
      }, {
        id: '2',
        email: 'liam+2@flex-appeal.nl',
        teamIds: ['1', '2'],
        invitedAt: dateUtils.toISOString(moment().subtract(4, 'day')),
      }, {
        id: '3',
        email: 'liam+3@flex-appeal.nl',
        teamIds: ['1', '2'],
        invitedAt: dateUtils.toISOString(moment().subtract(2, 'day')),
      },
    ];
    const teams = [
      { id: '1', name: 'Team A' },
      { id: '2', name: 'Team B' },
    ];
    const messages = [
      createMessage('1', { parentType: 'network' }, 'A', 0, 1),
      createMessage('2', { parentType: 'network' }, 'B', 0, 2),
      createMessage('3', { parentType: 'team', parentId: '1' }, 'C', 1, 2),
      createMessage('4', { parentType: 'team', parentId: '1' }, 'D', 0, 2),
      createMessage('5', { parentType: 'team', parentId: '2' }, 'E', 4, 1),
      createMessage('6', { parentType: 'team', parentId: '2' }, 'F', 2, 0),
      createMessage('7', { parentType: 'team', parentId: '3' }, 'G', 1, 2),
    ];

    const createMessageHTML = (message) => `<b>${message.id}</b>`;
    const createColleagueHTML = (user) => `<b>${user.id}</b>`;

    sandbox.stub(networkRepository, 'findNetworkById').returns(Promise.resolve(network));
    sandbox.stub(networkRepository, 'findUsersForNetwork').returns(Promise.resolve(users));
    sandbox.stub(networkRepository, 'findTeamsForNetwork').returns(Promise.resolve(teams));
    sandbox.stub(impl, 'findMessagesForNetwork').returns(Promise.resolve(messages));
    sandbox.stub(userService, 'listUsersWithNetworkScope').returns(Promise.resolve(users));
    sandbox.stub(mailer, 'send').returns(null);
    sandbox.stub(messageTemplate, 'create', createMessageHTML);
    sandbox.stub(colleagueTemplate, 'create', createColleagueHTML);
  });
  afterEach(() => (sandbox.restore()));

  it('should send mails to all users', async () => {
    await weeklyUpdate.send({ networkId: '1' });

    const expected = {
      sender: { name: 'Super Admin', email: 'liam+super@flex-appeal.nl' },
      subject: 'Wekelijkse update - Foo Network',
      networkName: 'Foo Network',
      colleagues: '<div><b>2</b><b>3</b></div>',
    };

    const actualFirstMail = mailer.send.args[0][0];
    const actualSecondMail = mailer.send.args[1][0];

    assert.deepEqual(actualFirstMail.options.sender, expected.sender);
    assert.equal(actualFirstMail.options.subject, expected.subject);
    assert.equal(actualFirstMail.data['-networkName-'], expected.networkName);
    assert.equal(actualFirstMail.data['-colleagues-'], expected.colleagues);
    assert.deepEqual(actualFirstMail.options.receiver, [{ email: 'liam+1@flex-appeal.nl' }]);
    assert.equal(actualFirstMail.data['-messages-'], '<div><b>3</b><b>2</b><b>4</b></div>');
    assert.isDefined(actualFirstMail.data['-dates-']);

    assert.deepEqual(actualSecondMail.options.sender, expected.sender);
    assert.equal(actualSecondMail.options.subject, expected.subject);
    assert.equal(actualSecondMail.data['-networkName-'], expected.networkName);
    assert.equal(actualSecondMail.data['-colleagues-'], expected.colleagues);
    assert.equal(actualSecondMail.data['-messages-'], '<div><b>5</b><b>3</b><b>2</b></div>');
    assert.deepEqual(actualSecondMail.options.receiver, [
      { email: 'liam+2@flex-appeal.nl' }, { email: 'liam+3@flex-appeal.nl' },
    ]);
    assert.isDefined(actualSecondMail.data['-dates-']);
  });

  it('should fail when network doesn\'t exist', async () => {
    sandbox.stub(networkRepository, 'findNetworkById').returns(Promise.resolve(null));

    assert.isRejected(weeklyUpdate.send({ networkId: 'unknown' }));
  });
});
