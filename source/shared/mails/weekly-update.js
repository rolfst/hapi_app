const R = require('ramda');
const moment = require('moment');
const mailTemplateConfig = require('../configs/mail-templates');
const messageTemplate = require('./templates/message');
const colleagueTemplate = require('./templates/colleague');
const messagesPlaceholderTemplate = require('./templates/messages-placeholder');
const colleaguesPlaceholderTemplate = require('./templates/colleagues-placeholder');
const impl = require('./implementation');

module.exports = (bundle, network, newColleagues, [start, end]) => {
  const messages = R.pipe(R.map(messageTemplate.create), R.join(''))(bundle.messages);
  const colleagues = R.pipe(R.map(colleagueTemplate.create), R.join(''))(newColleagues);

  const datesString = impl.getDatesString(start, end);

  const data = {
    '-networkName-': network.name,
    '-dates-': datesString,
    '-messages-': messages.length > 0 ?
      `<div>${messages}</div>` : messagesPlaceholderTemplate.create(),
    '-colleagues-': colleagues.length > 0 ?
      `<div>${colleagues}</div>` : colleaguesPlaceholderTemplate.create(),
  };

  const sendAt = moment().seconds(0).add(1, 'minutes');
  const transformEmail = (email) => ({ email });

  const options = {
    blindReceiver: R.map(transformEmail, bundle.mailTo),
    sender: { name: network.superAdmin.fullName, email: network.superAdmin.email },
    subject: `Wekelijkse update - ${network.name}`,
    template: mailTemplateConfig.WEEKLY_UPDATE,
    send_at: sendAt.unix(),
  };

  return { data, options };
};
