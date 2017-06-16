exports.EIncludeTypes = {
  USERS: 'users',
};

exports.EUserFields = {
  ID: 'id',
  FULL_NAME: 'fullName',
  PROFILE_IMG: 'profileImg',
};

exports.EObjectTypes = {
  ATTACHMENT: 'attachment', // Virtual
  POLL: 'poll', // Virtual
  PRIVATE_MESSAGE: 'private_message',
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

exports.ESEARCH_SELECTORS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  ADMIN: 'admin',
  NOT_ACTIVATED: 'not_activated',
};
