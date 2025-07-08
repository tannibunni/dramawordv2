import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import MainLayout from './components/navigation/MainLayout';
import { ShowListProvider } from './context/ShowListContext';
import { VocabularyProvider } from './context/VocabularyContext';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ShowListProvider>
        <VocabularyProvider>
          <MainLayout />
        </VocabularyProvider>
      </ShowListProvider>
    </GestureHandlerRootView>
  );
} 