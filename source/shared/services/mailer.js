import nodemailer from 'nodemailer';
import SendGridSMTP from 'smtpapi';
import { mapValues } from 'lodash';

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

export const flattenBulkMails = (mails) => {
  const output = mails.reduce((obj, curr) => {
    obj.email.push(curr.email);
    obj.data.push(curr.data);
    obj.options.push(curr.options);

    return obj;
  }, { email: [], data: [], options: [] });

  return output;
};

export const prepare = (mail) => {
  if (Array.isArray(mail)) {
    return flattenBulkMails(mail);
  }

  return mail;
};

export const mapsToSubstitutes = (subs) => mapValues(subs, o => [o]);

export const createSMTPHeader = (mail) => {
  const header = new SendGridSMTP();

  header.setSubstitutions(mapsToSubstitutes(mail.data));
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

export const createMailOptions = (mail) => {
  if (!mail.options.sender) throw new Error('No sender defined in mail object.');
  if (!mail.options.receiver) throw new Error('No receiver defined in mail object.');

  return {
    subject: mail.options.subject,
    from: `"${mail.options.sender.name}" <${mail.options.sender.email}>`,
    to: mail.options.receiver.email,
    replyTo: 'help@flex-appeal.nl',
    html: '<br>',
    headers: {
      'Content-Type': 'text/html',
      'X-SMTPAPI': createSMTPHeader(mail),
    },
  };
};

export const send = (mail) => {
  const mailOptions = createMailOptions(mail);

  return transporter.sendMail(mailOptions, (err) => {
    if (err) console.log('Error when sending mail', { err, mail_options: mailOptions });
  });
};
