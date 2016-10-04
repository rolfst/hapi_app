import exchangeActions from '../../modules/flexchange/authorization/exchange';
import conversationActions from '../../modules/chat/authorization/conversation';
// TODO these shared actions know about detailed modules this should be refactored

export default () => {
  return {
    ...exchangeActions,
    ...conversationActions,
  };
};
