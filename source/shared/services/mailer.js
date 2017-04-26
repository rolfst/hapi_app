const R = require('ramda');
const nodemailer = require('nodemailer');
const SendGridSMTP = require('smtpapi');
const { mapValues } = require('lodash');

const logger = require('./logger')('SHARED/services/mailer');

const smtpConfig = {
  host: process.env.SMTP_HOST,
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_AUTH_USER,
    pass: process.env.SMTP_AUTH_PASS,
  },
};

const transporter = nodemailer.createTransport(smtpConfig);

const flattenBulkMails = (mails) => {
  const output = mails.reduce((obj, curr) => {
    obj.email.push(curr.email);
    obj.data.push(curr.data);
    obj.options.push(curr.options);

    return obj;
  }, { email: [], data: [], options: [] });

  return output;
};

const prepare = (mail) => {
  if (Array.isArray(mail)) {
    return flattenBulkMails(mail);
  }

  return mail;
};

const mapsToSubstitutes = (subs, length) =>
  mapValues(subs, (o) => R.map(R.always(o), R.range(0, length)));

const createSMTPHeader = (mail) => {
  const header = new SendGridSMTP();

  const subLength = Array.isArray(mail.options.receiver) ? R.length(mail.options.receiver) : 1;
  header.setSubstitutions(mapsToSubstitutes(mail.data, subLength));
  header.setFilters({
    templates: {
      settings: {
        enable: 1,
        template_id: mail.options.template,
      },
    },
  });

  return header.jsonString();
};

const createMailOptions = (mail) => {
  if (!mail.options.sender) throw new Error('No sender defined in mail object.');
  if (!mail.options.receiver) throw new Error('No receiver defined in mail object.');

  return {
    subject: mail.options.subject,
    from: `"${mail.options.sender.name}" <${mail.options.sender.email}>`,
    bcc: Array.isArray(mail.options.receiver) ?
      R.pluck('email', mail.options.receiver) : mail.options.receiver.email,
    replyTo: 'help@flex-appeal.nl',
    html: '<br>',
    headers: {
      'Content-Type': 'text/html',
      'X-SMTPAPI': createSMTPHeader(mail),
    },
  };
};

const send = (payload, message = null) => {
  const mail = createMailOptions(payload);
  logger.debug('Sending email to Sendgrid', { mail: R.omit(['headers'], mail), message });

  return transporter.sendMail(mail);
};

exports.createMailOptions = createMailOptions;
exports.createSMTPHeader = createSMTPHeader;
exports.flattenBulkMails = flattenBulkMails;
exports.mapsToSubstitutes = mapsToSubstitutes;
exports.prepare = prepare;
exports.send = send;
