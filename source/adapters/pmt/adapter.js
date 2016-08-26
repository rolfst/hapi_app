import initialSync from 'adapters/pmt/hooks/initial-sync';
import authenticate from 'adapters/pmt/hooks/authenticate';
import usersAvailableForShift from 'adapters/pmt/hooks/users-available-for-shift';
import myShifts from 'adapters/pmt/hooks/my-shifts';

const pmtAdapter = (token) => ({
  initialSync,
  authenticate,
  usersAvailableForShift: usersAvailableForShift(token),
  myShifts: myShifts(token),
});

export default pmtAdapter;
