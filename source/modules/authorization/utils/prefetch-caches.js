const Cachable = require('../../../shared/utils/cachable');

const organisationService = require('../../core/services/organisation');
const networkService = require('../../core/services/network');
const teamService = require('../../core/services/team');

const { CACHE_TTL } = require('../../authorization/definitions');

const organisationCache = Cachable.getCache('organisations', { ttl: CACHE_TTL.ORGANISATION });
const networkCache = Cachable.getCache('networks', { ttl: CACHE_TTL.NETWORK });
const teamCache = Cachable.getCache('teams', { ttl: CACHE_TTL.TEAM });

/**
 * Create a function that gets an entity from the cache
 * @param cache - The cache object to use, it is awaited because it might still be initializing
 * @param getterFunction - The function to call if id is not found in the cache
 * @returns {function(id{number})}
 */
const createGet = (cache, getterFunction) => {
  return async (key) => {
    await cache;
    let data = await cache.get(key);

    if (!data) {
      data = await getterFunction(key);
      await cache.set(key, data);
    }

    return data;
  };
};

/**
 * Create a function that removes an entity from the cache
 * @param cache - The cache object to use, it is awaited because it might still be initializing
 * @returns {function(id{number}): *}
 */
const createInvalidate = (cache) => {
  return async (key) => (await cache).remove(key);
};

/**
 * Create a function that gets keys from the cache
 * @param cache - The cache object to use, it is awaited because it might still be initializing
 * @returns {function(filterFn{Function}): *}
 */
const createFilter = (cache) => {
  return async (filterFn) => (await cache).keys(filterFn);
};

// TODO - call invalidate function in places where any of these resources are altered
exports.getOrganisation = createGet(organisationCache, (organisationId) =>
  organisationService.getOrganisation({ organisationId }));
exports.invalidateOrganisationCache = createInvalidate(organisationCache);
exports.filterOrganisationCache = createFilter(organisationCache);
exports.getNetwork = createGet(networkCache, (networkId) => networkService.get({ networkId }));
exports.invalidateNetworkCache = createInvalidate(networkCache);
exports.filterNetworkCache = createFilter(networkCache);
exports.getTeam = createGet(teamCache, (teamId) => teamService.get({ teamId }));
exports.invalidateTeamCache = createInvalidate(teamCache);
exports.filterTeamCache = createFilter(teamCache);
