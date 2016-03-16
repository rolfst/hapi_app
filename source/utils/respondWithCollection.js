import collectionSerializer from 'utils/collectionSerializer';

export default (collection, settings, options = {}) => {
  return collection.map(item => collectionSerializer(item, options, settings));
};
