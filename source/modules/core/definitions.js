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

exports.EParentTypes = {
  ORGANISATION: 'organisation',
  NETWORK: 'network',
  TEAM: 'team',
  EXCHANGE: 'exchange',
  USER: 'user',
};
