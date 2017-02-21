import R from 'ramda';
import Promise from 'bluebird';
import * as messageService from '../message';
import * as networkService from '../../../core/services/network';

const typeEq = R.propEq('objectType');
const anyWithType = (type, objects) => R.any(typeEq(type), objects);
const getSourceIdsForType = (type, objects) => R.pipe(
  R.filter(typeEq(type)), R.pluck('sourceId'))(objects);

/**
 * Get resources that belong to object as child.
 * @param {function} hasInclude - Function to determine the includes passed from request
 * @param {Object[]} objects {@link module:modules/feed~Object object}
 * @method getIncludes
 * @return {external:Promise}
 */
export const getIncludes = async (hasInclude, objects) => {
  const hasType = (type) => anyWithType(type, objects);
  const includes = { comments: [], likes: [] };

  if (hasType('feed_message')) {
    const messageIds = getSourceIdsForType('feed_message', objects);

    if (hasInclude('comments')) {
      includes.comments = messageService.getComments({ messageIds });
    }

    if (hasInclude('likes')) {
      includes.likes = messageService.getLikes({ messageIds });
    }
  }

  return Promise.props(includes);
};

const createTeamObjectQuery = (team) => team.id;

/**
 * Creates a query for a network including team objects
 * @param {string} networkId - id for network to aquire all network related
 * messages
 * @param {string} userId - current user id
 * @method createNetworkObjectQuery
 * @return {object} query for objects
 */
export const createNetworkObjectQuery = async (networkId, userId) => {
  const teams = await networkService.listTeamsForNetwork({ networkId },
      { credentials: { id: userId } });
  const teamIds = R.map(createTeamObjectQuery, teams);

  return {
    $or: [
      {
        parentId: { $in: teamIds },
        parentType: 'team',
      },
      {
        parentType: 'network',
        parentId: networkId,
      }, {
        parentType: 'user',
        parentId: userId,
      }],
  };
};
