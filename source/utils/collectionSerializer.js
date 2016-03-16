import buildRelations from 'utils/buildRelations';

/**
 * Build serialized output for an resource based on the child serializer and options.
 *
 * @function rootSerializer
 * @param {object} resource - The resource to serialize.
 * @param {object} options - Add options to the resource.
 * @param {array} options.relations - Relations to add to the resource.
 * @param {array} options.includes - Included relations to add to the resource.
 * @param {object} settings - The settings of the child serializer.
 * @param {string} settings.type - The type of the child serializer.
 * @param {array} settings.relations - Available relations for the child serializer.
 */
export default (resource, options = {}, settings) => {
  const relations = options.relations || false;

  const result = {
    type: settings.type,
    id: resource.id,
    attributes: settings.getAttributes(resource),
    links: {
      self: `/${settings.type}/${resource.id}`,
    },
  };

  if (relations) result.relationships = buildRelations(relations, resource);

  return result;
};
