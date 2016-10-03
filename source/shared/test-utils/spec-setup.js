import 'babel-polyfill';
import chai from 'chai';
import sinon from 'sinon';
import notifier from 'shared/services/notifier';

const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

before(() => sinon.stub(notifier, 'send').returns(null));
after(() => notifier.send.restore());
