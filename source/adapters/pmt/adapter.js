import authenticate from './hooks/authenticate';
import fetchTeams from './hooks/fetch-teams';
import fetchUsers from './hooks/fetch-users';
import usersAvailableForShift from './hooks/users-available-for-shift';
import myShifts from './hooks/my-shifts';
import viewShift from './hooks/view-shift';

const pmtAdapter = ({ externalId }, token) => ({
  authenticate: authenticate(externalId),
  fetchTeams: fetchTeams(externalId),
  fetchUsers: fetchUsers(externalId),
  usersAvailableForShift: usersAvailableForShift(token, externalId),
  myShifts: myShifts(token, externalId),
  viewShift: viewShift(token, externalId),
});

export default pmtAdapter;
