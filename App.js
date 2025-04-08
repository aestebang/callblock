import React from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import CallBlockingScreen from './src/callblock/CallBlockingScreen';
import CallBlockerManagerScreen from './src/callblock/CallBlockerManagerScreen';

const App = () => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {/* <CallBlockingScreen /> */}
      <CallBlockerManagerScreen />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

export default App;