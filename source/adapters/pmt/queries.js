import sequelize from 'sequelize';
import db from 'connection';

export function pmtUserBelongsToNetwork(userId, networkId) {
  const queryString = `
    SELECT user_id
    FROM network_user
    WHERE external_id = ?
    AND network_id = ?
    LIMIT 1`;

  return db.query(queryString, {
    type: sequelize.QueryTypes.SELECT,
    replacements: [userId, networkId],
  }).then(results => results.length === 1);
}

export function updateNetworkActivityForPmtUser(networkId, pmtUser) {
  // const deletedAt = pmtUser.active ? null : moment().toISOString();
  // console.log(deletedAt, pmtUser);
  const queryString = `
    UPDATE network_user
    SET deleted_at = ?
    WHERE external_id = ?
    AND network_id = ?
  `;

  return db.query(queryString, {
    type: sequelize.QueryTypes.UPDATE,
    replacements: [null, pmtUser.id, networkId],
  });
}

export function addPmtUserForNetwork(networkId, userId, externalId) {
  // const deletedAt = active ? null : new Date();
  const queryString = `
    INSERT INTO network_user (network_id, user_id, external_id, deleted_at)
    VALUES (?, ?, ?, ?)
  `;

  return db.query(queryString, {
    type: sequelize.QueryTypes.INSERT,
    replacements: [networkId, userId, externalId, null],
  });
}
