import _ from 'lodash';

/**
 * Get the ids from related resources.
 *
 * @function getIdsFromRelatedData
 * @param {array|object} relatedData - The related resource(s).
 */
const getIdsFromRelatedData = relatedData => {
  return _.isArray(relatedData) ? _.map(relatedData, 'id') : [relatedData.id];
};

/**
 * Build the relationships output.
 *
 * @function buildRelations
 * @param {array} relations - The relations to add to the resource.
 * @param {object} resource - The resource to add the relations to.
 */
const buildRelations = (relations, resource) => {
  const results = relations.reduce((newObj, relation) => {
    const ids = getIdsFromRelatedData(resource[_.capitalize(relation)]);

    let data = { type: relation, id: ids[0] };

    if (ids.length !== 1) {
      data = ids.map(id => {
        return { type: relation, id };
      });
    }

    newObj[relation] = {
      links: {
        self: `/${resource.modelType}/${resource.id}/relationships/${relation}`,
        related: `/${resource.modelType}/${resource.id}/${relation}`,
      },
      data,
    };

    return newObj;
  }, {});

  return results;
};

export default buildRelations;
