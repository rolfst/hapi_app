const R = require('ramda');
const Promise = require('bluebird');
const testHelpers = require('../source/shared/test-utils/helpers');
const organisationService = require('../source/modules/core/services/organisation');
const organisationRepository = require('../source/modules/core/repositories/organisation');
const networkService = require('../source/modules/core/services/network');
const userRepository = require('../source/modules/core/repositories/user');
const teamRepository = require('../source/modules/core/repositories/team');
const messageService = require('../source/modules/feed/services/message');
const commentService = require('../source/modules/feed/services/comment');
const flexchangeService = require('../source/modules/flexchange/services/flexchange');
const privateMessageService = require('../source/modules/chat/v2/services/private-message');
const conversationService = require('../source/modules/chat/v2/services/conversation');

const USERS_BLUEPRINT = require('../seeds/users');
const SUPERMARKT_BLUEPRINT = require('../seeds/organisation-retail');
const RESTAURANT_BLUEPRINT = require('../seeds/organisation-horeca');
const PRIVATE_MESSAGE_BLUEPRINT = require('../seeds/private-messages');

const findUserBlueprint = (email) => R.find(R.propEq('email', email), USERS_BLUEPRINT);

const seedUsers = async () => {
  const createdUsers = await Promise.map(USERS_BLUEPRINT, (user) => userRepository.createUser({
    username: user.email,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phoneNum: null,
    dateOfBirth: null,
    profileImg: user.profileImg || null,
    password: '1337%Demo',
  }));

  return createdUsers.reduce((acc, user) => {
    acc[user.email] = user;

    return acc;
  }, {});
};

const seedPrivateMessages = async (usersByEmail) => {
  // Create private messages
  await Promise.map(PRIVATE_MESSAGE_BLUEPRINT, async (privateMessageFromBlueprint) => {
    return conversationService.create({
      type: 'PRIVATE',
      participantIds: [usersByEmail[privateMessageFromBlueprint.participants[1]].id],
    }, {
      credentials: usersByEmail[privateMessageFromBlueprint.participants[0]],
    }).then((createdConversation) => {
      return Promise.map(privateMessageFromBlueprint.messages, async (message) => {
        return privateMessageService.create({
          conversationId: createdConversation.id,
          text: message.text,
        }, { credentials: usersByEmail[message.creator] });
      });
    });
  });
};

const seedOrganisation = async (organisationBlueprint, usersByEmail) => {
  const roleForOrganisation = (email) => {
    return R.contains(email, organisationBlueprint.admins) ? 'ADMIN' : 'EMPLOYEE';
  };

  const usersArray = Object.keys(usersByEmail).map((email) => {
    return usersByEmail[email];
  });

  // Create organisation
  const organisation = await organisationService.create({
    name: organisationBlueprint.name,
    brandIcon: null,
  });

  await Promise.map(usersArray, (user) => organisationRepository.addUser(
    user.id, organisation.id, roleForOrganisation(user.email), null));

  // Create networks with teams and users
  await Promise.map(organisationBlueprint.networks, async (networkFromBlueprint) => {
    // Create the network
    const createdNetwork = await networkService.create({
      userId: usersByEmail[networkFromBlueprint.admin].id,
      name: networkFromBlueprint.name,
      organisationId: organisation.id,
    });

    // Create teams to network and add members to teams
    await Promise.map(networkFromBlueprint.teams || [], (teamFromBlueprint) => {
      return teamRepository.create({ name: teamFromBlueprint.name, networkId: createdNetwork.id })
        .then((createdTeam) => Promise.map(teamFromBlueprint.members, (memberEmail) => {
          return teamRepository.addUserToTeam(createdTeam.id, usersByEmail[memberEmail].id);
        }));
    });

    // Add users to network
    await Promise.map(usersArray, async (user) => {
      await networkService.addUserToNetwork({
        networkId: createdNetwork.id,
        userId: user.id,
        roleType: findUserBlueprint(user.email).roleType,
      });

      await networkService.updateUserInNetwork({
        invitedAt: new Date(),
        networkId: createdNetwork.id,
        userId: user.id,
      });

      return user;
    });

    // Create messages for network
    await Promise.each(networkFromBlueprint.messages || [], async (messageFromBlueprint) => {
      const messagePayloadFromBlueprint = R.pick([
        'text', 'pollOptions', 'pollQuestion',
      ], messageFromBlueprint);

      const createdMessageObject = await messageService.create(
        R.merge(messagePayloadFromBlueprint, {
          parentType: 'network', parentId: createdNetwork.id,
        }), { credentials: usersByEmail[messageFromBlueprint.creator], network: createdNetwork });

      // Create comments for message
      await Promise.map(messageFromBlueprint.comments || [], (commentFromBlueprint) => {
        return commentService.create({
          messageId: createdMessageObject.sourceId,
          userId: usersByEmail[commentFromBlueprint.creator].id,
          text: commentFromBlueprint.text,
        });
      });

      // Create likes for message
      await Promise.map(messageFromBlueprint.likes || [], (likeFromBlueprint) => {
        return messageService.like({
          messageId: createdMessageObject.sourceId,
          userId: usersByEmail[likeFromBlueprint].id,
        }, { credentials: usersByEmail[likeFromBlueprint], network: createdNetwork });
      });
    });

    await Promise.delay(1000);

    // Create exchanges for network
    await Promise.map(networkFromBlueprint.exchanges || [], async (exchangeFromBlueprint) => {
      return flexchangeService.createExchange({
        date: exchangeFromBlueprint.date,
        startTime: exchangeFromBlueprint.startTime,
        endTime: exchangeFromBlueprint.endTime,
        type: 'ALL',
        values: [createdNetwork.id],
        description: exchangeFromBlueprint.description || null,
      }, {
        credentials: usersByEmail[exchangeFromBlueprint.creator],
        network: createdNetwork,
      });
    });

    return createdNetwork;
  });
};

(() => {
  testHelpers.cleanAll().then(async () => {
    const usersByEmail = await seedUsers();

    seedPrivateMessages(usersByEmail);
    seedOrganisation(SUPERMARKT_BLUEPRINT, usersByEmail);
    seedOrganisation(RESTAURANT_BLUEPRINT, usersByEmail);
  });
})();
