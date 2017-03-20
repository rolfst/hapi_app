const bindings = new Map();

/**
 * This method binds a service to the container.
 * a service method can use this to bypass cirular dependencies. e.g. a hack
 * @param {string} key - the identifier under what name the service is
 * registered
 * @param method {object} method - the service method to be accessed
 * @method registerSource
 */
function registerSource(key, method) {
  if (bindings.has(key)) throw new Error('Binding already exist');
  bindings.set(key, method);
}

function getSource(key) {
  if (!bindings.has(key)) throw new Error('Binding not registered');
  return bindings.get(key);
}

global.BindingTypeService = {
  registerSource,
  getSource,
};
