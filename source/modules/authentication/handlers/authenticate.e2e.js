import { assert } from 'chai';
import { createUser } from 'common/repositories/user';
import { postRequest } from 'common/test-utils/request';

let userWithNetwork;
let userWithoutNetwork;

const url = '/v2/authenticate';
const loginRequest = (username, password) => {
  return postRequest(url, { username, password });
};

const userInput = {
  username: 'Johnnie', firstName: 'John', lastName: 'Doe', password: 'ihazswag',
};

describe('Authorize', () => {
  before(() => {
    const userWithNetworkPromise = createUser(userInput)
      .then(createdUser => {
        return createdUser.setNetworks([global.network]).then(() => createdUser);
      })
      .then(createdUser => createdUser.reload())
      .then(createdUserWithNetwork => (userWithNetwork = createdUserWithNetwork));

    const userWithoutNetworkPromise = createUser({ ...userInput, username: 'JohnnieLonely' })
      .then(user => (userWithoutNetwork = user));

    return Promise.all([userWithNetworkPromise, userWithoutNetworkPromise]);
  });

  it('checks for required input fields', () => {
    const response1 = postRequest(url, { foo: 'bar' });
    const response2 = postRequest(url, { username: 'bar' });
    const response3 = postRequest(url, { password: 'bar' });

    return Promise.all([response1, response2, response3])
      .then(responses => {
        assert.equal(responses[0].statusCode, 422);
        assert.equal(responses[1].statusCode, 422);
        assert.equal(responses[2].statusCode, 422);
      });
  });

  it('can login with correct credentials', () => {
    return loginRequest(userInput.username, userInput.password).then(res => {
      const { data } = res.result;
      assert.property(data, 'access_token');
      assert.property(data, 'refresh_token');
      assert.equal(data.user.username, userInput.username);
    });
  });

  it('should fail when credentials are not correct', () => {
    return loginRequest(userInput.username, 'ihaznoswag').then(res => {
      assert.equal(res.result.error.title, 'wrong_credentials');
      assert.equal(res.statusCode, 403);
    });
  });

  it('should fail when user does not belong to a network', () => {
    return loginRequest('JohnnieLonely', userInput.password).then(res => {
      assert.equal(res.result.error.title, 'not_in_network');
      assert.equal(res.statusCode, 403);
    });
  });

  after(() => {
    userWithNetwork.destroy();
    userWithoutNetwork.destroy();
  });
});
