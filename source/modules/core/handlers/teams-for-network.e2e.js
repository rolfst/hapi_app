import { assert } from 'chai';
import * as testHelper from '../../../shared/test-utils/helpers';
import { getRequest } from '../../../shared/test-utils/request';
import * as teamRepository from '../repositories/team';

describe('Handler: Teams for network', () => {
  let network;
  let admin;

  before(async () => {
    admin = await testHelper.createUser({ password: 'pw' });
    network = await testHelper.createNetwork({ userId: admin.id });
    await testHelper.addUserToNetwork(
        { networkId: network.id, userId: admin.id, roleType: 'ADMIN' });

    const coolTeam = await teamRepository.create({
      name: 'Cool team', networkId: network.id });

    await teamRepository.create({
      name: 'Other cool team', networkId: network.id, externalId: 'foo' });

    await teamRepository.addUserToTeam(coolTeam.id, admin.id);
  });

  after(async () => testHelper.cleanAll());

  it('should return all teams in network', async () => {
    const { result } = await getRequest(`/v2/networks/${network.id}/teams`, admin.token);

    assert.lengthOf(result.data, 2);
    assert.equal(result.data[0].type, 'team');
    assert.equal(result.data[0].network_id, network.id);
    assert.equal(result.data[0].name, 'Cool team');
    assert.equal(result.data[0].member_count, 1);
    assert.equal(result.data[0].is_member, true);
    assert.equal(result.data[0].is_synced, false);
    assert.equal(result.data[0].is_channel, false);
    assert.property(result.data[0], 'created_at');

    assert.equal(result.data[1].type, 'team');
    assert.equal(result.data[1].network_id, network.id);
    assert.equal(result.data[1].name, 'Other cool team');
    assert.equal(result.data[1].member_count, 0);
    assert.equal(result.data[1].is_member, false);
    assert.equal(result.data[1].is_synced, true);
    assert.equal(result.data[1].is_channel, false);
    assert.property(result.data[1], 'created_at');
  });
});
