import { assert } from 'chai';
import nock from 'nock';
import * as stubs from '../../../shared/test-utils/stubs';
import * as testHelper from '../../../shared/test-utils/helpers';
import { getRequest } from '../../../shared/test-utils/request';

const PMT_BASE_URL = 'https://partner2.testpmt.nl';
const PMT_BASE_CHAIN_URL_AH = `https://${stubs.pmt_clients.chains[0].base_url}`;
const PMT_BASE_CHAIN_URL_JUMBO = `https://${stubs.pmt_clients.chains[1].base_url}`;
const JUMBO_SCHAAF_STORE_URL = stubs.jumbo_stores.stores[0].base_store_url;
const JUMBO_BERGEN_STORE_URL = stubs.jumbo_stores.stores[2].base_store_url;


describe('Pristine Networks', async () => {
  nock.disableNetConnect();
  let ahNetwork;
  let justANetwork;
  let jumboNetwork;
  const admin = await testHelper.createUser({ password: 'foobar' });

  before(async () => {
    jumboNetwork = testHelper.createNetworkWithIntegration({
      userId: admin.id,
      externalId: stubs.jumbo_stores.stores[1].base_store_url,
      name: 'Jumbo van Begen Oss',
      integrationName: 'PRISTINE_INTEGRATION',
      integrationToken: 'footoken',
    });

    ahNetwork = testHelper.createNetwork({
      userId: admin.id,
      externalId: stubs.ah_stores.stores[1].base_store_url,
      name: 'AH van Bergen',
      integrationName: 'PRISTINE_INTEGRATION',
    });

    justANetwork = testHelper.createNetwork({
      userId: admin.id,
      externalId: stubs.ah_stores.stores[0].base_store_url,
      name: 'AH Nanne van der Schaaf',
      integrationName: 'PRISTINE_INTEGRATION',
    });

    [jumboNetwork, justANetwork, ahNetwork] = await Promise.all([
      jumboNetwork, justANetwork, ahNetwork]);
  });

  after(async () => testHelper.cleanAll());

  it('should return correct network amount', async () => {
    nock(PMT_BASE_URL)
      .get('/rest.php/chains')
      .reply(200, stubs.pmt_clients);
    nock(PMT_BASE_CHAIN_URL_AH)
      .get('/stores')
      .reply(200, stubs.ah_stores);
    nock(PMT_BASE_CHAIN_URL_JUMBO)
      .get('/stores')
      .reply(200, stubs.jumbo_stores);
    nock(JUMBO_SCHAAF_STORE_URL)
      .get('/users')
      .reply(200, stubs.users_200);
    nock(JUMBO_BERGEN_STORE_URL)
      .get('/users')
      .reply(200, stubs.users_200);

    const { result } = await getRequest('/v2/pristine_networks', admin.token);

    assert.property(result.data[0], 'externalId');
    assert.property(result.data[1], 'name');
    assert.property(result.data[1], 'integrationName');
    assert.property(result.data[1], 'admins');
  });

  it('should fail when integration base endpoint is down', async () => {
    nock(PMT_BASE_URL)
      .get('/rest.php/chains')
      .reply('404');

    const { statusCode } = await getRequest('/v2/pristine_networks', admin.token);

    assert.equal(statusCode, 500);
  });

  it('should fail when client endpoint is down', async () => {
    nock(PMT_BASE_URL)
      .get('/rest.php/chains')
      .reply(200, stubs.pmt_clients);
    nock(PMT_BASE_CHAIN_URL_AH)
      .get('/stores')
      .reply(404);
    nock(PMT_BASE_CHAIN_URL_JUMBO)
      .get('/stores')
      .reply(200, stubs.jumbo_stores);

    const { statusCode } = await getRequest('/v2/pristine_networks', admin.token);

    assert.equal(statusCode, 404);
  });
});
