import { assert } from 'chai';
import moment from 'moment';
import sinon from 'sinon';
import R from 'ramda';
import Promise from 'bluebird';
import * as testHelpers from '../../../../shared/test-utils/helpers';
import * as notifier from '../../../../shared/services/notifier';
import * as flexchangeService from '../../../flexchange/services/flexchange';
import * as commentService from '../comment';
import * as messageService from '../message';
import * as feedService from './index';

describe('Service: Feed', () => {
  describe('make', () => {
    let sandbox;
    let team;
    let network;
    let otherNetwork;
    let admin;
    let employee;
    let createdMessages;
    let createdExchange;

    before(async () => {
      sandbox = sinon.sandbox.create();
      sandbox.stub(notifier, 'send');
      [admin, employee] = await Promise.all([
        testHelpers.createUser({ password: 'foo' }),
        testHelpers.createUser({ password: 'foo' }),
      ]);

      network = await testHelpers.createNetwork({ userId: admin.id });
      otherNetwork = await testHelpers.createNetwork({ userId: admin.id });
      team = await testHelpers.addTeamToNetwork(network.id);
      await testHelpers.addUserToNetwork({ userId: employee.id, networkId: network.id });
      await testHelpers.addUserToNetwork({ userId: employee.id, networkId: otherNetwork.id });

      const serviceMessage = { network, credentials: admin };

      const createdMessage1 = await Promise.delay(1000)
        .then(() => messageService.create({
          parentType: 'network',
          parentId: network.id,
          text: 'Message for feed',
        }, serviceMessage));

      const createdMessage2 = await Promise.delay(1000)
        .then(() => messageService.create({
          parentType: 'network',
          parentId: network.id,
          text: 'Second message for feed',
        }, serviceMessage));

      const createdMessage3 = await Promise.delay(1000)
        .then(() => messageService.create({
          parentType: 'network',
          parentId: otherNetwork.id,
          text: 'Second message for other feed',
        }, serviceMessage));

      const createdMessage4 = await Promise.delay(1000)
        .then(() => messageService.create({
          parentType: 'team',
          parentId: team.id,
          text: 'First message for team',
        }, serviceMessage));

      createdExchange = await Promise.delay(1000)
        .then(() => flexchangeService.createExchange({
          date: moment().toISOString(),
          startTime: moment().toISOString(),
          endTime: moment().add(3, 'hours').toISOString(),
          type: 'ALL',
          values: [network.id],
        }, serviceMessage));

      await Promise.delay(1000); // We wait here for the EventEmitter actions to finish

      createdMessages = [createdMessage1, createdMessage2, createdMessage3, createdMessage4];
    });

    after(() => {
      sandbox.restore();
      return testHelpers.cleanAll();
    });

    it('should only include team messages where user is member of', async () => {
      const actual = await feedService.makeForNetwork({
        networkId: network.id,
      }, { network, credentials: employee });

      assert.lengthOf(actual, 3);
      assert.notProperty(actual[0], 'comments');
      assert.notProperty(actual[0], 'likes');
      assert.equal(actual[0].objectType, 'exchange');
      assert.equal(actual[0].parentType, 'user');
      assert.equal(actual[0].parentId, employee.id);
      assert.equal(actual[0].sourceId, createdExchange.id);
      assert.equal(actual[1].objectType, 'feed_message');
      assert.equal(actual[1].parentType, 'network');
      assert.equal(actual[1].source.text, 'Second message for feed');
      assert.equal(actual[2].objectType, 'feed_message');
      assert.equal(actual[2].parentType, 'network');
      assert.equal(actual[2].source.text, 'Message for feed');
    });

    it('should return all messages for admin', async () => {
      const actual = await feedService.makeForNetwork({
        networkId: network.id,
      }, { network, credentials: admin });

      assert.equal(actual[0].objectType, 'feed_message');
      assert.equal(actual[0].parentType, 'team');
      assert.equal(actual[0].source.text, 'First message for team');
    });

    it('should return feed models for subset with limit and offset query', async () => {
      const actual = await feedService.makeForNetwork({
        networkId: network.id,
        offset: 1,
        limit: 2,
      }, { network, credentials: employee });

      assert.lengthOf(actual, 2);
      assert.equal(actual[0].objectType, 'feed_message');
      assert.equal(actual[0].source.text, 'Second message for feed');
      assert.equal(actual[1].objectType, 'feed_message');
      assert.equal(actual[1].source.text, 'Message for feed');
    });

    it('should include comments sub-resources via query parameter', async () => {
      await commentService.create({
        messageId: createdMessages[0].sourceId,
        userId: admin.id,
        text: 'Cool comment as sub-resource',
      });

      const actual = await feedService.makeForNetwork({
        networkId: network.id,
        include: ['comments'],
      }, { network, credentials: admin });

      const commentedMessage = R.find(R.propEq('sourceId', createdMessages[0].sourceId), actual);
      const uncommentedMessage = R.find(R.propEq('sourceId', createdMessages[1].sourceId), actual);

      assert.lengthOf(uncommentedMessage.comments, 0);
      assert.lengthOf(commentedMessage.comments, 1);
      assert.equal(commentedMessage.comments[0].messageId, createdMessages[0].sourceId);
      assert.equal(commentedMessage.comments[0].userId, admin.id);
      assert.equal(commentedMessage.comments[0].text, 'Cool comment as sub-resource');
    });

    it('should include messages for teams in network feed', async () => {
      const actual = await feedService.makeForNetwork({
        networkId: network.id,
      }, { network, credentials: admin });

      const teamMessage = R.find(R.propEq('parentType', 'team'), actual);

      assert.isDefined(teamMessage);
      assert.equal(teamMessage.source.text, 'First message for team');
    });

    it('should include likes sub-resources via query parameter', async () => {
      await messageService.like({
        messageId: createdMessages[1].sourceId,
        userId: admin.id,
      });

      const actual = await feedService.makeForNetwork({
        networkId: network.id,
        include: ['likes'],
      }, { network, credentials: admin });

      const likedMessage = R.find(R.propEq('sourceId', createdMessages[1].sourceId), actual);

      assert.lengthOf(likedMessage.likes, 1);
      assert.equal(likedMessage.likes[0].userId, admin.id);
    });

    it('should be able to include multiple sub-resources via query parameter', async () => {
      const actual = await feedService.makeForNetwork({
        networkId: network.id,
        include: ['likes', 'comments'],
      }, { network, credentials: admin });

      const likedMessage = R.find(R.propEq('sourceId', createdMessages[1].sourceId), actual);
      const commentedMessage = R.find(R.propEq('sourceId', createdMessages[0].sourceId), actual);

      assert.lengthOf(likedMessage.likes, 1);
      assert.equal(likedMessage.likes[0].userId, admin.id);
      assert.equal(commentedMessage.comments[0].messageId, createdMessages[0].sourceId);
      assert.equal(commentedMessage.comments[0].userId, admin.id);
      assert.equal(commentedMessage.comments[0].text, 'Cool comment as sub-resource');
    });

    it('should only include exchanges for user created for network', async () => {
      await flexchangeService.createExchange({
        date: moment().toISOString(),
        startTime: moment().toISOString(),
        endTime: moment().add(3, 'hours').toISOString(),
        type: 'ALL',
        values: [otherNetwork.id],
      }, { network: otherNetwork, credentials: admin });

      await Promise.delay(1000);

      const actual = await feedService.makeForNetwork({
        networkId: network.id,
      }, { network, credentials: employee });

      const exchangeObjects = R.filter(R.propEq('objectType', 'exchange'), actual);

      assert.lengthOf(exchangeObjects, 1);
      assert.equal(exchangeObjects[0].source.networkId, network.id);
    });

    it('should return feed models from team', async () => {
      const actual = await feedService.makeForTeam({
        teamId: team.id,
      }, { network, credentials: admin });

      assert.lengthOf(actual, 1);
      assert.equal(actual[0].objectType, 'feed_message');
      assert.equal(actual[0].source.text, 'First message for team');
    });

    it('should have 5 messages in the database', async () => {
      const objects = await testHelpers.findAllObjects();

      assert.equal(objects.length, 6);
    });
  });
});
