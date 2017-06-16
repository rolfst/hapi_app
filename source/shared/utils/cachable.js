const Promise = require('bluebird');

/**
 * Hold cache instances so they can be re-used
 * @type {{}}
 */
const cacheInstances = {};

class Cachable {
  /**
   * Get an instance of a cache
   * @param name - Name that identifies this cache
   * @param options - An object containing additional config for the cache
   * @param options.ttl - The default ttl for cached items in ms (defaults to 0 - infinite)
   * @returns {Cachable}
   */
  static getCache(name, options = {}) {
    const cacheKey = `_${name}`;

    if (!Object.prototype.hasOwnProperty.call(cacheInstances, cacheKey)) {
      cacheInstances[cacheKey] = new Cachable(name, options);
    }

    return cacheInstances[cacheKey];
  }

  /**
   * Construct the cache class
   * @param name - Name that identifies this cache
   * @param options - An object containing additional config for the cache
   * @param options.ttl - The default ttl for cached items in ms (defaults to 0 - infinite)
   */
  constructor(name, options = {}) {
    this.name = name;
    this.ttl = options.ttl || 0;
    this.init();
  }

  /**
   * Perform actions needed to initialize the cache
   */
  init() {
    this.cache = {};
  }

  /**
   * Get an item from the cache (if it exists and ttl has not epired)
   * @param key
   * @returns {*|Promise.<*>}
   */
  async get(key) {
    const cachedItem = await this._read(key);

    if (!cachedItem) return null;

    const ttl = cachedItem.ttl || this.ttl;

    if (ttl && new Date() - cachedItem.created > ttl) {
      await this._delete(key);
      return null;
    }

    return cachedItem.data;
  }

  /**
   * Set an item in the cache
   * @param key - The key that references the item
   * @param data - The data that is to be written
   * @param ttl - The time in ms that this data is valid
   * @returns {*|Promise.<*>}
   */
  set(key, data, ttl) {
    return this._write(key, { data, created: new Date(), ttl: ttl || this.ttl });
  }

  /**
   * Remove an item from the cache
   * @param key - The key that references the item
   * @returns {*|Promise.<*>}
   */
  remove(key) {
    return this._delete(key);
  }

  /**
   * Return an array of all keys available in the cache that are not expired or made after the call
   *   Optionally execute a function to filter again
   * @param filterFn (key, cachedItem) - A function to filter results (like Array.filter)
   * @returns {Array<string>}
   * @private
   */
  async keys(filterFn) {
    const callDate = new Date();

    return Promise.map(this._keys(), async (key) => {
      const cachedItem = await this.get(key);
      const ttl = cachedItem.ttl || this.ttl;

      if (cachedItem.created > callDate) return null;
      if (ttl && new Date() - cachedItem.created > ttl) {
        this.remove(key);
        return null;
      }

      if (!filterFn) return key;

      return filterFn(key, cachedItem) ? key : null;
    })
      .filter((item) => !!item);
  }

  /**
   * Internal method that fetches data from the cache (if it exists)
   * @param key - The key that references the item
   * @returns {*}
   * @private
   */
  _read(key) {
    const cacheKey = `_${key}`;

    if (!Object.prototype.hasOwnProperty.call(this.cache, cacheKey)) return null;

    return this.cache[cacheKey];
  }

  /**
   * Internal method that writes data to the cache
   * @param key - The key that references the item
   * @param data - The data to write
   * @private
   */
  _write(key, data) {
    const cacheKey = `_${key}`;

    this.cache[cacheKey] = data;
  }

  /**
   * Internal method that deletes data from the cache
   * @param key - The key that references the item
   * @private
   */
  _delete(key) {
    const cacheKey = `_${key}`;

    delete this.cache[cacheKey];
  }

  /**
   * Internal method that returns an array of all keys available in the cache
   * @returns {Array<string>}
   * @private
   */
  _keys() {
    return Object
      .keys(this.cache)
      .map((key) => key.substr(1));
  }
}

module.exports = Cachable;
