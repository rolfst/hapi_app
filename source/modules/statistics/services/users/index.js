import * as networkService from '../../../core/services/network';

export async function getTotalUserCount(payload, message) {
  return networkService.getTotalUserCount(payload, message);
}
