import { assert } from 'chai';
import { putRequest } from '../../../shared/test-utils/request';
import * as teamService from '../services/team';
import * as teamRepository from '../repositories/team';

describe('Handler: update team', () => {
  let createdTeam;

  before(async () => {
    createdTeam = await teamService.create({
      name: 'Foo team',
      networkId: global.networks.flexAppeal.id,
      userIds: [global.users.admin.id],
      isChannel: true,
    }, { credentials: { id: global.users.admin.id } });
  });

  after(() => teamRepository.deleteById(createdTeam.id));

  it('should update an existing team', async () => {
    const endpoint = `/v2/networks/${global.networks.flexAppeal.id}/teams/${createdTeam.id}`;
    const payload = { name: 'Updated foo team', is_channel: true };
    const { statusCode, result } = await putRequest(endpoint, payload);

    assert.equal(statusCode, 200);
    assert.equal(result.data.type, 'team');
    assert.equal(result.data.network_id, global.networks.flexAppeal.id);
    assert.equal(result.data.name, 'Updated foo team');
    assert.equal(result.data.member_count, 1);
    assert.equal(result.data.is_channel, true);
    assert.equal(result.data.is_member, true);
    assert.equal(result.data.is_synced, false);
    assert.deepEqual(result.data.member_ids, [global.users.admin.id]);
  });

  it('should reset the user based on the user_ids value', async () => {
    const endpoint = `/v2/networks/${global.networks.flexAppeal.id}/teams/${createdTeam.id}`;
    const payload = { user_ids: [global.users.employee.id] };
    const { statusCode, result } = await putRequest(endpoint, payload);

    assert.equal(statusCode, 200);
    assert.equal(result.data.type, 'team');
    assert.equal(result.data.network_id, global.networks.flexAppeal.id);
    assert.equal(result.data.name, 'Updated foo team');
    assert.equal(result.data.member_count, 1);
    assert.equal(result.data.is_channel, true);
    assert.deepEqual(result.data.member_ids, [global.users.employee.id]);
  });

  it('should return 403 if user is not an admin', async () => {
    const endpoint = `/v2/networks/${global.networks.flexAppeal.id}/teams/${createdTeam.id}`;
    const payload = { name: 'Updated again foo team' };
    const { statusCode } = await putRequest(
      endpoint, payload, global.server, global.tokens.employee);

    assert.equal(statusCode, 403);
  });

  it('should return 404 when team is not found', async () => {
    const endpoint = `/v2/networks/${global.networks.flexAppeal.id}/teams/58429831828`;
    const payload = { name: 'Updated again foo team' };
    const { statusCode } = await putRequest(endpoint, payload);

    assert.equal(statusCode, 404);
  });
});
