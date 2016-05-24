import { deleteNetwork } from 'common/repositories/network';

after(() => {
  deleteNetwork(global.network.id);
});
