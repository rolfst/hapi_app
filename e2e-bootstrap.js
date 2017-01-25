import 'babel-polyfill';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import dotenv from 'dotenv';
import moment from 'moment-timezone';
import nock from 'nock';

chai.use(chaiAsPromised);
global.assert = chai.assert;

dotenv.config();

moment.tz.setDefault('UTC');
const createServer = require('./source/server').default;
global.server = createServer(8000);
nock.disableNetConnect();


