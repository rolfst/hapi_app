import { assert } from 'chai';
import messageSerializer from 'serializers/message';
import respondWithItem from 'utils/respondWithItem';

const resource = {
  type: 'messages',
  id: 1,
  text: 'Text of a message.',
  createdBy: 2,
  created_at: '2016-02-29T20:14:48+0100',
  updated_at: '2016-02-29T20:14:48+0100',
  Comments: [{ id: 5 }, { id: 12 }],
};

describe('Serializer: single resource', () => {
  it('get output for single resource without relationships', () => {
    const actual = respondWithItem(resource, messageSerializer);
    const expected = {
      links: {
        self: '/messages/1',
      },
      data: {
        type: 'messages',
        id: 1,
        attributes: {
          text: 'Text of a message.',
          created_by: 2,
          created_at: '2016-02-29T20:14:48+0100',
          updated_at: '2016-02-29T20:14:48+0100',
        },
      },
    };

    assert.deepEqual(actual, expected);
  });

  it('get output for single resource with relationships', () => {
    const actual = respondWithItem(resource, messageSerializer, {
      relations: ['comments'],
    });

    const expected = {
      links: {
        self: '/messages/1',
      },
      data: {
        type: 'messages',
        id: 1,
        attributes: {
          text: 'Text of a message.',
          created_by: 2,
          created_at: '2016-02-29T20:14:48+0100',
          updated_at: '2016-02-29T20:14:48+0100',
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
      },
    };

    assert.deepEqual(actual, expected);
  });
});
