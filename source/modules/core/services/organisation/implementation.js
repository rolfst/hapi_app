const createError = require('../../../../shared/utils/create-error');
const organisationRepo = require('../../repositories/organisation');

async function assertThatUserIsMemberOfOrganisation(userId, organisationId) {
  if (!await organisationRepo.hasUser(userId, organisationId)) {
    throw createError('403');
  }
  const userMeta = await organisationRepo.getPivot(userId, organisationId);
  if (!userMeta) throw createError('403', 'User is not a member of the organisation');
}

async function assertThatUserIsAdminInOrganisation(userId, organisationId) {
  const userMeta = await organisationRepo.getPivot(userId, organisationId);

  if (!userMeta || userMeta.roleType !== 'ADMIN') throw createError('10020', 'User is not an admin in the organisation');
}

async function assertThatOrganisationExists(organisationId) {
  const organisation = await organisationRepo.findById(organisationId);
  if (!organisation) throw createError('404', 'Organisation not found.');
}

exports.assertThatOrganisationExists = assertThatOrganisationExists;
exports.assertThatUserIsMemberOfOrganisation = assertThatUserIsMemberOfOrganisation;
exports.assertThatUserIsAdminInOrganisation = assertThatUserIsAdminInOrganisation;
