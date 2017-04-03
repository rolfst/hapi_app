const R = require('ramda');
const sinon = require('sinon');
const Mixpanel = require('../../../../shared/services/mixpanel');
const unit = require('./index');

describe('event', () => {
  let sandbox;
  before(() => {
    sandbox = sinon.sandbox.create();
  });
  afterEach(() => sandbox.restore());

  // These test will fail if the template engine does not receive the correct params
  R.forEachObjIndexed((fun, key) => {
    if (!Object.prototype.hasOwnProperty.call(unit, key) || typeof fun !== 'function') return;

    it(`should send correct properties when creating query for ${key} by user`, async () => {
      sandbox.stub(Mixpanel, 'executeQuery').returns(Promise.resolve());
      await fun({ networkId: '1', type: 'user' });
    });
  }, unit);

  it('should send correct properties when creating query for Created Message by team', async () => {
    sandbox.stub(Mixpanel, 'executeQuery').returns(Promise.resolve());
    await unit.getCreatedMessages({ networkId: '1', type: 'team' });
  });
});
