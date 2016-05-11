import initialSync from 'integrations/pmt/initial-sync';
import usersAvailableForShift from 'integrations/pmt/hooks/users-available-for-shift';
import myShifts from 'integrations/pmt/hooks/my-shifts';
import acceptExchange from 'integrations/pmt/hooks/accept-exchange';

const pmtAdapter = {
  initialSync,
  usersAvailableForShift,
  myShifts,
  acceptExchange,
};

export default pmtAdapter;
