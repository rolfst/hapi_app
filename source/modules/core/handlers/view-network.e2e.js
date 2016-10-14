import { assert } from 'chai';
import { getRequest } from '../../../shared/test-utils/request';

describe('View network', async () => {
  it('should return correct has_integration property value', async () => {
    const { pmt, flexAppeal } = global.networks;
    const [integratedNetwork, nonIntegratedNetwork] = await Promise.all([
      getRequest(`/v1/networks/${pmt.id}`),
      getRequest(`/v1/networks/${flexAppeal.id}`),
    ]);

    assert.equal(integratedNetwork.result.data.has_integration, true);
    assert.equal(nonIntegratedNetwork.result.data.has_integration, false);
  });

  it('should return correct properties for network object', async () => {
    const { result: { data } } = await getRequest(`/v1/networks/${global.networks.flexAppeal.id}`);

    assert.property(data, 'id');
    assert.property(data, 'super_admin');
    assert.property(data, 'has_integration');
    assert.property(data, 'enabled_components');
    assert.property(data, 'created_at');
    assert.isBoolean(data.has_integration);
    assert.isArray(data.enabled_components);
    assert.deepEqual(data.enabled_components, global.networks.flexAppeal.enabledComponents);
    assert.equal(data.type, 'network');
    assert.equal(data.super_admin.id, global.users.admin.id);
  });
});
