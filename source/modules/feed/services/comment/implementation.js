import * as messageService from '../message';

export const assertThatMessageExists = (messageId) => {
  return messageService.get({ messageId });
};
