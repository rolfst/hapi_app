import { assert } from 'chai';
import sinon from 'sinon';
import { exchangeTypes } from '../models/exchange';
import * as networkUtil from '../../../shared/utils/network';
import * as exchangeRepo from '../repositories/exchange';
import * as exchangeValueRepo from '../repositories/exchange-value';
import * as networkRepo from '../../core/repositories/network';
import * as userRepo from '../../core/repositories/user';
import * as service from '../services/flexchange';
import * as exchangeCreatedNotification from '../notifications/exchange-created';

describe('Create exchange', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();

    sandbox.stub(networkUtil, 'hasIntegration').returns(null);
    sandbox.stub(exchangeValueRepo, 'createValuesForExchange').returns(null);
    sandbox.stub(exchangeRepo, 'findExchangeById').returns(null);
    sandbox.stub(networkRepo, 'findAllUsersForNetwork').returns(Promise.resolve([]));
    sandbox.stub(exchangeRepo, 'createExchange')
      .returns(Promise.resolve({ type: exchangeTypes.NETWORK }));
  });

  afterEach(() => (sandbox.restore()));

  it('should send a notification', async () => {
    sandbox.stub(exchangeCreatedNotification, 'send').returns(Promise.resolve(null));
    sandbox.stub(userRepo, 'findUserMetaDataForNetwork')
      .returns(Promise.resolve({ roleType: 'EMPLOYEE' }));

    const message = {
      network: {
        id: '1',
        name: 'Foo network',
        NetworkUser: { roleType: 'EMPLOYEE' },
      },
      credentials: { id: '1' },
    };

    const payload = {
      exchangeId: null,
      user_id: '1',
      type: exchangeTypes.NETWORK,
    };

    await service.createExchange(payload, message);

    assert.equal(exchangeCreatedNotification.send.calledOnce, true);
  });
});
