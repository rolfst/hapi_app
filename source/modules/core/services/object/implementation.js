/* global BindingTypeService */
const R = require('ramda');
const objectRepository = require('../../repositories/object');

const whereTypeAndId = (type, id) => R.both(R.propEq('type', type), R.propEq('id', id));
const findSource = (type, id, sources) => R.find(whereTypeAndId(type, id), sources) || null;
const compareObject = R.curry((object1, object2) => R.and(
  R.equals(object1.parentType, object2.objectType),
  R.equals(object1.parentId, object2.sourceId)));

/**
 * Find the sources for the object by type.
 * @param {object} message {@link module:shared~Message message} - Object containing meta data
 * @param {string[]} values - An array of ids that belong to a object type
 * @param {string} type - The object type
 * @method findSourcesForType
 * @return {Promise}
 */
const findSourcesForType = (message) => async (values, type) => {
  const service = BindingTypeService.getSource(type);

  return R.cond([
    [R.equals('private_message'), () => service({ messageIds: values }, message)],
    [R.equals('feed_message'), () => service({ messageIds: values }, message)],
    [R.equals('exchange'), () => service({ exchangeIds: values }, message)],
    [R.equals('poll'), () => service({ pollIds: values }, message)],
    [R.equals('attachment'), () => service({ attachmentIds: values }, message)],
  ])(type, values);
};

const findChildrenForType = R.curry((values, type) => R.cond([
  [R.equals('feed_message'), () => objectRepository.findBy({
    parentType: 'feed_message', parentId: { $in: values } })],
  [R.equals('private_message'), () => objectRepository.findBy({
    parentType: 'private_message', parentId: { $in: values } })],
])(type, values));

const addSourceToObject = R.curry((sources, object) =>
  R.merge(object, { source: findSource(object.objectType, object.sourceId, sources) }));

const findChildren = (objectsWithSource, object) =>
  R.filter(compareObject(R.__, object), objectsWithSource);

// exports of functions
exports.addSourceToObject = addSourceToObject;
exports.findChildren = findChildren;
exports.findChildrenForType = findChildrenForType;
exports.findSourcesForType = findSourcesForType;
