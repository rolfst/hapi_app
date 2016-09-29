import { assert } from 'chai';
import Promise from 'bluebird';
import sinon from 'sinon';
import stubs from '../../../../shared/test-utils/stubs';
import blueprints from '../../../../shared/test-utils/blueprints';
import * as networkRepo from '../../../../shared/repositories/network';
import * as client from '../../../../adapters/pmt/client';
import * as service from '../network';

const PMT_BASE_URL = 'https://partner2.testpmt.nl/rest.php/chains';
const AH_BASE_URL = 'https://ah.personeelstool.nl';
const JUMBO_BASE_URL = 'https://jumbo.personeelstool.nl';
const JUMBO_SCHAAF_URL = 'https://jumboschaaf.personeelstool.nl';
const JUMBO_BERGEN_URL = 'https://jumbobergen.personeelstool.nl';

describe('listPristineNetworks', () => {
  it('should return networks', async() => {
    sinon.stub(client.default, 'get')
      .withArgs(PMT_BASE_URL).returns(Promise.resolve({
        payload: stubs.pmt_clients,
      }))
      .withArgs(`${AH_BASE_URL}/stores`).returns(Promise.resolve({
        payload: stubs.ah_stores,
      }))
      .withArgs(`${AH_BASE_URL}/users`).returns(Promise.resolve({
        payload: stubs.users_200,
      }))
      .withArgs(`${JUMBO_BASE_URL}/stores`).returns(Promise.resolve({
        payload: stubs.jumbo_stores,
      }))
      .withArgs(`${JUMBO_SCHAAF_URL}/users`).returns(Promise.resolve({
        payload: stubs.users_200,
      }))
      .withArgs(`${JUMBO_BERGEN_URL}/users`).returns(Promise.resolve({
        payload: stubs.users_200,
      }));

    sinon.stub(networkRepo, 'findAll').returns(Promise.resolve(
      [{
        externalId: 'https://jumbo.personeelstool.nl',
      }, {
        externalId: 'https://ah.personeelstool.nl',
      }, {
        externalId: 'https://overig.personeelstool.nl',
      }]
    ));

    const result = await service.listPristineNetworks();

    client.default.get.restore();
    networkRepo.findAll.restore();

    assert.equal(result.length, 2);
    assert.deepEqual(result, blueprints.admins_pristine_network);
  });
});
