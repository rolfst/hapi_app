const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const dotenv = require('dotenv');
const moment = require('moment-timezone');
const nock = require('nock');

chai.use(chaiAsPromised);
global.assert = chai.assert;

dotenv.config();

moment.tz.setDefault('UTC');
const createServer = require('./source/server');
global.server = createServer(8000);
nock.disableNetConnect();
