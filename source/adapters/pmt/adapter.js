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
  usersAvailableForShift: usersAvailableForShift(externalId, token),
  myShifts: myShifts(externalId, token),
  viewShift: viewShift(externalId, token),
});

export default pmtAdapter;
