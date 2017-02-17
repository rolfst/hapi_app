import { assert } from 'chai';
import nock from 'nock';
import * as testHelper from '../../../shared/test-utils/helpers';
import * as stubs from '../test-utils/stubs';
import * as blueprints from '../test-utils/blueprints';
import hook from './fetch-teams';

const ENDPOINT = '/departments';

describe('PMT fetch teams hook', () => {
  nock.disableNetConnect();

  it('should succeed when credentials are correct', async () => {
    const credentials = { username: 'validUsername', password: 'validPassword' };

    nock(testHelper.DEFAULT_NETWORK_EXTERNALID)
      .get(ENDPOINT)
      .reply('200', stubs.departments_200);

    const actual = await hook(testHelper.DEFAULT_NETWORK_EXTERNALID)(credentials);
    const expected = blueprints.teams;

    assert.deepEqual(actual, expected);
  });
});
