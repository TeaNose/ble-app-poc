import {PermissionsAndroid, Platform} from 'react-native';
import {check, requestMultiple, PERMISSIONS} from 'react-native-permissions';

export const reqBluetoothPermissions = async () => {
  if (Number(Platform.Version) >= 31) {
    const permissions = [
      PERMISSIONS.ANDROID.BLUETOOTH_CONNECT,
      PERMISSIONS.ANDROID.BLUETOOTH_SCAN,
      PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
    ];

    const granted = await PermissionsAndroid.requestMultiple(permissions);
    if (
      granted[permissions[0]] === PermissionsAndroid.RESULTS.GRANTED &&
      granted[permissions[1]] === PermissionsAndroid.RESULTS.GRANTED &&
      granted[permissions[2]] === PermissionsAndroid.RESULTS.GRANTED
    ) {
      return true;
    } else {
      return false;
    }
  } else {
    const granted = await PermissionsAndroid.request(
      PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
    );
    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      return true;
    } else {
      return false;
    }
  }
};
