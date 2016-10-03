import { assert } from 'chai';
import { find } from 'lodash';
import { getRequest } from 'shared/test-utils/request';

describe('Networks for logged user', async () => {
  let result;

  before(async () => ({ result } = await getRequest('/v2/users/me/networks')));

  it('should return correct network amount', async () => {
    assert.equal(result.data.length, 2);
  });

  it('enabled_components property should return as array', () => {
    assert.isArray(result.data[0].enabled_components);
  });

  it('should return correct has_integration property value', () => {
    const { pmt, flexAppeal } = global.networks;
    const integratedNetwork = find(result.data, { id: pmt.id.toString() });
    const nonIntegratedNetwork = find(result.data, { id: flexAppeal.id.toString() });

    assert.isTrue(integratedNetwork.has_integration);
    assert.isFalse(nonIntegratedNetwork.has_integration);
  });

  it('should return correct properties for network object', () => {
    assert.property(result.data[0], 'id');
    assert.property(result.data[0], 'name');
    assert.property(result.data[0], 'enabled_components');
    assert.property(result.data[0], 'has_integration');
    assert.property(result.data[0], 'created_at');
  });
});
