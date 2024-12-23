import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  ToastAndroid,
  Alert,
  ActivityIndicator,
  Button,
  ScrollView,
} from 'react-native';
import RNFS from 'react-native-fs';
import {Buffer} from 'buffer';

import {LOG} from '../../config';
import {reqBluetoothPermissions} from './permissions';
import bleManager from './bleManager';

const serviceId = 'b7ef1193-dc2e-4362-93d3-df429eb3ad10'; //service uuid
const cmdCharacId = '00ce7a72-ec08-473d-943e-81ec27fdc600'; //write uuid
const dataCharacId = '00ce7a72-ec08-473d-943e-81ec27fdc5f2'; //read

let resciveData = [];
let waveDataT = {};
let percentage = 0;

const HomeScreen = () => {
  const [isScanning, setIsScanning] = React.useState(false);
  const [deviceList, setDeviceList] = React.useState([]);
  const [connectedDevice, setConnectedDevice] = React.useState(null);
  const [writeCharateristic, setWriteCharacteristic] = React.useState(null);
  const [readCharacteristic, setReadCharacteristic] = React.useState(null);
  const [isSubscribed, setIsSubscribed] = React.useState(false);
  const [dataResult, setDataResult] = React.useState([]);
  const [vibrationData, setVibrationData] = React.useState([]);
  const [allServices, setAllServices] = React.useState(null);
  const [allCharacteristics, setAllCharacteristics] = React.useState(null);
  const [desService, setDesService] = React.useState(null);
  const [collectedVibrationData, setCollectedVibrationData] = React.useState(
    [],
  );
  const [isFetching, setIsFetching] = React.useState(false);

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

  const handleData = data => {
    const dataBuffer = Buffer.from(data, 'base64');
    const dataArray = Array.from(dataBuffer);

    setDataResult(dataArray);
  };

  const discoverServices = async device => {
    const services = await device.discoverAllServicesAndCharacteristics();
    // setAllServices(services);
    const desiredServices = services.find(
      service => service.uuid === serviceId,
    );
    setDesService(desiredServices);

    if (desiredServices) {
      const charateristics = await desiredServices.charateristics();
      charateristics.forEach(characteristic => {
        if (characteristic.uuid === cmdCharacId) {
          setWriteCharacteristic(characteristic);
        }
        if (characteristic.uuid === dataCharacId) {
          setReadCharacteristic(characteristic);
          if (!isSubscribed) {
            setIsSubscribed(true);
            characteristic.monitor((error, data) => {
              if (error) {
                console.log('Data subscription error: ', error);
              }
              handleData(data?.value);
            });
          }
        }
      });
    }
  };

  const connect = async deviceId => {
    try {
      await bleManager
        .connectToDevice(deviceId)
        .then(async device => {
          console.log(JSON.stringify(device));
          console.log('Connected to device:', device.name);
          setConnectedDevice(device);
          // discoverServices(device);
          ToastAndroid.show('SUCCESS CONNECT DEVICE', ToastAndroid.SHORT);
          await device.discoverAllServicesAndCharacteristics();
          const serviceResponse = await device.services();
          // setAllServices(serviceResponse);
          const allServicesHelper = [];
          const allCharasHelper = [];
          for (const service of serviceResponse) {
            console.log(`Service: ${service.uuid}`);
            allServicesHelper.push(service);
            const charas = await service.characteristics();

            if (service.uuid === serviceId) {
              setDesService(service);
              for (const characteristic of charas) {
                if (characteristic.uuid === cmdCharacId) {
                  setWriteCharacteristic(characteristic);
                }
                if (characteristic.uuid === dataCharacId) {
                  setReadCharacteristic(characteristic);
                  // if (!isSubscribed) {
                  //   setIsSubscribed(true);
                  //   characteristic.monitor((error, data) => {
                  //     if (error) {
                  //       ToastAndroid.show(
                  //         'Data subscription error: ',
                  //         ToastAndroid.SHORT,
                  //       );
                  //     }
                  //     handleData(data?.value);
                  //   });
                  // }
                }
                // allCharasHelper.push(characteristic);
                // console.log(`  Characteristic: ${characteristic.uuid}`);
                // console.log(
                //   `    Properties: ${JSON.stringify(
                //     characteristic.properties,
                //   )}`,
                // );
              }
            }
          }
          // setAllCharacteristics(allCharasHelper);
          // const serviceSamples = await bleManager.discoverAllServicesAndCharacteristicsForDevice(device?.id);
          // setAllServices(serviceSamples);

          // Add your logic for handling the connected device

          // return device.discoverAllServicesAndCharacteristics();
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
        bleManager.stopDeviceScan();
        setIsScanning(false);
        // Stop scanning as it's not necessary if you are scanning for one device.
        setDeviceList(prevList => [...prevList, device]);
        // connect();

        // Proceed with connection.
      } else {
        bleManager.stopDeviceScan();
        setIsScanning(false);
      }
    });
  };

  const stopScanning = () => {
    bleManager.stopDeviceScan();
    setIsScanning(false);
  };

  const sendData = async data => {
    if (writeCharateristic) {
      const checksum = data.reduce((sum, val) => (sum + val) % 256, 0);
      const dataWithChecksum = [...data, (256 - checksum) % 256];
      setVibrationData(prevList => [...prevList, dataWithChecksum]);
      // await writeCharateristic.writeWithResponse(Buffer.from(dataWithChecksum));
    } else {
      ToastAndroid.show('No Write Characteritic Available', ToastAndroid.SHORT);
    }
  };

  const collectData = async (val, samp, nowLength, nowFreq) => {
    let data = [];
    const now = new Date();
    const formattedTime = now
      .toISOString()
      .replace(/[-T:Z]/g, '')
      .slice(0, 14);

    const startCollect = {
      systemTime: {
        Y: formattedTime.slice(0, 2),
        y: formattedTime.slice(2, 4),
        M: formattedTime.slice(5, 6),
        d: formattedTime.slice(6, 8),
        H: formattedTime.slice(8, 10),
        m: formattedTime.slice(10, 12),
        s: formattedTime.slice(12),
      },
      isIntvSample: 0,
      mdefLen: {x: nowLength, z: nowLength, y: nowLength},
      mdefFreq: {x: nowFreq, z: nowFreq, y: nowFreq},
      meaIntv: 1,
      lwLength: 128,
      lwFreq: 1000,
      lwIntv: 1,
      isSampleInd: val,
      indLength: 1,
      indFreq: 500,
      indIntv: 1,
      sampleDir: samp,
    };

    data = data.concat(Object.values(startCollect.systemTime).map(Number));

    data = data.concat([
      startCollect.mdefLen.x,
      startCollect.mdefLen.z,
      startCollect.mdefLen.y,
    ]);

    sendData(data);
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

  const collectVibData = async () => {
    setDataResult([]);
    percentage = 0;
    waveDataT = {};
    resciveData = new Array(242).fill(0);
    await collectData(0, 3, 8, 3125);
  };

  const collectTemperatureData = async () => {
    await collectData(1, 0, 0, 1000);
  };

  const stopCollectTemperatureData = async () => {
    await collectData(4, 0, 0, 1000);
  };

  const getVibrationData = async () => {
    console.log('HEHE');
    setIsFetching(true);
    try {
      // Subscribe to vibration data characteristic
      const subscription = connectedDevice?.monitorCharacteristicForService(
        serviceId,
        readCharacteristic?.uuid,
        (error, characteristic) => {
          if (error) {
            Alert.alert(
              'Error subscribing to characteristic',
              JSON.stringify(error),
            );
            console.error('Error subscribing to characteristic:', error);
            return;
          }
          setCollectedVibrationData(prevList => [...prevList, characteristic]);

          if (characteristic?.value) {
            ToastAndroid.show(
              'Succeed getting vibration data',
              ToastAndroid.SHORT,
            );
            // Decode the vibration data
            // const vibrationData = Buffer.from(characteristic.value, 'base64');
            // console.log('Vibration Data:', vibrationData);
          }
        },
      );

      // return () => subscription.remove();
      // setTimeout(() => {
      //   subscription.remove();
      //   console.log('Unsubscribed from vibration data');
      // }, 10000);
    } catch (error) {
      Alert.alert('Error getting vibration data', JSON.stringify(error));
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <ScrollView>
      <View
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
          backgroundColor: 'white',
        }}>
        <Text>{`Connected Device: ${connectedDevice?.name} - Device ID: ${connectedDevice?.id} `}</Text>
        <Text>{`Service: ${desService?.uuid}`}</Text>
        <Text>{`Write characteristic: ${writeCharateristic?.uuid}`}</Text>
        <Text>{`Read characteristic: ${readCharacteristic?.uuid}`}</Text>

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
        <Button title={'Collect Vibration Data'} onPress={getVibrationData} />
        <View style={{height: 20}} />

        <Text>{`Vibration data result: ${JSON.stringify(
          collectedVibrationData,
        )}`}</Text>
        {/* <TouchableOpacity onPress={onReadFile}>
        <Text>Read file</Text>
      </TouchableOpacity> */}
      </View>
    </ScrollView>
  );
};

export default HomeScreen;
