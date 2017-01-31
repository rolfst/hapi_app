import R from 'ramda';
import Promise from 'bluebird';
import * as messageService from '../message';

const typeEq = R.propEq('objectType');
const anyWithType = (type, objects) => R.any(typeEq(type), objects);
const getSourceIdsForType = (type, objects) => R.pipe(
  R.filter(typeEq(type)), R.pluck('sourceId'))(objects);

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
