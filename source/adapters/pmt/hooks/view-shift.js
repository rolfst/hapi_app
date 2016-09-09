import { find } from 'lodash';
import myShifts from './my-shifts';

export default (token, baseStoreUrl) => async (shiftId) => {
  const shifts = await myShifts(token, baseStoreUrl)();

  return find(shifts, { id: shiftId });
};
