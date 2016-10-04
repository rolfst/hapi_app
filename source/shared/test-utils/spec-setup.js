import 'babel-polyfill';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon from 'sinon';
import notifier from '../services/notifier';

chai.use(chaiAsPromised);

before(() => sinon.stub(notifier, 'send').returns(null));
after(() => notifier.send.restore());
