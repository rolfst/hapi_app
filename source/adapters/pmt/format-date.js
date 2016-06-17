import moment from 'moment';

export default date => moment(date, 'DD-MM-YYYY HH:mm:ss').format('YYYY-MM-DDTHH:mm:ssZZ');
