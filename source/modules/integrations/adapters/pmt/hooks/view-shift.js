import { find } from 'lodash';
import myShifts from './my-shifts';

export default (baseStoreUrl, token) => async (shiftId) => {
  const shifts = await myShifts(baseStoreUrl, token)();

  return find(shifts, { id: shiftId });
};
