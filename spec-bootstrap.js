/* global assert */
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const moment = require('moment-timezone');
const dotenv = require('dotenv');
const nock = require('nock');

chai.use(chaiAsPromised);
global.assert = chai.assert;
moment.tz.setDefault('UTC');
nock.disableNetConnect();

dotenv.config();
