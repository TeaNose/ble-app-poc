import React from 'react';
import {View, TouchableOpacity, Text} from 'react-native';
import RNFS from 'react-native-fs';
import {LOG} from '../../config';

const HomeScreen = () => {
  const onClick = () => {
    LOG.info('Test');
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

  React.useEffect(() => {
    getFileContent(RNFS.DocumentDirectoryPath); //run the function on the first render.
  }, []);

  return (
    <View style={{alignItems: 'center', justifyContent: 'center'}}>
      <TouchableOpacity onPress={onClick}>
        <Text>Click me to create log</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onReadFile}>
        <Text>Read file</Text>
      </TouchableOpacity>
    </View>
  );
};

export default HomeScreen;
