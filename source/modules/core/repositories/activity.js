import { Activity, Team, Network, User } from '../../../shared/models';

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

/**
 * Finds all activities for a user
 * @param {string} userId - userId
 * @method findForUser
 * @return {external:Promise.<Activity>} {@link module:shared~Activity Activity}
 */
export function findForUser(userId) {
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
export function findActivitiesForSource(sourceModel) {
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
export function createActivity({ activityType, userId, sourceId, metaData }) {
  return Activity.create({ activityType, userId, sourceId, metaData });
}
