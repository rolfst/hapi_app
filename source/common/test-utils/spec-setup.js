import 'babel-polyfill';
import chai from 'chai';
import sinon from 'sinon';
import Parse from 'parse/node';

const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

before(() => {
  global.parseSendStub = sinon.stub(Parse.Push, 'send').returns(null);
});
after(() => Parse.Push.send.restore());
