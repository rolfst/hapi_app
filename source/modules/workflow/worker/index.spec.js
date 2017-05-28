const { assert } = require('chai');
const sinon = require('sinon');
const workflowWorker = require('./');

describe('Workflow worker', () => {
  let sandbox;

  before(() => {
    sandbox = sinon.sandbox.create();
  });

  afterEach(() => (sandbox.restore()));

  describe('has functions', () => {
    it('should have a start and shutdown function', () => {
      assert.property(workflowWorker, 'start');
      assert.property(workflowWorker, 'shutdown');
    });
  });
});
