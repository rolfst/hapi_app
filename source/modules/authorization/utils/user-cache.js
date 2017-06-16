const R = require('ramda');
const { getUserData } = require('./get-user-data');
const { ERoleTypes, CACHE_TTL } = require('../../authorization/definitions');
const { PermissionError } = require('../utils/errors');
const { createAuthenticationTokens } = require('../../authentication/services/authentication/implementation');
const Cachable = require('../../../shared/utils/cachable');

class User {
  static get cache() {
    return Cachable.getCache('users', { ttl: CACHE_TTL.USER });
  }

  static async get(userId) {
    const cache = await User.cache;
    let data = await cache.get(userId);

    if (!data) {
      data = await getUserData(userId);

      await cache.set(userId, data);
    }

    return new User(data);
  }

  /**
   * Loop through the entire cache (skipping expired) and run a function on it
   * @param filterFn (key, cachedItem) - A function to filter results (like Array.filter)
   * @returns {*}
   */
  static async filter(filterFn) {
    const cache = await User.cache;

    return cache.keys(filterFn);
  }

  static async invalidateCache(userId) {
    return (await User.cache).remove(userId);
  }

  invalidateCache() {
    if (this.id) return User.invalidateCache(this.id);
  }

  constructor(user) {
    R.forEachObjIndexed((val, key) => {
      this[key] = val;
    }, user);
  }

  hasRoleInOrganisation(organisationId, requestedRole = ERoleTypes.ANY) {
    if (!Object.prototype.hasOwnProperty.call(this.scopes.organisations, organisationId)) {
      return false;
    }

    return requestedRole === ERoleTypes.ANY
      || this.scopes.organisations[organisationId].roleType === ERoleTypes.ADMIN
      || this.scopes.organisations[organisationId].roleType === requestedRole;
  }

  hasRoleInNetwork(networkId, requestedRole = ERoleTypes.ANY) {
    if (!Object.prototype.hasOwnProperty.call(this.scopes.networks, networkId)) {
      return false;
    }

    return requestedRole === ERoleTypes.ANY
      || this.scopes.networks[networkId].roleType === ERoleTypes.ADMIN
      || this.scopes.networks[networkId].roleType === requestedRole;
  }

  isMemberOfTeam(teamId) {
    return Object.prototype.hasOwnProperty.call(this.scopes.teams, teamId);
  }

  async can(resource, permission, context = null) {
    if (Array.isArray(permission)) {
      return permission.every((singlePermission) => this.can(resource, singlePermission, context));
    }

    // TODO - implement acl
    return false;
  }

  async assert(resource, permission, context = null) {
    if (Array.isArray(permission)) {
      return permission.every((singlePermission) =>
        this.assert(resource, singlePermission, context));
    }

    if (!(await this.can(resource, permission, context))) {
      throw new PermissionError(permission, { resource, context });
    }
  }

  createTokens(deviceName) {
    return createAuthenticationTokens(this, deviceName);
  }
}

module.exports = User;
