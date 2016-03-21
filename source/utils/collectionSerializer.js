import buildRelations from 'utils/buildRelations';

/**
 * Build serialized output for an resource based on the child serializer and options.
 *
 * @function itemSerializer
 * @param {object} resource - The resource to serialize. This is a Sequelize model.
 * @param {object} options - Add options to the resource.
 * @param {array} options.relations - Relations to add to the resource.
 * @param {boolean} options.included - Add related resources to output.
 * @param {object} serializer - The serializer of the child serializer.
 * @param {array} serializer.relations - Available relations for the child serializer.
 */
export default (resource, options = {}, serializer) => {
  const relations = options.relations || false;

  const result = {
    type: resource.modelType,
    id: resource.id,
    attributes: serializer.getAttributes(resource),
    links: {
      self: `/${resource.modelType}/${resource.id}`,
    },
  };

  if (relations) result.relationships = buildRelations(relations, resource);

  return result;
};
