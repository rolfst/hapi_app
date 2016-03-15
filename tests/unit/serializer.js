import { assert } from 'chai';
import messageSerializer from 'serializers/message';
import buildRelations from 'utils/buildRelations';

const resource = {
  type: 'messages',
  id: 1,
  text: 'Text of a message.',
  createdBy: 2,
  created_at: '2016-02-29T20:14:48+0100',
  updated_at: '2016-02-29T20:14:48+0100',
  Comments: [{ id: 5 }, { id: 12 }],
};

describe('Serializers', () => {
  it('get output for single resource without relationships', () => {
    assert.deepEqual(messageSerializer(resource), {
      type: 'messages',
      id: 1,
      attributes: {
        text: 'Text of a message.',
        created_by: 2,
        created_at: '2016-02-29T20:14:48+0100',
        updated_at: '2016-02-29T20:14:48+0100',
      },
      links: {
        self: '/messages/1',
      },
    });
  });

  it('get output for single resource with relationships', () => {
    assert.deepEqual(messageSerializer(resource, {
      relations: ['comments'],
    }), {
      type: 'messages',
      id: 1,
      attributes: {
        text: 'Text of a message.',
        created_by: 2,
        created_at: '2016-02-29T20:14:48+0100',
        updated_at: '2016-02-29T20:14:48+0100',
      },
      links: {
        self: '/messages/1',
      },
      relationships: {
        comments: {
          links: {
            self: '/messages/1/relationships/comments',
            related: '/messages/1/comments',
          },
          data: [{ type: 'comments', id: 5 }, { type: 'comments', id: 12 }],
        },
      },
    });
  });

  it('builds multiple relations', () => {
    const actual = buildRelations(['user', 'comments'], {
      type: 'messages',
      id: 1,
      value: 'Foo',
      baz: 'Bar',
      User: {
        id: 5,
      },
      Comments: [{ id: 6 }, { id: 9 }],
    });

    const expected = {
      user: {
        links: {
          self: '/messages/1/relationships/user',
          related: '/messages/1/user',
        },
        data: { type: 'user', id: 5 },
      },
      comments: {
        links: {
          self: '/messages/1/relationships/comments',
          related: '/messages/1/comments',
        },
        data: [
          { type: 'comments', id: 6 },
          { type: 'comments', id: 9 },
        ],
      },
    };

    assert.deepEqual(actual, expected);
  });

  it('builds relation with single id', () => {
    const actual = buildRelations(['user'], {
      type: 'messages',
      id: 1,
      User: {
        id: 5,
      },
    });

    const expected = {
      user: {
        links: {
          self: '/messages/1/relationships/user',
          related: '/messages/1/user',
        },
        data: { type: 'user', id: 5 },
      },
    };

    assert.deepEqual(actual, expected);
  });
});
