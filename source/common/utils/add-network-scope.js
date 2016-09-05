import * as networkUtil from 'common/utils/network';

export default (userModel, networkId) => {
  const newUserModel = userModel;
  const selectedNetwork = networkUtil.select(userModel.Networks, networkId);

  newUserModel.functionName = networkUtil.makeFunctionName(parseInt(networkId, 10), userModel);
  newUserModel.integrationAuth = !!selectedNetwork.NetworkUser.userToken;
  newUserModel.role = selectedNetwork.NetworkUser.roleType;

  return newUserModel;
};
