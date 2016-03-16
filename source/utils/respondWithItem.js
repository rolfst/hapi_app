import itemSerializer from 'utils/itemSerializer';

export default (item, settings, options = {}) => {
  return itemSerializer(item, options, settings);
};
