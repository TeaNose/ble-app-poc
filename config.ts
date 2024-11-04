import {logger, consoleTransport, fileAsyncTransport} from 'react-native-logs';
import RNFS from 'react-native-fs';

var LOG = logger.createLogger({
  transport: [fileAsyncTransport, consoleTransport],
  severity: 'debug',
  transportOptions: {
    colors: {
      info: 'blueBright',
      warn: 'yellowBright',
      error: 'redBright',
    },
    FS: RNFS,
    fileName: `log_{date-today}`,
  },
});

export {LOG};
