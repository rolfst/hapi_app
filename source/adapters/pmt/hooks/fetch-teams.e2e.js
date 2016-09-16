import { assert } from 'chai';
import nock from 'nock';
import * as stubs from '../test-utils/stubs';
import * as blueprints from '../test-utils/blueprints';
import hook from './fetch-teams';

nock.disableNetConnect();

const ENDPOINT = '/departments';

describe('PMT fetch teams hook', () => {
  it('should succeed when credentials are correct', async () => {
    const credential = { username: 'validUsername', password: 'validPassword' };

    nock(global.networks.pmt.externalId)
      .get(ENDPOINT)
      .reply('200', stubs.departments_200);

    const actual = await hook(global.networks.pmt.externalId)(credential);
    const expected = blueprints.teams;

    assert.deepEqual(actual, expected);
  });
});
