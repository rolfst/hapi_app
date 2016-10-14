import { assert } from 'chai';
import Promise from 'bluebird';
import sinon from 'sinon';
import stubs from '../../../../shared/test-utils/stubs';
import blueprints from '../../../../shared/test-utils/blueprints';
import * as networkRepo from '../../repositories/network';
import * as client from '../../../../adapters/pmt/client';
import * as service from '../network';

const PMT_BASE_URL = 'https://partner2.testpmt.nl/rest.php/chains';
const AH_CHAIN_URL = 'https://ah_chain.personeelstool.nl';
const JUMBO_CHAIN_URL = 'https://jumbo_chain.personeelstool.nl';
const JUMBO_SCHAAF_STORE_URL = 'https://jumboschaaf_store.personeelstool.nl';
const JUMBO_BERGEN_STORE_URL = 'https://jumbobergen_store.personeelstool.nl';

describe('listPristineNetworks', () => {
  it('should return networks', async() => {
    sinon.stub(client.default, 'get')
      .withArgs(PMT_BASE_URL).returns(Promise.resolve({
        payload: stubs.pmt_clients,
      }))
      .withArgs(`${AH_CHAIN_URL}/stores`).returns(Promise.resolve({
        payload: stubs.ah_stores,
      }))
      .withArgs(`${AH_CHAIN_URL}/users`).returns(Promise.resolve({
        payload: stubs.users_200,
      }))
      .withArgs(`${JUMBO_CHAIN_URL}/stores`).returns(Promise.resolve({
        payload: stubs.jumbo_stores,
      }))
      .withArgs(`${JUMBO_SCHAAF_STORE_URL}/users`).returns(Promise.resolve({
        payload: stubs.users_200,
      }))
      .withArgs(`${JUMBO_BERGEN_STORE_URL}/users`).returns(Promise.resolve({
        payload: stubs.users_200,
      }));

    sinon.stub(networkRepo, 'findAll').returns(Promise.resolve(
      [{
        externalId: 'https://jumbo_store.personeelstool.nl',
      }, {
        externalId: 'https://ah_store.personeelstool.nl',
      }, {
        externalId: 'https://overig_store.personeelstool.nl',
      }]
    ));

    const result = await service.listPristineNetworks();

    client.default.get.restore();
    networkRepo.findAll.restore();

    assert.equal(result.length, 2);
    assert.deepEqual(result, blueprints.admins_pristine_network);
  });
});
