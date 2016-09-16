import { assert } from 'chai';
import { getRequest, putRequest } from 'common/test-utils/request';

describe('Handler: update my profile', () => {
  it('should return an updated user', async () => {
    const endpoint = `/v2/networks/${global.networks.flexAppeal.id}/users/me`;
    const address = { address: 'new updated address' };
    const { result: { data } } = await putRequest(
      endpoint, address, global.server, global.tokens.employee);

    assert.equal(data.id, global.users.employee.id);
    assert.equal(data.username, global.users.employee.username);
    assert.equal(data.first_name, global.users.employee.firstName);
    assert.equal(data.last_name, global.users.employee.lastName);
    assert.equal(data.phone_num, global.users.employee.phoneNum);
    assert.equal(data.email, global.users.employee.email);
    assert.equal(data.date_of_birth, global.users.employee.dateOfBirth);
    assert.equal(data.role_type, global.users.employee.roleType);
    assert.equal(data.address, address.address);

    // check if data in a different call does have the updated value
    const viewEndpoint = `/v2/networks/${global.networks.flexAppeal.id}/users/me`;
    const { result: { data: viewData } } = await getRequest(
      viewEndpoint, global.server, global.tokens.employee);

    assert.equal(viewData.id, global.users.employee.id);
    assert.equal(viewData.address, address.address);
  });

  it('should fail when updating an id', async () => {
    const endpoint = `/v2/networks/${global.networks.flexAppeal.id}/users/me`;
    const result = putRequest(
      endpoint, { id: '0002222' }, global.server, global.tokens.employee);

    assert.isRejected(result);
  });
});
