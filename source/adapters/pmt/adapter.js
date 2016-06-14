import initialSync from 'adapters/pmt/hooks/initial-sync';
import authenticate from 'adapters/pmt/hooks/authenticate';
import usersAvailableForShift from 'adapters/pmt/hooks/users-available-for-shift';
import myShifts from 'adapters/pmt/hooks/my-shifts';
import acceptExchange from 'adapters/pmt/hooks/accept-exchange';
import updateUser from 'adapters/pmt/hooks/update-user';

const pmtAdapter = (token) => {
  return {
    initialSync,
    authenticate,
    usersAvailableForShift: usersAvailableForShift(token),
    myShifts: myShifts(token),
    updateUser: updateUser(token),
    acceptExchange: acceptExchange(token),
  };
};

export default pmtAdapter;
