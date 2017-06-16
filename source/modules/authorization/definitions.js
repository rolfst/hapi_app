// NOTE: ERoutePermissions and EPrefetchData must not contain duplicate values (except NONE)
exports.ERoutePermissions = {
  NONE: null,
  ORGANISATION_ADMIN: 'organisation_admin',
  ORGANISATION_USER: 'organisation_user',
  NETWORK_ADMIN: 'network_admin',
  NETWORK_USER: 'network_user',
  TEAM_MEMBER: 'team_member',
};

exports.EPrefetchData = {
  NONE: null,
  ORGANISATION: 'organisation',
  NETWORK: 'network',
  TEAM: 'team',
};

exports.ERoleTypes = {
  ANY: Symbol('A symbol to define any role type'),
  ADMIN: 'ADMIN',
  EMPLOYEE: 'EMPLOYEE',
};

exports.EResourceTypes = {
  MESSAGE: 'message',
};

// delete is a js keyword so I called it remove because it is used in objects
exports.EPermissions = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'remove',
};

// Several cache timeout values (in ms)
exports.CACHE_TTL = {
  USER: 900000, // cache users for 15 minutes
  TEAM: 900000, // cache teams for 15 minutes
  NETWORK: 900000, // cache networks for 15 minutes
  ORGANISATION: 900000, // cache organisations for 15 minutes
};
