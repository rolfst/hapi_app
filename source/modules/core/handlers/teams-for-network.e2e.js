import { assert } from 'chai';
import { getRequest } from '../../../shared/test-utils/request';
import * as teamRepository from '../repositories/team';

describe('Handler: Teams for network', () => {
  before(async () => {
    const coolTeam = await teamRepository.create({
      name: 'Cool team', networkId: global.networks.flexAppeal.id });

    await teamRepository.create({
      name: 'Other cool team', networkId: global.networks.flexAppeal.id, externalId: 'foo' });

    await teamRepository.addUserToTeam(coolTeam.id, global.users.admin.id);
  });

  it('should return all teams in network', async () => {
    const { result } = await getRequest(`/v2/networks/${global.networks.flexAppeal.id}/teams`);

    assert.lengthOf(result.data, 2);
    assert.equal(result.data[0].type, 'team');
    assert.equal(result.data[0].network_id, global.networks.flexAppeal.id);
    assert.equal(result.data[0].name, 'Cool team');
    assert.equal(result.data[0].member_count, 1);
    assert.equal(result.data[0].is_member, true);
    assert.equal(result.data[0].is_synced, false);
    assert.equal(result.data[0].is_channel, false);
    assert.property(result.data[0], 'created_at');

    assert.equal(result.data[1].type, 'team');
    assert.equal(result.data[1].network_id, global.networks.flexAppeal.id);
    assert.equal(result.data[1].name, 'Other cool team');
    assert.equal(result.data[1].member_count, 0);
    assert.equal(result.data[1].is_member, false);
    assert.equal(result.data[1].is_synced, true);
    assert.equal(result.data[1].is_channel, false);
    assert.property(result.data[1], 'created_at');
  });
});
