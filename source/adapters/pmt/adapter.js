import authenticate from 'adapters/pmt/hooks/authenticate';
import fetchTeams from 'adapters/pmt/hooks/fetch-teams';
import fetchUsers from 'adapters/pmt/hooks/fetch-users';
import usersAvailableForShift from 'adapters/pmt/hooks/users-available-for-shift';
import myShifts from 'adapters/pmt/hooks/my-shifts';

const pmtAdapter = (network, token) => ({
  authenticate,
  fetchTeams: fetchTeams(network.externalId),
  fetchUsers: fetchUsers(network.externalId),
  usersAvailableForShift: usersAvailableForShift(token, network.externalId),
  myShifts: myShifts(token),
});

export default pmtAdapter;
