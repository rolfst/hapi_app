import sinon from 'sinon';
import { assert } from 'chai';
import client from '../../adapters/pmt/client';
import * as stubs from '../test-utils/stubs';
import * as integrationsAdapter from './integrations-adapter';

describe('integrations', () => {
  it('should return all clients', async () => {
    const stub = sinon.stub(client, 'get').returns({ payload: stubs.pmt_clients });
    await integrationsAdapter.clients();
    client.get.restore();

    assert.equal(stub.called, true);
  });

  it('should return all pristine networks for a client', async () => {
    const stub = sinon.stub(client, 'get').returns({ payload: stubs.jumbo_stores });
    await integrationsAdapter.pristineNetworks();
    client.get.restore();

    assert.equal(stub.called, true);
  });

  it('should return all admins for a pristine network', async () => {
    const stub = sinon.stub(client, 'get').returns({ payload: { data: [] } });
    await integrationsAdapter.adminsFromPristineNetworks('url');
    client.get.restore();

    assert.equal(stub.called, true);
  });
});
