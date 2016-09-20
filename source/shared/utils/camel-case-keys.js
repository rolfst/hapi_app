import { mapKeys, camelCase } from 'lodash';

export default (obj) => mapKeys(obj, (val, key) => camelCase(key));
