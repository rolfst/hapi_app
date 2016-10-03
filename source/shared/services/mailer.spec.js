import { assert } from 'chai';
import _ from 'lodash';
import mailFixture from 'shared/test-utils/stubs/mail';
import * as mailer from 'shared/services/mailer';

describe('Mailer', () => {
  const users = [{
    firstName: 'John',
    lastName: 'Doe',
    email: 'johndoe@example.com',
  }, {
    firstName: 'Guido',
    lastName: 'Swag',
    email: 'guido@example.com',
  }];

  it('should prepare the mail object', () => {
    const fixture = mailFixture(users[0]);
    const actual = mailer.prepare(fixture);
    const expected = fixture;

    assert.deepEqual(actual, expected);
  });

  it('should flatten when there is a bulk mail', () => {
    const mails = users.map(u => mailFixture(u));
    const actual = mailer.prepare(mails);
    const expected = {
      email: ['johndoe@example.com', 'guido@example.com'],
      data: [{
        firstName: 'John',
        lastName: 'Doe',
      }, {
        firstName: 'Guido',
        lastName: 'Swag',
      }],
      options: [{
        subject: 'My cool subject',
        template: '123',
      }, {
        subject: 'My cool subject',
        template: '123',
      }],
    };

    assert.deepEqual(actual, expected);
  });

  it('mapsToSubstitutes', () => {
    const fakeSubs = {
      foo: 'test',
      baz: 'swag',
    };

    const actual = mailer.mapsToSubstitutes(fakeSubs);
    const expected = {
      foo: ['test'],
      baz: ['swag'],
    };

    assert.deepEqual(actual, expected);
  });

  describe('createMailOptions', () => {
    const fakeMail = {
      data: {
        foo: 'test',
        baz: 'swag',
      },
      options: {
        receiver: { email: 'receiver@example.com' },
        sender: { name: 'Foo Sender', email: 'sender@example.com' },
        subject: 'My Cool Subject!',
        template: 'template_id',
      },
    };

    it('should create the correct mail options from a mail object', () => {
      const actual = mailer.createMailOptions(fakeMail);
      const expected = {
        subject: fakeMail.options.subject,
        from: `"${fakeMail.options.sender.name}" <${fakeMail.options.sender.email}>`,
        to: fakeMail.options.receiver.email,
        replyTo: 'help@flex-appeal.nl',
        html: '<br>',
      };

      assert.deepEqual(_.omit(actual, 'headers'), expected);
    });

    it('should fail when the receiver is not defined on mail object', () => {
      const input = _.update(_.cloneDeep(fakeMail), 'options.receiver', () => null);
      const actual = () => mailer.createMailOptions(input);

      assert.throws(actual);
    });

    it('should fail when the sender is not defined on mail object', () => {
      const input = _.update(_.cloneDeep(fakeMail), 'options.sender', () => null);
      const actual = () => mailer.createMailOptions(input);

      assert.throws(actual);
    });
  });
});