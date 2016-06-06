import initialSync from 'adapters/pmt/hooks/initial-sync';
import usersAvailableForShift from 'adapters/pmt/hooks/users-available-for-shift';
import myShifts from 'adapters/pmt/hooks/my-shifts';
import acceptExchange from 'adapters/pmt/hooks/accept-exchange';
import updateUser from 'adapters/pmt/hooks/update-user';

const pmtAdapter = {
  initialSync,
  usersAvailableForShift,
  myShifts,
  updateUser,
  acceptExchange,
};

export default pmtAdapter;
