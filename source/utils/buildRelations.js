/**
 * Build the relationships output.
 * @function buildRelations
 * @param {array} relations - The relations consisting of object with a type and ids property.
 */
const buildRelations = relations => {
  const results = relations.reduce((newObj, value) => {
    let data = value.ids.map(id => {
      return { type: value.type, id };
    });

    if (value.ids.length === 1) {
      data = { type: value.type, id: value.ids[0] };
    }

    newObj[value.type] = { data };

    return newObj;
  }, {});

  return results;
};

export default buildRelations;
