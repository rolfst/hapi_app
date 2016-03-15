import buildRelations from 'utils/buildRelations';

/**
 * Build serialized output for an item based on the child serializer and options.
 * @function rootSerializer
 * @param {object} item - The item to serialize.
 * @param {object} options - Add options to the item.
 * @param {object} settings - The settings from the child serializer.
 */
export default (item, options = {}, settings) => {
  const relations = options.relations || false;

  const resource = {
    type: settings.type,
    id: item.id,
    attributes: settings.getAttributes(item),
    links: {
      self: `/${settings.type}/${item.id}`,
    },
  };

  if (relations) resource.relationships = buildRelations(relations);

  return resource;
};
