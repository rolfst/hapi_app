const R = require('ramda');
const Promise = require('bluebird');
const objectRepository = require('../../../core/repositories/object');
const { EObjectTypes, EParentTypes } = require('../../../core/definitions');
const objectService = require('../../../core/services/object');
const messageService = require('../message');

const typeEq = R.propEq('objectType');
const pluckId = R.pluck('id');
const messageIdEq = R.propEq('messageId');
const findIncludes = (object, includes) => (typeEq('feed_message') ?
  R.defaultTo(null, R.filter(messageIdEq(object.sourceId), includes)) : null);
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
const getIncludes = async (hasInclude, objects) => {
  const hasType = (type) => anyWithType(type, objects);
  const includes = { comments: [], likes: [] };

  if (hasType('feed_message')) {
    const messageIds = getSourceIdsForType('feed_message', objects);

    if (hasInclude('comments')) {
      includes.comments = messageService.listComments({ messageIds });
    }

    if (hasInclude('likes')) {
      includes.likes = messageService.listLikes({ messageIds });
    }
  }

  return Promise.props(includes);
};

const makeFeed = async (constraint, options, message) => {
  const relatedObjects = await objectRepository.findBy(constraint, {
    limit: options.limit,
    offset: options.offset,
    order: [['created_at', 'DESC']],
  });

  const hasInclude = R.contains(R.__, options.include || []);
  const [includes, objectsWithSources] = await Promise.all([
    getIncludes(hasInclude, relatedObjects),
    objectService.listWithSourceAndChildren(
      { objectIds: pluckId(relatedObjects) },
      message,
      message.credentials.id
    ),
  ]);

  const addComments = (object) =>
    R.assoc('comments', findIncludes(object, includes.comments), object);
  const addLikes = (object) =>
    R.assoc('likes', findIncludes(object, includes.likes), object);

  const createObjectWithIncludes = R.cond([
    [() => R.and(hasInclude('comments'), hasInclude('likes')), R.pipe(addComments, addLikes)],
    [() => hasInclude('comments'), addComments],
    [() => hasInclude('likes'), addLikes],
    [R.T, R.identity],
  ]);

  const transformParentValues = (object) => R.merge(object, {
    parentType: object.objectType === EObjectTypes.ORGANISATION_MESSAGE
      ? EParentTypes.ORGANISATION
      : object.parentType,
    parentId: object.objectType === EObjectTypes.ORGANISATION_MESSAGE
      ? object.organisationId
      : object.parentId,
  });

  return R.map(R.pipe(createObjectWithIncludes, transformParentValues), objectsWithSources);
};

function composeSpecialisedQueryForFeed(payload, extraWhereConstraint = {}) {
  const whereConstraint = {
    $or: [{
      parentType: payload.parentType,
      parentId: payload.parentId,
    }],
    $and: {
      $or: [
        { networkId: payload.networkId },
        { networkId: null },
      ],
    },
  };

  // Since extraWhereConstraint can either be an array or an object,
  // the spread syntax does not work in all cases
  if (Array.isArray(extraWhereConstraint)) {
    whereConstraint.$or = [...extraWhereConstraint, ...whereConstraint.$or];
  } else {
    whereConstraint.$or = [extraWhereConstraint, ...whereConstraint.$or];
  }

  return whereConstraint;
}

exports.composeSpecialisedQueryForFeed = composeSpecialisedQueryForFeed;
exports.getIncludes = getIncludes;
exports.makeFeed = makeFeed;
