module.exports = (dao) => ({
  type: 'network_link',
  networkId: dao.networkId.toString(),
  userId: dao.userId.toString(),
  externalId: dao.externalId ? dao.externalId.toString() : null,
  roleType: dao.roleType,
  invitedAt: dao.invitedAt || null,
  userToken: dao.userToken || null,
  lastActive: dao.lastActive || null,
  deletedAt: dao.deletedAt || null,
});
