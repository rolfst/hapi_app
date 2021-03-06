const { assert } = require('chai');
const R = require('ramda');
const testHelper = require('../../../../shared/test-utils/helpers');
const pollService = require('./index');
const messageService = require('../../../feed/services/message');

describe('Service: Poll', () => {
  let employee;
  let flexAppeal;
  let pmt;
  let message;
  let defaultPayload;
  let defaultVotePayload;

  let createdMessage;

  before(async () => {
    const [admin, user] = await Promise.all([
      testHelper.createUser(),
      testHelper.createUser(),
    ]);
    employee = user;

    const { network } = await testHelper.createNetworkWithIntegration({
      userId: admin.id,
      token: 'footoken',
      externalId: 'http://external.com',
      name: 'pmt',
      integrationName: 'PMT',
    });
    pmt = network;
    flexAppeal = await testHelper.createNetwork({ userId: admin.id, name: 'flexappeal' });

    message = { credentials: { id: employee.id } };

    createdMessage = await messageService.createWithoutObject({
      text: 'meh',
    }, { credentials: admin });

    defaultPayload = {
      messageId: createdMessage.id,
      question: 'help in what way?',
      options: ['Option A', 'Option B', 'Option C'],
    };
    defaultVotePayload = { networkId: flexAppeal.id };
  });

  after(() => testHelper.cleanAll());

  it('should create a poll', async () => {
    const poll = await pollService.create(defaultPayload, message);
    const actual = poll;

    assert.equal(actual.type, 'poll');
    assert.equal(actual.messageId, createdMessage.id);
    assert.equal(actual.totalVoteCount, 0);
    assert.equal(actual.question, 'help in what way?');
    assert.lengthOf(actual.options, 3);
    assert.equal(actual.options[0].text, 'Option A');
    assert.equal(actual.options[1].text, 'Option B');
    assert.equal(actual.options[2].text, 'Option C');
    assert.equal(actual.options[0].vote_count, 0);
  });

  it('should be able to vote', async () => {
    const poll = await pollService.create(defaultPayload, message);
    const payload = R.merge(defaultVotePayload,
    { pollId: poll.id, optionIds: [poll.options[1].id] });

    const actual = await pollService.vote(payload, message);

    assert.equal(actual.totalVoteCount, 1);
    assert.equal(actual.options[0].vote_count, 0);
    assert.equal(actual.options[1].vote_count, 1);
    assert.equal(actual.options[2].vote_count, 0);
    assert.deepEqual(actual.voteResult, [actual.options[1].id]);
  });

  it('should be able to vote for multiple options', async () => {
    const { id: pollId, options } = await pollService.create(defaultPayload, message);
    const payload = R.merge(defaultVotePayload,
      { pollId, optionIds: [options[1].id, options[2].id] });

    const actual = await pollService.vote(payload, message);

    assert.equal(actual.totalVoteCount, 1);
    assert.equal(actual.options[0].vote_count, 0);
    assert.equal(actual.options[1].vote_count, 1);
    assert.equal(actual.options[2].vote_count, 1);
    assert.deepEqual(actual.voteResult, [actual.options[1].id, actual.options[2].id]);
  });

  it('should be able to vote after already having voted', async () => {
    const { id: pollId, options } = await pollService.create(defaultPayload, message);

    const payload = R.merge(defaultVotePayload,
      { pollId, optionIds: [options[1].id, options[2].id] });
    await pollService.vote(payload, message);

    const newVotePayload = R.merge(defaultVotePayload,
        { pollId, optionIds: [options[0].id] });
    const actual = await pollService.vote(newVotePayload, message);

    assert.equal(actual.totalVoteCount, 1);
    assert.equal(actual.options[0].vote_count, 1);
    assert.equal(actual.options[1].vote_count, 0);
    assert.equal(actual.options[2].vote_count, 0);
    assert.deepEqual(actual.voteResult, [actual.options[0].id]);
  });

  it('should fail when poll doesn\'t exist', async () => {
    const payload = R.merge(defaultVotePayload,
      { pollId: '123456789', optionIds: ['1'] });

    return assert.isRejected(pollService.vote(payload, message),
      'User does not have enough privileges to access this resource.');
  });

  // Fix when acl's are implemented
  it.skip('should fail when user doesn\'t belong to network', async () => {
    const { id: pollId, options } = await pollService.create(defaultPayload, message);

    const payload = { networkId: pmt.id, pollId, optionIds: [options[1].id, options[2].id] };

    return assert.isRejected(pollService.vote(payload, message),
      'User does not have enough privileges to access this resource.');
  });
});
