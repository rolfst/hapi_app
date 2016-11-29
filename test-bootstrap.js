import 'babel-polyfill';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);
global.assert = chai.assert;

