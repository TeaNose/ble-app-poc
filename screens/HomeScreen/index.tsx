import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  ToastAndroid,
  Alert,
  ActivityIndicator,
  Button,
} from 'react-native';
import RNFS from 'react-native-fs';
import {LOG} from '../../config';
import {reqBluetoothPermissions} from './permissions';
import bleManager from './bleManager';

const HomeScreen = () => {
  const [isScanning, setIsScanning] = React.useState(false);
  const [deviceList, setDeviceList] = React.useState([]);
  const [connectedDevice, setConnectedDevice] = React.useState(null);

  const onClick = () => {
    LOG.info('Test hehe anjir');
  };

  const getFileContent = async path => {
    const reader = await RNFS.readDir(path);
    console.log(reader);
  };

  const onReadFile = () => {
    RNFS.readDir(RNFS.MainBundlePath) // On Android, use "RNFS.DocumentDirectoryPath" (MainBundlePath is not defined)
      .then(result => {
        console.log('GOT RESULT', result);

        // stat the first file
        return Promise.all([RNFS.stat(result[0].path), result[0].path]);
      })
      .then(statResult => {
        console.log('statResult: ', statResult);
        if (statResult[0].isFile()) {
          // if we have a file, read it
          return RNFS.readFile(statResult[1], 'utf8');
        }

        return 'no file';
      })
      .then(contents => {
        // log the file contents
        console.log(contents);
      })
      .catch(err => {
        console.log(err.message, err.code);
      });
  };

  const connect = async deviceId => {
    try {
      await bleManager
        .connectToDevice(deviceId)
        .then(device => {
          console.log('Connected to device:', device.name);
          setConnectedDevice(device);
          ToastAndroid.show('SUCCESS CONNECT DEVICE', ToastAndroid.SHORT);

          // Add your logic for handling the connected device

          return device.discoverAllServicesAndCharacteristics();
        })
        .catch(error => {
          ToastAndroid.show('ERROR CONNECT DEVICE', ToastAndroid.SHORT);
          // Handle errors
        });
    } catch (error) {
      console.error('Error connecting to device:', error);
    }
  };

  const startScanning = async () => {
    setIsScanning(true);
    bleManager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        setIsScanning(false);
        // Handle error (scanning will be stopped automatically)
        return;
      }

      // Check if it is a device, you are looking for based on advertisement data
      // or other criteria.
      if (device?.name) {
        // Stop scanning as it's not necessary if you are scanning for one device.
        setDeviceList(prevList => [...prevList, device]);
        // connect();
        setIsScanning(false);
        bleManager.stopDeviceScan();

        // Proceed with connection.
      } else {
        setIsScanning(false);
      }
    });
  };

  const stopScanning = () => {
    bleManager.stopDeviceScan();
    setIsScanning(false);
  };

  React.useEffect(() => {
    // getFileContent(RNFS.DocumentDirectoryPath); //run the function on the first render.
    const initialize = async () => {
      const hasPermissions = await reqBluetoothPermissions();
      if (hasPermissions) {
        console.log('Bluetooth permission granted');
        // ToastAndroid.show('Bluetooth permission granted', ToastAndroid.SHORT);
      } else {
        console.log('Bluetooth permission denied');
        // ToastAndroid.show('Bluetooth permission denied', ToastAndroid.SHORT);
      }
    };

    initialize();
  }, []);

  return (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        backgroundColor: 'white',
      }}>
      <Text>{`Connected Device: ${connectedDevice?.name}`}</Text>
      <View style={{height: 20, backgroundColor: 'white'}} />
      <Button title="Start Scan" onPress={startScanning} />
      <View style={{height: 20}} />
      <Button title="Stop Scan" onPress={stopScanning} />
      {isScanning && <ActivityIndicator />}
      <View style={{height: 20}} />
      {deviceList?.map(deviceItem => (
        <TouchableOpacity onPress={() => connect(deviceItem?.id)}>
          <Text>{JSON.stringify(deviceItem?.name)}</Text>
        </TouchableOpacity>
      ))}
      {/* <TouchableOpacity onPress={onReadFile}>
        <Text>Read file</Text>
      </TouchableOpacity> */}
    </View>
  );
};

export default HomeScreen;
