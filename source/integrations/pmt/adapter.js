import initialSync from 'integrations/pmt/initial-sync';

const pmtAdapter = credentials => {
  return {
    initialSync,
    addShift: () => console.log('Add shift to PMT with credentials ' + credentials)
  };
};

export default pmtAdapter;
