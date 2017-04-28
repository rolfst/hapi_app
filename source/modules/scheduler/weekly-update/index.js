const R = require('ramda');
const moment = require('moment');
require('moment/locale/nl');
require('moment-timezone').locale('nl');
const Promise = require('bluebird');
const createError = require('../../../shared/utils/create-error');
const mailer = require('../../../shared/services/mailer');
const Logger = require('../../../shared/services/logger');
const weeklyUpdateMail = require('../../../shared/mails/weekly-update');
const networkRepo = require('../../core/repositories/network');
const userService = require('../../core/services/user');
const impl = require('./implementation');

moment.locale('nl');

const logger = Logger.createLogger('SCRIPT/weeklyUpdate');

/**
 * Send weekly updates to everyone in the netwerk
 * @param {string} networkId - Id of the network to send emails for
 * @method sendWeeklyUpdate
 * @return {external:Promise} - Send email promise
 */
const send = async (networkId) => {
  logger.info('Sending weekly update', { networkId });

  const network = await networkRepo.findNetworkById(networkId);

  if (!network) throw createError('404');

  const dateRange = [moment().subtract(1, 'weeks'), moment()];
  const [users, teams] = await Promise.all([
    networkRepo.findUsersForNetwork(networkId)
      .then(R.pluck('id'))
      .then((userIds) => userService.listUsersWithNetworkScope({ userIds, networkId: network.id })),
    networkRepo.findTeamsForNetwork(networkId),
  ]);

  const parentLookups = { teams: impl.keyedObject(R.prop('id'), teams), network };

  const messages = await impl.findMessagesForNetwork(networkId, dateRange)
    .then(impl.prepareMessages(users, parentLookups));

  const addTopMessagesToBundle = (bundle) =>
    R.assoc('messages', impl.getTopMessagesForBundle(bundle, messages), bundle);
  const bundles = R.pipe(impl.createBundles, R.map(addTopMessagesToBundle))(users);

  const newColleagues = R.pipe(
    R.filter(impl.isInvitedLastWeek),
    R.map(impl.addTeamsToUser(R.__, parentLookups.teams))
  )(users);

  const createMail = (bundle) => weeklyUpdateMail(bundle, network, newColleagues, dateRange);
  return Promise.all(R.pipe(
    R.filter(impl.isValidBundle(R.__, newColleagues)),
    R.map(R.pipe(createMail)),
    R.map(mailer.send)
  )(bundles));
};

exports.send = send;
