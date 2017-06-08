const R = require('ramda');
const moment = require('moment');
const EventEmitter = require('../../shared/services/event-emitter');
const Notifier = require('../../shared/services/notifier');
const Mixpanel = require('../../shared/services/mixpanel');
const objectService = require('../core/services/object');
const organisationRepository = require('../core/repositories/organisation');
const networkService = require('../core/services/network');
const createdMessageNotification = require('./notifications/message-created');

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

  Notifier.send(
    usersToNotify,
    notification,
    network ? network.id : null,
    organisation ? organisation.id : network.organisationId
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
  } else {
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

module.exports = pubsub;
