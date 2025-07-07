import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import MainLayout from './components/navigation/MainLayout';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <MainLayout />
    </GestureHandlerRootView>
  );
} 