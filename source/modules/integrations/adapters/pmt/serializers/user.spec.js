const { assert } = require('chai');
const R = require('ramda');
const moment = require('moment');
const userSerializer = require('./user');

describe('PMT: User Serializer', () => {
  const defaultExternalUser = {
    id: '1048789',
    username: 'bob+61787@rwrs.nl',
    email: 'bob+61787@rwrs.nl',
    department: '14',
    first_name: '',
    last_name: 'Doe',
    cell_phone_number: '600000000',
    home_phone_number: '600000000',
    date_of_birth: '1970-01-01',
    rolename: 'Medewerker',
    scope: [{
      department: '14',
    }],
    active: true,
  };

  const defaultInternalUser = {
    externalId: defaultExternalUser.id,
    username: defaultExternalUser.username,
    email: defaultExternalUser.email,
    integrationAuth: null,
    function: null,
    firstName: defaultExternalUser.first_name,
    lastName: defaultExternalUser.last_name,
    dateOfBirth: defaultExternalUser.date_of_birth,
    phoneNum: defaultExternalUser.cell_phone_number,
    roleType: 'EMPLOYEE',
    isActive: defaultExternalUser.active,
    deletedAt: defaultExternalUser.active ? null : moment().toISOString(),
    teamIds: ['14'],
  };

  it('should have a phonenumber without spaces or non-nummeric characters', () => {
    const result = userSerializer({ cell_phone_number: '06 - 12345789 pmt' });
    assert.equal(result.phoneNum, '0612345789');
  });

  it('should have a phonenumber without spaces or non-nummeric characters on home number', () => { // eslint-disable-line
    const result = userSerializer({ home_phone_number: '0612 - 345 789 pmt' });
    assert.equal(result.phoneNum, '0612345789');
  });

  it('teamIds should fallback to department when scope is empty', () => {
    const externalUser = R.merge(defaultExternalUser, { scope: null });

    const result = userSerializer(externalUser);
    const expected = R.merge(defaultInternalUser, { teamIds: ['14'] });

    assert.deepEqual(result, expected);
  });

  it('teamIds should be empty when department and scope are empty', () => {
    const externalUser = R.merge(
      defaultExternalUser,
      {
        department: null,
        scope: null,
      }
    );

    const result = userSerializer(externalUser);
    const expected = R.merge(defaultInternalUser, { teamIds: [] });

    assert.deepEqual(result, expected);
  });

  it('username should fallback to email when empty', () => {
    const externalUser = R.merge(defaultExternalUser, { username: null });

    const result = userSerializer(externalUser);
    const expected = R.merge(defaultInternalUser, { username: defaultInternalUser.email });

    assert.deepEqual(result, expected);
  });

  it('dateOfBirth should be set to null when date string is invalid', () => {
    const externalUser = R.merge(defaultExternalUser, { date_of_birth: '22-0321' });

    const result = userSerializer(externalUser);
    const expected = R.merge(defaultInternalUser, { dateOfBirth: null });

    assert.deepEqual(result, expected);
  });

  it('dateOfBirth should be set to null when date string has wrong format', () => {
    const externalUser = R.merge(defaultExternalUser, { date_of_birth: '22-09-1995' });

    const result = userSerializer(externalUser);
    const expected = R.merge(defaultInternalUser, { dateOfBirth: null });

    assert.deepEqual(result, expected);
  });
});
