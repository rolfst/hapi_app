const { Activity, Team, Network, User } = require('./dao');

/**
 * @module modules/core/repositories/activity
 */

const defaultIncludes = [{
  model: User,
  include: [{
    model: Team,
  }, {
    model: Network,
  }],
}];

const findBy = (whereConstraint) => Activity.findAll({
  where: whereConstraint,
});

/**
 * Finds all activities for a user
 * @param {string} userId - userId
 * @method findForUser
 * @return {external:Promise.<Activity>} {@link module:shared~Activity Activity}
 */
function findForUser(userId) {
  return Activity.findAll({
    include: defaultIncludes,
    where: { sourceId: userId },
  });
}

/**
 * Finds all activities for a user
 * @param {Exchange} sourceModel
 * @method findActivitiesForSource
 * @return {external:Promise.<Activity[]>} {@link module:shared~Activity Activity}
 */
function findActivitiesForSource(sourceModel) {
  return sourceModel.getActivities({
    include: defaultIncludes,
  });
}

/**
 * creates an activity
 * @param {object} activity
 * @param {string} activity.activityType - activityType
 * @param {string} activity.userId - userId
 * @param {string} activity.sourceId - sourceId
 * @param {string} activity.metaData - json string
 * @method createActivity
 * @return {external:Promise.<Activity>} {@link module:shared~Activity Activity}
 */
function createActivity({ activityType, userId, sourceId, metaData }) {
  return Activity.create({ activityType, userId, sourceId, metaData });
}

/**
 * Finds all Activities
 * @method findAll
 * @return {external:Promise.<Activity[]>} {@link module:shared~Activity Activity}
 */
async function findAll() {
  return Activity.findAll({ include: defaultIncludes });
}

/**
 * Deletes all Activities
 * @method deleteById
 * @return {external:Promise.<number>} - number of deleted activities
 */
async function deleteById(activityId) {
  return Activity.destroy({ where: { id: activityId } });
}

const deleteBy = (whereConstraint) =>
  Activity.destroy({ where: whereConstraint });

// exports of functions
exports.createActivity = createActivity;
exports.deleteBy = deleteBy;
exports.deleteById = deleteById;
exports.findActivitiesForSource = findActivitiesForSource;
exports.findAll = findAll;
exports.findBy = findBy;
exports.findForUser = findForUser;
