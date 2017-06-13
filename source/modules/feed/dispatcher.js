const R = require('ramda');
const moment = require('moment');
const EventEmitter = require('../../shared/services/event-emitter');
const Notifier = require('../../shared/services/notifier');
const Mixpanel = require('../../shared/services/mixpanel');
const objectService = require('../core/services/object');
const objectRepo = require('../core/repositories/object');
const { EObjectTypes, EParentTypes } = require('../core/definitions');
const organisationRepository = require('../core/repositories/organisation');
const networkService = require('../core/services/network');
const userRepo = require('../core/repositories/user');
const commentRepo = require('./repositories/comment');
const createdMessageNotification = require('./notifications/message-created');
const createdCommentNotification = require('./notifications/comment-created');

const pubsub = EventEmitter.create();

/**
 * @param {object} payload - Object containing payload data
 * @param {User} payload.actor - The actor that initiated the event
 * @param {number} payload.organisationId - The id of the organisation
 * @param {string} payload.networkId - the identifier for the network from which
 * this event originates
 * @param {object} payload.parent - The parent where the message is created for
 * @param {Object} payload.object {@link module:feed~Object object} - The created object
 */
pubsub.asyncOn('message.created', async (payload) => {
  const notification = createdMessageNotification(payload.actor, payload.parent, payload.object);
  const organisationP = payload.organisationId
    ? organisationRepository.findById(payload.organisationId, {})
    : Promise.resolve(null);
  const networkP = payload.networkId
    ? networkService.get({ networkId: payload.networkId }, {})
    : Promise.resolve(null);
  const usersToNotifyP = objectService
    .usersForParent({ parentType: payload.parent.type, parentId: payload.parent.id })
    .then(R.reject(R.propEq('id', payload.actor.id)))
    .catch(() => Promise.resolve([]));

  const [organisation, network, usersToNotify] =
    await Promise.all([organisationP, networkP, usersToNotifyP]);

  let organisationId = organisation ? organisation.id : null;

  if (!organisationId && network) {
    organisationId = network.organisationId;
  }

  Notifier.send(
    usersToNotify,
    notification,
    network ? network.id : null,
    organisationId
  );

  let trackData;

  if (network) {
    trackData = {
      name: 'Created Message',
      data: {
        'Network Id': network.id,
        'Network Name': network.name,
        'Placed In': payload.parent.type === 'team' ? 'Team' : 'Network',
        'Created At': moment().toISOString(),
      },
    };
  } else if (organisation) {
    trackData = {
      name: 'Created Message',
      data: {
        'Organisation Id': organisation.id,
        'Organisation Name': organisation.name,
        'Placed In': 'Organisation',
        'Created At': moment().toISOString(),
      },
    };
  }

  if (R.pathEq(['parent', 'type'], 'team', payload)) {
    trackData.data['Team Id'] = payload.parent.id;
  }

  Mixpanel.track(trackData, payload.credentials.id);
});

pubsub.asyncOn('comment.created', async (payload) => {
  const { message, comment } = payload;

  // Get all comments so we can notify everyone
  const allComments = await commentRepo.findBy({
    messageId: message.id,
    userId: { $not: comment.userId },
  });

  const allUserIds = R.filter(
    R.identity,
    R.uniq([message.createdBy, comment.userId].concat(R.pluck('userId', allComments)))
  );

  const users = await userRepo.findByIds(allUserIds);
  const usersToNotify = R.filter((user) => (user.id !== comment.userId), users);
  const creator = R.find(R.propEq('id', comment.userId), users);

  // Find the object so we know what network/organisation this comment is from
  const messageObject = R.head(await objectRepo.findBy({
    sourceId: message.id,
    objectType: { $or: [EObjectTypes.FEED_MESSAGE, EObjectTypes.ORGANISATION_MESSAGE] },
    $or: [
      { parentType: { $not: EParentTypes.USER } },
      { parentType: EParentTypes.USER, parentId: comment.userId },
    ],
  }));

  if (!messageObject) return;

  const networkId = messageObject && messageObject.networkId ? messageObject.networkId : null;
  let organisationId =
    messageObject && messageObject.organisationId ? messageObject.organisationId : null;

  if (!organisationId && networkId) {
    const network = await networkService.get({ networkId });

    organisationId = network && network.organisationId ? network.organisationId : null;
  }

  const notification = createdCommentNotification(comment, creator);

  Notifier.send(
    usersToNotify,
    notification,
    networkId,
    organisationId
  );
});

module.exports = pubsub;
