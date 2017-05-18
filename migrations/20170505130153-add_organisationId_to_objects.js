module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('objects', 'organisation_id', {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: 'organisations',
        key: 'id',
      },
      onDelete: 'cascade',
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('objects', 'organisation_id');
  }
};

/*
Migrations query:
  UPDATE
    objects
  SET
    organisation_id = (
      SELECT
        organisation_id
      FROM
        networks
      WHERE
        id = network_id
    )
  WHERE NOT
    network_id IS NULL;
*/
