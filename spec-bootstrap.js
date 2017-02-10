/* global assert */
import 'babel-polyfill';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import moment from 'moment-timezone';
import dotenv from 'dotenv';

chai.use(chaiAsPromised);
global.assert = chai.assert;
moment.tz.setDefault('UTC');

dotenv.config();

