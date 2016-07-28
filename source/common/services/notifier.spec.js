import { assert } from 'chai';
import sinon from 'sinon';
import Parse from 'parse/node';
import * as notify from 'common/services/notifier';

describe('Notifier', () => {
  it('should return the right receivers', () => {
    const users = [
      { fullName: 'Test1', email: 'test1@flex-appeal.nl' },
      { fullName: 'Test2', email: 'test2@flex-appeal.nl' },
    ];
    const expected = ['test1@flex-appeal.nl', 'test2@flex-appeal.nl'];

    const receivers = notify.createEmailList(users);

    assert.equal(receivers.length, 2);
    assert.deepEqual(receivers, expected);
  });

  it('should send a notification', () => {
    sinon.stub(Parse, 'initialize').returns(null);
    Parse.Push.send.reset();

    notify.default([], {});
    Parse.initialize.restore();

    assert.equal(Parse.Push.send.calledOnce, true);
  });
});
