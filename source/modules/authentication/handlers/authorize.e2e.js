import { assert } from 'chai';
import { createUser } from 'common/repositories/user';
import { postRequest } from 'common/test-utils/request';

const loginRequest = (username, password) => {
  return postRequest('/v2/authorize', { username, password });
};

const userInput = { username: 'John', password: 'ihazswag ' };

describe('Authorize', () => {
  before(() => {
    return createUser(userInput);
  });

  it('checks for required input fields', () => {
    const response1 = postRequest('/v2/authorize', { foo: 'bar' });
    const response2 = postRequest('/v2/authorize', { username: 'bar' });
    const response3 = postRequest('/v2/authorize', { password: 'bar' });

    return Promise.all([response1, response2, response3])
      .then(responses => {
        assert.equal(responses[0].result.statusCode, 422);
        assert.equal(responses[1].result.statusCode, 422);
        assert.equal(responses[2].result.statusCode, 422);
      });
  });

  it('can login with correct credentials', () => {
    return loginRequest(userInput.username, 'ihazswag').then(res => {
      const { data } = res.result;
      assert.property(data, 'access_token');
      assert.property(data, 'refresh_token');
      assert.equal(data.user.username, userInput.username);
    });
  });

  it('should fail when credentials are not correct', () => {
    return loginRequest(userInput.username, 'ihaznoswag').then(res => {
      const { errors } = res.result;
      assert.equal(errors.title, 'wrong_credentials');
      assert.equal(res.statusCode, 403);
    });
  });

  it('should fail when user does not belong to a network', () => {
    // TODO
  });
});
