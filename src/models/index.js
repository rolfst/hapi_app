import Sequelize from 'sequelize';
const sequelize = new Sequelize('api', 'root', '', {
  host: 'localhost',
  dialect: 'mysql',
});

const models = ['Conversation'];
const modelInstances = {};

models.map(model => {
  modelInstances[model] = require('./' + model)(sequelize);
  return model;
});

console.log(modelInstances);

export default modelInstances;
