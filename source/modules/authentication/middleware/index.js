const tokenUtil = require('../../../shared/utils/token');
const User = require('../../authorization/utils/user-cache');
const createError = require('../../../shared/utils/create-error');
const serverUtil = require('../../../shared/utils/server');
const { ERoleTypes, ERoutePermissions, EPrefetchData } = require('../../authorization/definitions');
const { AuthenticationError } = require('../../authorization/utils/errors');
const prefetchCaches = require('../../authorization/utils/prefetch-caches');

const logger = require('../../../shared/services/logger')('SHARED/middleware/authenticatorStrategy');

const checkPermission = (user, { organisation, network, team }, permission) => {
  if (!permission || (!user && !permission)) return;

  if (permission === ERoutePermissions.ORGANISATION_ADMIN) {
    if (!organisation) throw new AuthenticationError(EPrefetchData.ORGANISATION);
    if (!organisation.id) throw new AuthenticationError('Missing organisation');

    if (!user.hasRoleInOrganisation(organisation.id, ERoleTypes.ADMIN)) {
      throw new AuthenticationError(ERoutePermissions.ORGANISATION_ADMIN);
    }
  }

  if (permission === ERoutePermissions.ORGANISATION_USER) {
    if (!organisation) throw new AuthenticationError(EPrefetchData.ORGANISATION);
    if (!organisation.id) throw new AuthenticationError('Missing organisation');

    if (!user.hasRoleInOrganisation(organisation.id)) {
      throw new AuthenticationError(ERoutePermissions.ORGANISATION_USER);
    }
  }

  if (permission === ERoutePermissions.NETWORK_ADMIN) {
    if (!network) throw new AuthenticationError(EPrefetchData.NETWORK);
    if (!network.id) throw new AuthenticationError('Missing network');

    if (!user.hasRoleInNetwork(network.id, ERoleTypes.ADMIN)) {
      throw new AuthenticationError(ERoutePermissions.NETWORK_ADMIN);
    }
  }

  if (permission === ERoutePermissions.NETWORK_USER) {
    if (!network) throw new AuthenticationError(EPrefetchData.NETWORK);
    if (!network.id) throw new AuthenticationError('Missing network');

    if (!user.hasRoleInNetwork(network.id)) {
      throw new AuthenticationError(ERoutePermissions.NETWORK_USER);
    }
  }

  if (permission === ERoutePermissions.TEAM_MEMBER) {
    if (!team) throw new AuthenticationError(EPrefetchData.TEAM);
    if (!team.id) throw new AuthenticationError('Missing network');

    if (!user.isMemberOfTeam(team.id)) {
      throw new AuthenticationError(ERoutePermissions.TEAM_MEMBER);
    }
  }
};

module.exports = () => ({
  async authenticate(request, reply) {
    const artifacts = { requestId: request.id };

    try {
      const { networkId, organisationId, teamId } = request.params;
      let organisation = { id: organisationId };
      let network = { id: networkId };
      let team = { id: teamId };

      if (request.route.settings.app.prefetch) {
        const performPrefetch = async (prefetchData) => {
          try {
            switch (prefetchData) {
              case EPrefetchData.ORGANISATION:
                if (!organisationId) throw new AuthenticationError(EPrefetchData.ORGANISATION);
                organisation = await prefetchCaches.getOrganisation(organisationId);
                if (!organisation) throw new AuthenticationError(EPrefetchData.ORGANISATION);
                artifacts.organisation = organisation;
                break;
              case EPrefetchData.NETWORK:
                if (!networkId) throw new AuthenticationError(EPrefetchData.NETWORK);
                network = await prefetchCaches.getNetwork(networkId);
                if (!network) throw new AuthenticationError(EPrefetchData.NETWORK);
                artifacts.network = network;
                break;
              case EPrefetchData.TEAM:
                if (!teamId) throw new AuthenticationError(EPrefetchData.TEAM);
                team = await prefetchCaches.getTeam(teamId);
                if (!team) throw new AuthenticationError(EPrefetchData.TEAM);
                artifacts.team = team;
                break;
              default:
                throw new AuthenticationError('Unknown prefetch type');
            }
          } catch (err) {
            if (!(err instanceof AuthenticationError)) {
              throw new AuthenticationError('Fetching data failed!');
            }

            throw err;
          }
        };

        if (Array.isArray(request.route.settings.app.prefetch)) {
          await Promise.map(request.route.settings.app.prefetch, performPrefetch);
        } else {
          await performPrefetch(request.route.settings.app.prefetch);
        }
      }

      const token = request.raw.req.headers['x-api-token'];
      const permissions = request.route.settings.app.permissions;

      if (permissions && !token) throw AuthenticationError('No token provided');

      const { sub: userId } = tokenUtil.decode(token);
      const user = await User.get(userId);

      if (Array.isArray(permissions)) {
        permissions.forEach(checkPermission.bind(
          null,
          user,
          { network, organisation, team }
        ));
      } else {
        checkPermission(user, { network, organisation, team }, permissions);
      }

      artifacts.authenticationToken = token;

      return reply.continue(
        {
          credentials: { id: user.id, user, context: { networkId, organisationId, teamId } },
          artifacts,
        });
    } catch (err) {
      if (err instanceof AuthenticationError) {
        return reply(createError(err.errorCode || '403', err.errorCode ? null : 'Could not authenticate.'));
      }
      const message = { artifacts };
      logger.error('Error in Authenticator Strategy', err, message);

      // This is to make old API logic backwards compatible with clients
      // that have not updated yet.
      if (request.url.path.includes('v1/chats')) {
        return reply(createError('403', 'Could not authenticate.'));
      }

      const errorResponse = serverUtil.transformBoomToErrorResponse(
        !err.isBoom ? createError('401') : err);

      return reply(errorResponse);
    }
  },
});
