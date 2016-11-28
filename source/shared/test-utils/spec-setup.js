import 'babel-polyfill';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon from 'sinon';
import dotenv from 'dotenv';
import * as notifier from '../services/notifier';

dotenv.config();
chai.use(chaiAsPromised);

before(() => {
  sinon.stub(notifier, 'send').returns(null);
});

after(() => {
  notifier.send.restore();
});
