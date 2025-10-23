import React from 'react';
import { View } from 'react-native';
import WordCard from '../../cards/WordCard';

interface SearchResultSectionProps {
  searchResult: any;
  onIgnore: () => void;
  onCollect: () => void;
  onPlayAudio: (word: string) => void;
}

const SearchResultSection: React.FC<SearchResultSectionProps> = ({
  searchResult,
  onIgnore,
  onCollect,
  onPlayAudio,
}) => {
  return (
    <View style={styles.wordCardWrapper}>
      <WordCard
        wordData={searchResult}
        onIgnore={onIgnore}
        onCollect={onCollect}
        onPlayAudio={onPlayAudio}
      />
    </View>
  );
};

const styles = {
  wordCardWrapper: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingHorizontal: 0,
    paddingBottom: 24,
  },
};

export default SearchResultSection;
