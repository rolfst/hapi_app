import { assert } from 'chai';
import userSerializer from './user';

describe('user serializer', () => {
  it('should have a phonenumber without spaces or non-nummeric characters', async () => {
    const result = userSerializer({ cell_phone_number: '06 - 12345789 pmt' });
    assert.equal(result.phoneNum, '0612345789');
  });

  it('should have a phonenumber without spaces or non-nummeric characters on home number', async () => { // eslint-disable-line
    const result = userSerializer({ home_phone_number: '0612 - 345 789 pmt' });
    assert.equal(result.phoneNum, '0612345789');
  });
});
