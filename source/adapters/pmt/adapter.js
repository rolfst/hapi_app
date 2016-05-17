import initialSync from 'adapters/pmt/hooks/initial-sync';
import usersAvailableForShift from 'adapters/pmt/hooks/users-available-for-shift';
import myShifts from 'adapters/pmt/hooks/my-shifts';
import acceptExchange from 'adapters/pmt/hooks/accept-exchange';

const pmtAdapter = {
  initialSync,
  usersAvailableForShift,
  myShifts,
  acceptExchange,
};

export default pmtAdapter;
