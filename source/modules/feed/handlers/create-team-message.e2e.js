const R = require('ramda');
const { assert } = require('chai');
const { postRequest } = require('../../../shared/test-utils/request');
const testHelpers = require('../../../shared/test-utils/helpers');
const { ERoleTypes } = require('../../core/definitions');

describe('Handler: Create team message', () => {
  let admin;

  const pollFixture = {
    poll_options: [
      'Io',
      'Lol',
      'Lol',
    ],
    files: [],
    text: 'Test',
    poll_question: 'POlly',
  };

  let createUrl;

  before(async () => {
    admin = await testHelpers.createUser();

    const network = await testHelpers.createNetwork({ userId: admin.id });

    const [team] = await Promise.all([
      testHelpers.createTeamInNetwork(network.id),
      testHelpers.addUserToNetwork({
        userId: admin.id,
        networkId: network.id,
        roleType: ERoleTypes.ADMIN,
      }),
    ]);

    createUrl = `/v3/teams/${team.id}/feed`;
  });

  after(() => testHelpers.cleanAll());

  it('should create a poll', async () => {
    const { statusCode, result } = await postRequest(createUrl, pollFixture, admin.token);

    assert.equal(statusCode, 200);
    assert.isArray(result.data.children);

    const pollChild = R.find(R.propEq('object_type', 'poll'), result.data.children);

    assert.isDefined(pollChild);
    assert.lengthOf(pollChild.source.options, 3);
  });
});
