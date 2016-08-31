import { assert } from 'chai';
import sinon from 'sinon';
import * as notifier from 'common/services/notifier';
import logger from 'common/services/logger';

describe('Notifier', () => {
  before(() => {
    sinon.stub(logger);
  });

  it('should return the right receivers', () => {
    const users = [
      { fullName: 'Test1', email: 'test1@flex-appeal.nl' },
      { fullName: 'Test2', email: 'test2@flex-appeal.nl' },
      { fullName: 'Test3' },
    ];
    const expected = ['test1@flex-appeal.nl', 'test2@flex-appeal.nl'];

    const receivers = notifier.createEmailList(users);

    assert.equal(receivers.length, 2);
    assert.deepEqual(receivers, expected);
  });

  it('should send a notification', () => {
    notifier.default.send([], {});

    assert.equal(notifier.default.send.calledOnce, true);
  });
});
