import { findNetworksForIntegration } from 'common/repositories/network';
import { findAllUsers, createOrUpdateUser } from 'common/repositories/user';
import fetchPmtUsers from 'adapters/pmt/hooks/fetch-users';
import {
  pmtUserBelongsToNetwork,
  updateNetworkActivityForPmtUser,
  addPmtUserForNetwork,
} from 'adapters/pmt/queries';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const syncActions = (network, flexUser, pmtUser) => {
  return pmtUserBelongsToNetwork(pmtUser.id, network.id).then(exists => {
    if (exists) {
      // set network_user.deleted_at = pmt_user.active ? null : new Date()
      return updateNetworkActivityForPmtUser(network.id, pmtUser);
    } else {
      // add pmt_user to network_user where pmt_user.id = network_user.external_id
      // set network_user.deleted_at = pmt_user.active ? null : new Date()
      addPmtUserForNetwork(network.id, flexUser.id, pmtUser.id, pmtUser.active).then(() => {
        return updateNetworkActivityForPmtUser(network.id, pmtUser);
      });
    }
  });
};

const mapUser = pmtUser => {
  return {
    email: pmtUser.email,
    firstName: pmtUser.first_name,
    lastName: pmtUser.last_name,
    dateOfBirth: pmtUser.date_of_birth,
    phoneNum: pmtUser.cell_phone_number,
  };
};

const initialSync = () => {
  console.log('PMT Initial Sync');
  findNetworksForIntegration('PMT')
    .then(networks => {
      networks.forEach(network => {
        return Promise.all([fetchPmtUsers(network.externalId), findAllUsers()])
          .then(([pmtUsers, flexUsers]) => {
            pmtUsers.splice(0, 2).forEach(pmtUser => {
              return createOrUpdateUser({ email: pmtUser.email }, mapUser(pmtUser))
                .then(flexUser => syncActions(network, flexUser, pmtUser));
            });
          });

        // fetchPmtUsers(network.externalId).then(pmtUsers => {
        //   findAllUsers().then(flexUsers => {
        //     pmtUsers.splice(0, 2).forEach(pmtUser => {
        //       const attributes = {
        //           email: pmtUser.email,
        //           firstName: pmtUser.first_name,
        //           lastName: pmtUser.last_name,
        //           dateOfBirth: pmtUser.date_of_birth,
        //           phoneNum: pmtUser.cell_phone_number,
        //       };
        //
        //       createUser(attributes)
        //         .then(flexUser => syncActions(network, flexUser, pmtUser));
        //     });
        //   });
        // });
      });
    })
    .catch(err => console.log(err));
};

export default initialSync;
