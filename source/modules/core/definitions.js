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
  ORGANISATION_MESSAGE: 'organisation_message',
  FEED_MESSAGE: 'feed_message',
  ORGANISATION: 'organisation',
  NETWORK: 'network',
  TEAM: 'team',
  USER: 'user',
};

exports.EParentTypes = {
  ORGANISATION: 'organisation',
  NETWORK: 'network',
  TEAM: 'team',
  EXCHANGE: 'exchange',
  USER: 'user',
};

exports.PHONENUM_REGEX = /^(00\s*31|\+31|0)\s*[1-9](\s*[0-9]){6,8}$/;
