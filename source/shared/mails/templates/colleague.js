/* eslint-disable */
const R = require('ramda')
const impl = require('../implementation')

const create = (user) => {
  const teams = impl.getNamesString(user.teams, R.prop('name'));

  const succesInText = teams.length > 0 ?
    `<div><small style="color: #888">Veel succes in ${teams}</small></div>` : '';

  return (`
    <div style="width: 600px; margin: auto; background-color: #FFFFFF; border-bottom: 2px solid #EEEEEE;">
      <table border="0" cellpadding="0" cellspacing="0" align="center" width="100%" role="module" data-type="columns" style="padding: 20px 30px">
        <tr>
          <td width="100px">
            <img src="${user.profileImg}" style="width: 80px; height: 80px; border-radius: 40px; display: block;" />
          </td>
          <td>
            <div style="font-size: 24px; font-weight: 300">Welkom ${user.fullName}</div>
            ${succesInText}
          </td>
        </tr>
      </table>
    </div>
  `);
};

exports.create = create;
