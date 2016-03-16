import { assert } from 'chai';
import buildRelations from 'utils/buildRelations';

describe('Serializer: relations', () => {
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
