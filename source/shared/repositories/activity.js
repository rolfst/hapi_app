import { Activity, User } from 'shared/models';

const defaultIncludes = [{
  model: User,
}];

export function findForUser(userId) {
  return Activity.findAll({
    include: defaultIncludes,
    where: { sourceId: userId },
  });
}

export function findActivitiesForSource(sourceModel) {
  return sourceModel.getActivities({
    include: defaultIncludes,
  });
}

export function createActivity({ activityType, userId, sourceId, metaData }) {
  return Activity.create({ activityType, userId, sourceId, metaData });
}
