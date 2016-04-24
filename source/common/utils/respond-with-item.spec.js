import { assert } from 'chai';
import respondWithItem from 'common/utils/respond-with-item';

const resource = {
  type: 'messages',
  id: 1,
  body: 'Text of a message.',
  user_id: 2,
  created_at: '2016-02-29T20:14:48+0100',
  updated_at: '2016-02-29T20:14:48+0100',
  User: { type: 'users', id: 5, firstName: 'John', lastName: 'Doe', fullName: 'John Doe' },
};

describe('Serializer: single resource', () => {
  it('get output for single resource without relationships', () => {
    const messageSerializer = item => {
      return {
        type: item.type,
        id: item.id.toString(),
        created_by: item.user_id.toString(),
        text: item.body,
      };
    };

    const actual = respondWithItem(resource, messageSerializer);
    const expected = {
      data: {
        type: 'messages',
        id: '1',
        created_by: '2',
        text: 'Text of a message.',
      },
    };

    assert.deepEqual(actual, expected);
  });

  it('get output for single resource with single relationships', () => {
    const userSerializer = item => {
      return {
        type: item.type,
        id: item.id.toString(),
        first_name: item.firstName,
        last_name: item.lastName,
        full_name: item.fullName,
      };
    };

    const messageSerializer = item => {
      return {
        type: item.type,
        id: item.id.toString(),
        created_by: item.user_id.toString(),
        text: item.body,
        user: userSerializer(item.User),
      };
    };

    const actual = respondWithItem(resource, messageSerializer);
    const expected = {
      data: {
        type: 'messages',
        id: '1',
        created_by: '2',
        text: 'Text of a message.',
        user: {
          type: 'users',
          id: '5',
          first_name: 'John',
          last_name: 'Doe',
          full_name: 'John Doe',
        },
      },
    };

    assert.deepEqual(actual, expected);
  });

  it('get output for single resource with single relationships', () => {
    const userSerializer = item => {
      return {
        type: item.type,
        id: item.id.toString(),
        first_name: item.firstName,
        last_name: item.lastName,
        full_name: item.fullName,
      };
    };

    const resourceToTest = {
      type: 'messages',
      id: 1,
      body: 'Text of a message.',
      user_id: 2,
      created_at: '2016-02-29T20:14:48+0100',
      updated_at: '2016-02-29T20:14:48+0100',
      Users: [
        { type: 'users', id: 5, firstName: 'John', lastName: 'Doe', fullName: 'John Doe' },
        { type: 'users', id: 19, firstName: 'Foo', lastName: 'Baz', fullName: 'Foo Baz' },
      ],
    };

    const messageSerializer = item => {
      return {
        type: item.type,
        id: item.id.toString(),
        created_by: item.user_id.toString(),
        text: item.body,
        users: item.Users.map(user => userSerializer(user)),
      };
    };

    const actual = respondWithItem(resourceToTest, messageSerializer);
    const expected = {
      data: {
        type: 'messages',
        id: '1',
        created_by: '2',
        text: 'Text of a message.',
        users: [{
          type: 'users',
          id: '5',
          first_name: 'John',
          last_name: 'Doe',
          full_name: 'John Doe',
        }, {
          type: 'users',
          id: '19',
          first_name: 'Foo',
          last_name: 'Baz',
          full_name: 'Foo Baz',
        }],
      },
    };

    assert.deepEqual(actual, expected);
  });
});
