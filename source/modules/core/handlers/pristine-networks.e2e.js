import { assert } from 'chai';
import nock from 'nock';
import * as stubs from '../../../shared/test-utils/stubs';
import { getRequest } from 'shared/test-utils/request';
import * as networkRepo from '../../../shared/repositories/network';
import * as integrationRepo from '../../../shared/repositories/integration';

const PMT_BASE_URL = 'https://partner2.testpmt.nl';
const PMT_BASE_NETWORK_URL_AH = 'https://ah.personeelstool.nl';
const PMT_BASE_NETWORK_URL_JUMBO = 'https://jumbo.personeelstool.nl';
const JUMBO_SCHAAF_URL = 'https://jumboschaaf.personeelstool.nl';
const JUMBO_BERGEN_URL = 'https://jumbobergen.personeelstool.nl';

nock.disableNetConnect();

describe('Pristine Networks', async () => {
  let integration;
  let ahNetwork;
  let justANetwork;
  let jumboNetwork;

  before(async () => {
    integration = await integrationRepo.createIntegration({
      name: 'PRISTINE_INTEGRATION',
      token: 'footoken',
    });

    jumboNetwork = networkRepo.createIntegrationNetwork({
      userId: global.users.admin.id,
      externalId: 'https://jumbo.personeelstool.nl',
      name: 'Jumbo van Begen Oss',
      integrationName: 'PRISTINE_INTEGRATION',
    });

    justANetwork = networkRepo.createIntegrationNetwork({
      userId: global.users.admin.id,
      externalId: 'https://overig.personeelstool.nl',
      name: 'AH Nanne van der Schaaf',
      integrationName: 'PRISTINE_INTEGRATION',
    });

    ahNetwork = networkRepo.createIntegrationNetwork({
      userId: global.users.admin.id,
      externalId: 'https://ah.personeelstool.nl',
      name: 'AH van Bergen',
      integrationName: 'PRISTINE_INTEGRATION',
    });

    const createdNetworks = await Promise.all([jumboNetwork, justANetwork, ahNetwork]);
    [jumboNetwork, justANetwork, ahNetwork] = createdNetworks;
  });

  after(async () => {
    await integration.destroy();
    await Promise.all([
      jumboNetwork.destroy(),
      ahNetwork.destroy(),
      justANetwork.destroy(),
    ]);
  });

  it('should return correct network amount', async () => {
    nock(PMT_BASE_URL)
      .get('/rest.php/chains')
      .reply(200, stubs.pmt_clients);
    nock(PMT_BASE_NETWORK_URL_AH)
      .get('/stores')
      .reply(200, stubs.ah_stores);
    nock(PMT_BASE_NETWORK_URL_JUMBO)
      .get('/stores')
      .reply(200, stubs.jumbo_stores);
    nock(JUMBO_SCHAAF_URL)
      .get('/users')
      .reply(200, stubs.users_200);
    nock(JUMBO_BERGEN_URL)
      .get('/users')
      .reply(200, stubs.users_200);

    const { result: { data } } = await getRequest('/v2/pristine_networks');

    assert.property(data[0], 'externalId');
    assert.property(data[1], 'name');
  });

  it('should fail when integration base endpoint is down', async () => {
    nock(PMT_BASE_URL)
      .get('/rest.php/chains')
      .reply('404');

    const { statusCode } = await getRequest('/v2/pristine_networks');

    assert.equal(statusCode, 500);
  });

  it('should fail when client endpoint is down', async () => {
    nock(PMT_BASE_URL)
      .get('/rest.php/chains')
      .reply(200, stubs.pmt_clients);
    nock(PMT_BASE_NETWORK_URL_AH)
      .get('/stores')
      .reply(404);
    nock(PMT_BASE_NETWORK_URL_JUMBO)
      .get('/stores')
      .reply(200, stubs.jumbo_stores);

    const { statusCode } = await getRequest('/v2/pristine_networks');

    assert.equal(statusCode, 404);
  });
});
