exports.ERoleTypes = {
  ANY: Symbol('A symbol to define any role type'),
  ADMIN: 'ADMIN',
  EMPLOYEE: 'EMPLOYEE',
};

exports.EIncludeTypes = {
  USERS: 'users',
};

exports.EUserFields = {
  ID: 'id',
  FULL_NAME: 'fullName',
  PROFILE_IMG: 'profileImg',
};

exports.EObjectTypes = {
  ORGANISATION: 'organisation',
  ORGANISATION_MESSAGE: 'organisation_message',
  FEED_MESSAGE: 'feed_message',
  NETWORK: 'network',
  TEAM: 'team',
  USER: 'user',
};

exports.PHONENUM_REGEX = /^(00\s*31|\+31|0)\s*[1-9](\s*[0-9]){6,8}$/;
