/* eslint-disable */
const R = require('ramda')
const moment = require('moment')

const create = (message) => {
  const { likesCount, commentsCount } = message.source;

  const highfives = likesCount === 1 ? '1 highfive' : `${likesCount || 0} highfives`;
  const comments = commentsCount === 1 ? '1 reactie' : `${commentsCount || 0} reacties`;

  const attachment = R.head(R.filter(R.propEq('objectType', 'attachment'), message.children));
  const image = attachment ? `<div style="text-align: center; margin-top: ${message.source.text ? 25 : 0}px;">
    <a href="${attachment.source.path}">
      <img style="max-height: 400px; max-width: 100%" src="${attachment.source.path}" />
    </a>
  </div>` : '';

  return (`
    <div style="width: 600px; margin: auto; background-color: #FFFFFF; border-bottom: 2px solid #EEEEEE;">
      <table border="0" cellpadding="0" cellspacing="0" align="center" width="100%" role="module" data-type="columns" style="padding: 20px 30px">
        <tr>
          <td width="70px">
            <img src="${message.user.profileImg}" style="width: 55px; height: 55px; border-radius: 50%; display: block;" />
          </td>
          <td>
            <div>${message.user.fullName} <span style="color: #888;">in ${message.parent.name}</span></div>
            <div><small style="color: #888;">${moment(message.createdAt).format('D MMMM, HH:mm')}</small></div>
          </td>
        </tr>
        <tr><td colspan="2" style="height: 25px" /></tr>
        <tr>
          <td colspan="2"><div style="font-size: 24px; font-weight: 300">
            ${message.source.text || ''}
          </div></td>
        </tr>
        <tr>
          <td colspan="2">${image}</td>
        </tr>
        <tr><td colspan="2" style="height: 25px" /></tr>
        <tr>
          <td colspan="2">
            <span>${highfives}</span>
            <span style="margin-left: 15px">${comments}</span>
          </td>
        </tr>
      </table>
    </div>
  `);
}

exports.create = create;
