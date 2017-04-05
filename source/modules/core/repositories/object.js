const R = require('ramda');
const { _Object } = require('./dao');
const createDomainObject = require('../models/object');
//const sequelizeInstance = require('../../../shared/configs/sequelize');
const sequelize = require('sequelize');
const { ObjectSeen } = require('./dao');

/**
 * Creating an object
 * @param {object} attributes - Object containing the attributes
 * @param {string} attributes.userId - The id that instantiated the object
 * @param {string} attributes.networkId - The network where the object is created for
 * @param {string} attributes.parentType - The type of parent to get objects for
 * @param {string} attributes.parentId - The id of the parent
 * @param {string} attributes.objectType - The type of object
 * @param {string} attributes.sourceId - The id that refers to the activity
 * @method create
 * @return {external:Promise.<Object>} {@link module:modules/feed~Object}
 */
const create = async (attributes) => {
  const whitelist = ['userId', 'networkId', 'parentType', 'parentId', 'objectType', 'sourceId'];
  const result = await _Object.create(R.pick(whitelist, attributes));

  return createDomainObject(result);
};

/**
 * Find objects by where constraint
 * @param {object} whereConstraint - Object containing a where constraint
 * @param {object} options - Object containing options
 * @param {string} options.offset - The offset of the result set
 * @param {string} options.limit - The limit of the result set
 * @param {string} options.order - The order of the result set
 * @method findBy
 * @return {external:Promise.<Object[]>} {@link module:modules/feed~Object}
 */
const findBy = async (whereConstraint, options) => {
  // const result = await _Object.findAll({
  //   attributes: ['*', sequelize.fn('COUNT', 'object_seen.*')],
  //   include: {
  //     model: ObjectSeen,
  //   },
  //   where: whereConstraint,
  // }, {
  //   logging: console.log,
  // });

 const result = await _Object.findAll(R.merge(options,
       { where: whereConstraint }));

  return R.map(createDomainObject, result);
};

const findByIncludeSeen = async (networkId, filters = [], offset = 0, rowCount = 20) => {

  // TODO - We need a nice query store which could even optimize raw queries

  /*  This query finds objects and joins them with the object_seen table
   *
   *  filters are magically created from the sequelize $or array
   *
   *  Params for this query:
   *    - :networkId
   *    - :offset
   *    - :rowCount
   */

  const params = {
    networkId,
    offset,
    rowCount
  };

  let processedFilters = '1=1';

  if (filters.length) {
    let extraParamCount = 0;
    let filtersDone = [];

    filters.forEach((filter) => {
      let currentFilter = [];

      for (var prop in filter) {
        const columnName = _Object.attributes[prop].field ? _Object.attributes[prop].field : prop;

        if (filter[prop].$in) {
          if (filter[prop].$in.length) {
            const inValues = filter[prop].$in.map(sequelizeInstance.escape).join(', ');
            currentFilter.push(`o.${columnName} IN (${inValues})`);
          } else {
            currentFilter.push('1=0');
          }
        } else {
          extraParamCount += 1;

          const extraParamName = `extra${extraParamCount}`;

          params[extraParamName] = filter[prop];
          currentFilter.push(`o.${columnName} = :${extraParamName}`);
        }
      }

      currentFilter = currentFilter.join(' AND ');

      filtersDone.push(`(${currentFilter})`);
    });

    filtersDone = filtersDone.join(' OR ');

    processedFilters = `(${filtersDone})`;
  }

  const objectQueryWithSeenCount = `SELECT
  o.id id,
  o.user_id userId,
  o.object_type objectType,
  o.source_id sourceId,
  o.parent_type parentType,
  o.parent_id parentId,
  o.created_at createdAt,
  o.updated_at updatedAt,
  o.network_id networkId,
  COUNT(os.id) seenCount
  FROM objects o LEFT JOIN object_seen os ON (o.id = os.object_id)
WHERE network_id = :networkId AND ${processedFilters}
GROUP BY o.id
ORDER BY created_at DESC
LIMIT :offset, :rowCount;`;

  const result = await sequelizeInstance.query(
    objectQueryWithSeenCount,
    {
      hasJoin: true,
      model: _Object,
      replacements: params
    });

  return R.map(createDomainObject, result);
};

/**
 * Delete objects by where constraint
 * @param {object} whereConstraint - Object containing a where constraint
 * @method deleteBy
 * @return {boolean}
 */
const deleteBy = async (whereConstraint) => {
  await _Object.destroy({ where: whereConstraint });

  return true;
};

/**
 * Count objects by where constraint
 * @param {object} whereConstraint - Object containing a where constraint
 * @method count
 * @return {boolean}
 */
const count = async (whereConstraint) => {
  return _Object.count({ where: whereConstraint });
};

/**
 * Update a single object
 * @param {string} objectId - The id of the object to update
 * @param {object} attributes - The attributes to update
 * @method update
 * @return {boolean}
 */
const update = async (objectId, attributes) => _Object
  .update(attributes, { where: { id: objectId } });

/**
 * Deletes an object by id
 * @param {string} - identifier for the object to delete
 * @method deleteById
 * @return {boolean}
 */
function deleteById(id) {
  return deleteBy({ id });
}

/**
 * Internal function
 * @method findAll
 * return {external:Promise.<Object[]>} {@link module:modules/feed~Object Object}
 */
function findAll() {
  return _Object.findAll();
}

exports.count = count;
exports.create = create;
exports.deleteBy = deleteBy;
exports.deleteById = deleteById;
exports.findAll = findAll;
exports.findBy = findBy;
exports.findByIncludeSeen = findByIncludeSeen;
exports.update = update;
