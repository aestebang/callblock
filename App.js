import React from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';

import CallBlockerManagerScreen from './src/callblock/CallBlockerManagerScreen';

const App = () => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
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