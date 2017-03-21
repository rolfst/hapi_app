/* global assert */
import 'babel-polyfill';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import moment from 'moment-timezone';
import dotenv from 'dotenv';
import nock from 'nock';

chai.use(chaiAsPromised);
global.assert = chai.assert;
moment.tz.setDefault('UTC');
nock.disableNetConnect();

dotenv.config();

