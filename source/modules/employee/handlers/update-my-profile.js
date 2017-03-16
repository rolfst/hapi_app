const createServicePayload = require('../../../shared/utils/create-service-payload');
const responseUtil = require('../../../shared/utils/response');
const employeeService = require('../services/employee');

module.exports = async (req, reply) => {
  try {
    const { payload, message } = createServicePayload(req);
    const updatedUser = await employeeService.updateEmployee(payload, message);

    return reply({ success: true, data: responseUtil.toSnakeCase(updatedUser) });
  } catch (err) {
    return reply(err);
  }
};
