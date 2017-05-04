const { assert } = require('chai');
const notification = require('./message-created');

describe('Notification: created message', () => {
  it('should send a notification', () => {
    const actor = { fullName: 'Foo User' };
    const message = {
      children: [],
      source: { id: '1', text: 'Test notification' },
    };

    const actual = notification(actor, {}, message);

    assert.equal(actual.headings, 'Foo User');
    assert.equal(actual.text, 'Test notification');
    assert.equal(actual.data.id, '1');
    assert.equal(actual.data.type, 'message');
    assert.equal(actual.data.track_name, 'message_created');
  });

  it('should show "in" when having a parent', () => {
    const actor = { fullName: 'Foo User' };
    const parent = { name: 'Bar Team' };
    const message = {
      children: [],
      source: { id: '1', text: 'Test notification' },
    };

    const actual = notification(actor, parent, message);

    assert.equal(actual.headings, 'Foo User @ Bar Team');
    assert.equal(actual.text, 'Test notification');
    assert.equal(actual.data.id, '1');
    assert.equal(actual.data.type, 'message');
    assert.equal(actual.data.track_name, 'message_created');
  });

  it('should show the message has a poll', () => {
    const actor = { fullName: 'Foo User' };
    const parent = { name: 'Bar Team' };
    const message = {
      children: [
        { objectType: 'attachment' },
        { objectType: 'poll',
          source: {
            question: 'Poll question',
            options: ['A', 'B', 'C'],
          },
        },
      ],
      source: { id: '1', text: 'Test poll' },
    };

    const actual = notification(actor, parent, message);

    assert.equal(actual.headings, 'Foo User @ Bar Team');
    assert.equal(actual.text, 'Poll: Poll question (3 opties)');
    assert.equal(actual.data.id, '1');
    assert.equal(actual.data.type, 'message');
    assert.equal(actual.data.track_name, 'message_created');
  });

  it('should show the message has an attachment and text', () => {
    const actor = { fullName: 'Foo User' };
    const parent = { name: 'Bar Team' };
    const message = {
      children: [{ objectType: 'attachment' }],
      source: { id: '1', text: 'Test attachment' },
    };

    const actual = notification(actor, parent, message);

    assert.equal(actual.headings, 'Foo User @ Bar Team');
    assert.equal(actual.text, '(afbeelding) Test attachment');
    assert.equal(actual.data.id, '1');
    assert.equal(actual.data.type, 'message');
    assert.equal(actual.data.track_name, 'message_created');
  });

  it('should show the message has an attachment without text', () => {
    const actor = { fullName: 'Foo User' };
    const parent = { name: 'Bar Team' };
    const message = {
      children: [{ objectType: 'attachment' }],
      source: { id: '1', text: '' },
    };

    const actual = notification(actor, parent, message);

    assert.equal(actual.headings, 'Foo User @ Bar Team');
    assert.equal(actual.text, '(afbeelding) ');
    assert.equal(actual.data.id, '1');
    assert.equal(actual.data.type, 'message');
    assert.equal(actual.data.track_name, 'message_created');
  });
});
