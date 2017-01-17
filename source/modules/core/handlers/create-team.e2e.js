import { assert } from 'chai';
import { postRequest } from '../../../shared/test-utils/request';
import * as teamRepository from '../repositories/team';

describe('Handler: create team', () => {
  it('should create a new team', async () => {
    const userIds = [global.users.admin.id, global.users.employee.id];
    const endpoint = `/v2/networks/${global.networks.flexAppeal.id}/teams`;
    const payload = { name: 'Foo team', is_channel: true, user_ids: userIds };
    const { statusCode, result } = await postRequest(endpoint, payload);

    await teamRepository.deleteById(result.data.id);

    assert.equal(statusCode, 200);
    assert.equal(result.data.network_id, global.networks.flexAppeal.id);
    assert.equal(result.data.name, 'Foo team');
    assert.equal(result.data.member_count, 2);
    assert.equal(result.data.is_channel, true);
    assert.equal(result.data.is_member, true);
    assert.equal(result.data.is_synced, false);
    assert.deepEqual(result.data.member_ids, userIds);
  });

  it('should be a channel by default', async () => {
    const endpoint = `/v2/networks/${global.networks.flexAppeal.id}/teams`;
    const payload = { name: 'Foo team' };
    const { statusCode, result } = await postRequest(endpoint, payload);

    await teamRepository.deleteById(result.data.id);

    assert.equal(statusCode, 200);
    assert.equal(result.data.type, 'team');
    assert.equal(result.data.network_id, global.networks.flexAppeal.id);
    assert.equal(result.data.name, 'Foo team');
    assert.equal(result.data.member_count, 0);
    assert.equal(result.data.is_channel, true);
    assert.equal(result.data.is_member, false);
    assert.equal(result.data.is_synced, false);
  });

  it('should return 403 if user is not an admin', async () => {
    const endpoint = `/v2/networks/${global.networks.flexAppeal.id}/teams`;
    const payload = { name: 'Foo team' };
    const { statusCode } = await postRequest(
      endpoint, payload, global.server, global.tokens.employee);

    assert.equal(statusCode, 403);
  });
});