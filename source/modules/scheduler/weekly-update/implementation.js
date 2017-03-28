const R = require('ramda');
const moment = require('moment');
const Promise = require('bluebird');
const networkRepo = require('../../core/repositories/network');
const objectRepo = require('../../core/repositories/object');
const objectService = require('../../core/services/object');
const objectImpl = require('../../core/services/object/implementation');

const calculateScore = R.pipe(
  R.prop('source'),
  R.pick(['commentsCount', 'likesCount']),
  R.evolve({ commentsCount: R.multiply(2) }),
  R.values,
  R.sum
);
const filterMessagesByTeamIds = (teamIds) => R.filter(R.either(
  R.propEq('parentType', 'network'),
  R.both(R.propEq('parentType', 'team'), (message) => R.contains(message.parentId, teamIds))
));
const isInvitedLastWeek = (user) => moment().diff(moment(user.invitedAt), 'days') < 7;
const uniqueTeamIds = R.pipe(R.prop('teamIds'), R.sort(R.subtract), R.join('-'));
const keyedObject = (fn, collection) => R.pipe(R.groupBy(fn), R.map(R.head))(collection);
const transformBundleData = (users) => ({
  teamIds: R.prop('teamIds', users[0]),
  mailTo: R.map(R.prop('email'), users),
});
const addScoreToMessage = (message) => R.assoc('score', calculateScore(message), message);
const getObjectIds = R.pipe(R.flatten, R.pluck('id'));

/**
 * @param {User} user - User object containing teamIds
 * @param {object} lookup - Object containing teams with id as key
 * @method addTeamsToUser
 * @return {User}
 */
const addTeamsToUser = R.curry((user, lookup) => R.merge(user, {
  teams: R.pipe(R.map((teamId) => lookup[teamId]), R.reject(R.isNil))(user.teamIds),
}));

/**
 * Create bundles for sending weekly updates
 * @param {array} users - All users in the network
 * @method createEmailBundles
 * @return {array} - Bundles to send email to
 */
const createBundles = R.pipe(
  R.groupBy(uniqueTeamIds),
  R.values,
  R.map(transformBundleData)
);

/**
 * @param {Bundle} bundle - Bundle to get top messages for
 * @param {Message[]} messages - All messages sorted by score
 * @param {number} limit - Amount of messages needed
 * @method getTopMessages
 * @return {Message[]}
 */
const getTopMessagesForBundle = R.curry((bundle, messages, limit = 3) => R.pipe(
  filterMessagesByTeamIds(bundle.teamIds),
  R.sort(R.descend(R.prop('score'))),
  R.take(limit)
)(messages));

/**
 * @param {Bundle} bundle - the bundle to check
 * @param {User[]} newColleagues - list of colleagues added the previous week
 * @method isValidBundle
 * @return {boolean}
 */
const isValidBundle = R.curry((bundle, newColleagues) => R.or(
  R.lt(0, R.length(bundle.messages)),
  R.lt(0, R.length(newColleagues))
));

/**
 * Decide if message is valid to show in email ( we don't show polls in emails )
 * @param {Message} - Message to validate
 * @method isValidMessageForMail
 * @return {boolean}
 */
const isValidMessageForMail = R.either(
  R.pipe(R.path(['source', 'text']), R.complement(R.isNil)),
  R.pipe(
    R.prop('children'),
    R.filter(R.propEq('objectType', 'attachment')),
    R.length,
    R.gt(R.__, 0)
  )
);

/**
 * Perform actions on all messages to prepare them for further usage
 * @param {User[]} users - All users in network
 * @param {object} parentLookups - Object containing lookups
 * @method prepareMessages
 * @return {function}
 */
const prepareMessages = (users, parentLookups) => R.pipe(
  R.filter(isValidMessageForMail),
  objectImpl.mergeObjectsWithParent(parentLookups),
  objectImpl.mergeObjectsWithUser(users),
  R.map(addScoreToMessage)
);

/**
 * Find messages placed in network and teams
 * @param {string} networkId - Id of the network
 * method findMessagesForNetwork
 * @return {Object[]}
 */
const findMessagesForNetwork = async (networkId, dateRange) => {
  const teams = await networkRepo.findTeamsForNetwork(networkId);
  const createdAt = { $between: R.map((date) => date.toISOString(), dateRange) };

  const objectIds = await Promise.map([
    { parentType: 'network', parentId: networkId, created_at: createdAt },
    { parentType: 'team', parentId: { $in: R.pluck('id', teams) }, created_at: createdAt },
  ], objectRepo.findBy)
    .then(getObjectIds);

  return objectService.listWithSourceAndChildren({ objectIds }, { credentials: {} });
};

exports.calculateScore = calculateScore;
exports.filterMessagesByTeamIds = filterMessagesByTeamIds;
exports.isInvitedLastWeek = isInvitedLastWeek;
exports.uniqueTeamIds = uniqueTeamIds;
exports.keyedObject = keyedObject;
exports.transformBundleData = transformBundleData;
exports.addScoreToMessage = addScoreToMessage;
exports.getObjectIds = getObjectIds;
exports.addTeamsToUser = addTeamsToUser;
exports.createBundles = createBundles;
exports.getTopMessagesForBundle = getTopMessagesForBundle;
exports.isValidBundle = isValidBundle;
exports.isValidMessageForMail = isValidMessageForMail;
exports.prepareMessages = prepareMessages;
exports.findMessagesForNetwork = findMessagesForNetwork;
