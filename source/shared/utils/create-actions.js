import exchangeActions from 'modules/flexchange/authorization/exchange';
import conversationActions from 'modules/chat/authorization/conversation';

export default () => {
  return {
    ...exchangeActions,
    ...conversationActions,
  };
};
