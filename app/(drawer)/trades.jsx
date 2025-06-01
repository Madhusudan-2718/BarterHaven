import React from 'react';
import { View, StyleSheet } from 'react-native';
import TradeManager from '@/app/components/TradeManager';

export default function TradesScreen() {
  return (
    <View style={styles.container}>
      <TradeManager />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
}); 