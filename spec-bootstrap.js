import 'babel-polyfill';
import './source/shared/test-utils/setup';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import dotenv from 'dotenv';

chai.use(chaiAsPromised);
global.assert = chai.assert;

dotenv.config();

