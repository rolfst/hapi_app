import { assert } from 'chai';
import Promise from 'bluebird';
import sinon from 'sinon';
import { map } from 'lodash';
import stubs from '../../../../shared/test-utils/stubs';
import * as adapterUtil from '../../../../shared/utils/create-adapter';
import userSerializer from '../../../../adapters/pmt/serializers/user';
import * as networkRepo from '../../repositories/network';
import * as client from '../../../../adapters/pmt/client';
import * as service from '../network';

const NETWORK_URL = 'https://jumboschaaf_store.personeelstool.nl';

describe('listAdminsFromNetwork', () => {
  let sandbox;
  before(() => { sandbox = sinon.sandbox.create(); });
  after(() => { sandbox.restore(); });

  it('should return networks', async() => {
    const externalUsers = map(stubs.users_200.data, userSerializer);
    const fakeAdapter = {
      fetchUsers: () => externalUsers,
    };

    sandbox.stub(adapterUtil, 'createAdapter').returns(fakeAdapter);
    sandbox.stub(client.default, 'get')
      .withArgs(`${NETWORK_URL}/users`).returns(Promise.resolve({
        payload: stubs.users_200,
      }));
    sandbox.stub(networkRepo, 'findNetworkById').returns(Promise.resolve({
      externalId: `${NETWORK_URL}/users`,
      integrations: ['PMT'],
      hasIntegrations: true,
    }));

    const result = await service.listAdminsFromNetwork({ networkId: 32 });

    assert.equal(result.length, 0);
  });
});
