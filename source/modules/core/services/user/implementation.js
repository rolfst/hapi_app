export async function createScopedUser(user, metaData) {
  return {
    ...user,
    roleType: metaData.roleType,
    externalId: metaData.externalId,
    deletedAt: metaData.deletedAt,
    invitedAt: metaData.invitedAt,
    integrationAuth: !!metaData.userToken,
  };
}
