import makeFunctionName from 'common/utils/make-function-name';
import selectNetwork from 'common/utils/select-network';

export default (userModel, networkId) => {
  const newUserModel = userModel;
  const selectedNetwork = selectNetwork(userModel.Networks, networkId);

  newUserModel.functionName = makeFunctionName(parseInt(networkId, 10), userModel);
  newUserModel.integrationAuth = !!selectedNetwork.NetworkUser.userToken;

  return newUserModel;
};
