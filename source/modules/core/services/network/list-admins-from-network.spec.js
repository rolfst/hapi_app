import { assert } from 'chai';
import Promise from 'bluebird';
import sinon from 'sinon';
import { map } from 'lodash';
import stubs from '../../../../shared/test-utils/stubs';
import * as createAdapter from '../../../../shared/utils/create-adapter';
import userSerializer from '../../../../adapters/pmt/serializers/user';
import * as networkRepo from '../../repositories/network';
import * as client from '../../../../adapters/pmt/client';
import * as service from '../network';

const NETWORK_URL = 'https://jumboschaaf_store.personeelstool.nl';

describe('listAdminsFromNetwork', () => {
  it('should return networks', async() => {
    const externalUsers = map(stubs.users_200.data, userSerializer);
    const fakeAdapter = {
      fetchUsers: () => externalUsers,
    };

    sinon.stub(createAdapter, 'default').returns(fakeAdapter);
    sinon.stub(client.default, 'get')
      .withArgs(`${NETWORK_URL}/users`).returns(Promise.resolve({
        payload: stubs.users_200,
      }));
    sinon.stub(networkRepo, 'findNetworkById').returns(Promise.resolve(
      {
        externalId: `${NETWORK_URL}/users`,
        integrations: ['PMT'],
        hasIntegrations: true,
      }
    ));

    const result = await service.listAdminsFromNetwork({ networkId: 32 });

    client.default.get.restore();
    createAdapter.default.restore();

    assert.equal(result.length, 3);
  });
});
