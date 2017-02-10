import { assert } from 'chai';
import streamToPromise from 'stream-to-promise';
import FormData from 'form-data';
import * as testHelper from '../../../shared/test-utils/helpers';
import { postRequest } from '../../../shared/test-utils/request';

describe.skip('upload', () => {
  let user;
  let admin;

  const image = {
    name: 'Ren & Stimpy',
    description: [
      'Ren Höek is a hot-tempered, "asthma-hound" Chihuahua.',
      'Stimpson "Stimpy" J. Cat is a three-year-old dim-witted and happy-go-lucky cat.'
    ].join('\n'),
    filename: 'ren.jpg',
    checksum: '5965ae98ecab44a2a29b87f90c681229',
    width: 256,
    height: 256,
    filedata: new Buffer('lets imagine that this is an image')
  };

  before(async () => {
    [admin, user] = await Promise.all([
      testHelper.createUser(),
      testHelper.createUser(),
    ]);
    const network = await testHelper.createNetwork({ name: 'flexappeal', userId: admin.id });
    return testHelper.addUserToNetwork({ networkId: network.id, userId: user.id });
  });

  after(() =>  testHelper.cleanAll());
  
  it('should upload an image', async () => {
    const form = new FormData();

    // Fill the form object
    Object.keys(image).forEach(function (key) {
        form.append(key, image[key]);
    });

    const payload = await streamToPromise(form);
    console.log('payload', payload);
    const { result } = await postRequest('/v2/uploads', payload, user.token, form.getHeaders());
    assert.equal(result.status, 200);
  });
});
