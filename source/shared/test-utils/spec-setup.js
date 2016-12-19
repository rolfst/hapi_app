import 'babel-polyfill';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon from 'sinon';
import dotenv from 'dotenv';
import * as notifier from '../services/notifier';
import * as mailer from '../services/mailer';
import moment from 'moment-timezone';

dotenv.config();
chai.use(chaiAsPromised);
moment.tz.setDefault('UTC');

before(() => {
  notifier.send.restore();
  mailer.send.restore();
});

after(() => {
  sinon.stub(notifier, 'send').returns(null);
  sinon.stub(mailer, 'send').returns(null);
});
