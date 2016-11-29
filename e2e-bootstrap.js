import 'babel-polyfill';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import dotenv from 'dotenv';

chai.use(chaiAsPromised);
global.assert = chai.assert;

dotenv.config();

const createServer = require('./source/server').default;
global.server = createServer(8000);


