const authenticate = require('./hooks/authenticate');
const fetchTeams = require('./hooks/fetch-teams');
const fetchUsers = require('./hooks/fetch-users');
const usersAvailableForShift = require('./hooks/users-available-for-shift');
const myShifts = require('./hooks/my-shifts');
const viewShift = require('./hooks/view-shift');

const pmtAdapter = ({ externalId }, token) => ({
  authenticate: authenticate(externalId),
  fetchTeams: fetchTeams(externalId),
  fetchUsers: fetchUsers(externalId),
  usersAvailableForShift: usersAvailableForShift(externalId, token),
  myShifts: myShifts(externalId, token),
  viewShift: viewShift(externalId, token),
});

module.exports = pmtAdapter;
