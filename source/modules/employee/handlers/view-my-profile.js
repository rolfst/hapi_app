const createServicePayload = require('../../../shared/utils/create-service-payload');
const responseUtil = require('../../../shared/utils/response');
const employeeService = require('../services/employee');

module.exports = async (req, reply) => {
  try {
    const { payload, message } = createServicePayload(req);
    const user = await employeeService.getEmployee(payload, message);

    return reply({ data: responseUtil.toSnakeCase(user) });
  } catch (err) {
    return reply(err);
  }
};
