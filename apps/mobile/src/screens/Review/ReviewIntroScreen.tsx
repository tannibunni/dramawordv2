
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useVocabulary } from '../../context/VocabularyContext';
import { useShowList, Show } from '../../context/ShowListContext';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '../../components/navigation/NavigationContext';
import { TMDBService } from '../../services/tmdbService';

const ReviewIntroScreen = () => {
  const { vocabulary } = useVocabulary();
  const { shows } = useShowList();
  const todayCount = vocabulary?.length || 0;
  const { navigate } = useNavigation();

  // 分离剧集和单词本数据
  const showItems = shows.filter(show => show.type !== 'wordbook');
  const wordbookItems = shows.filter(show => show.type === 'wordbook');

  // 获取剧集或单词本的单词数量
  const getShowWords = (showId: number) => {
    return vocabulary.filter(word => {
      const sourceShowId = word.sourceShow?.id;
      return word.sourceShow && Number(sourceShowId) === Number(showId);
    });
  };

  // 点击"随机"卡片，切换到 review Tab（swiper 页面）
  const handlePressChallenge = (key: string) => {
    if (key === 'shuffle') {
      navigate('ReviewScreen');
    }
    // 其他挑战可在此扩展
  };

  // 点击剧集
  const handlePressShow = (item: Show) => {
    navigate('ReviewScreen', { type: 'show', id: item.id });
  };

  // 点击单词本
  const handlePressWordbook = (item: Show) => {
    navigate('ReviewScreen', { type: 'wordbook', id: item.id });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{paddingBottom: 32}}>
      {/* 顶部进度环+文案 */}
      <View style={styles.topRow}>
        <View style={styles.progressCircle}>
          <Text style={styles.progressText}>{todayCount}</Text>
        </View>
        <View style={{flex: 1, marginLeft: 18}}>
          <Text style={styles.title}>准备好挑战今天的词卡了吗？</Text>
          <Text style={styles.subtitle}>你已掌握 {todayCount} 张词卡</Text>
        </View>
      </View>

      {/* 挑战区块 */}
      <View style={styles.challengeHeaderRow}>
        <Text style={styles.challengeTitle}>挑战</Text>
        <TouchableOpacity>
          <Text style={styles.challengeViewAll}>View all</Text>
        </TouchableOpacity>
      </View>
      
      {/* 第一行：随机复习 */}
      <View style={styles.shuffleRow}>
        <TouchableOpacity style={styles.shuffleCard} activeOpacity={0.8} onPress={() => handlePressChallenge('shuffle')}>
          <View style={styles.shuffleIconWrap}>
            <Ionicons name="dice-outline" size={48} color="#7B61FF" />
          </View>
          <Text style={styles.shuffleTitle}>随机</Text>
          <Text style={styles.shuffleSubtitle}>Shuffle</Text>
        </TouchableOpacity>
      </View>

      {/* 第二行：剧集复习 */}
      {showItems.length > 0 && (
        <View style={styles.showsSection}>
          <Text style={styles.showsTitle}>剧集复习</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.showsScroll}>
            {showItems.map(item => {
              const wordCount = getShowWords(item.id).length;
              return (
                <TouchableOpacity key={item.id} style={styles.showCard} activeOpacity={0.85} onPress={() => handlePressShow(item)}>
                  <View style={styles.posterContainer}>
                    <Image
                      source={{
                        uri: item.poster_path
                          ? TMDBService.getImageUrl(item.poster_path, 'w185')
                          : 'https://via.placeholder.com/120x120/CCCCCC/FFFFFF?text=No+Image',
                      }}
                      style={styles.showPoster}
                      resizeMode="cover"
                    />
                  </View>
                  <View style={styles.showInfoBox}>
                    <Text style={styles.showName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.showWordCount}>{wordCount} 词</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* 第三行：单词本复习 */}
      {wordbookItems.length > 0 && (
        <View style={styles.wordbookSection}>
          <Text style={styles.wordbookTitle}>单词本复习</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.wordbookScroll}>
            {wordbookItems.map(item => {
              const wordCount = getShowWords(item.id).length;
              return (
                <TouchableOpacity key={item.id} style={styles.wordbookCard} activeOpacity={0.8} onPress={() => handlePressWordbook(item)}>
                  <View style={styles.wordbookIconWrap}>
                    <Ionicons 
                      name={(item.icon || 'book-outline') as any} 
                      size={32} 
                      color="#7B61FF" 
                    />
                  </View>
                  <Text style={styles.wordbookName}>{item.name}</Text>
                  <Text style={styles.wordbookWordCount}>{wordCount} 词</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 20 },
  topRow: { flexDirection: 'row', alignItems: 'center', marginTop: 32, marginBottom: 32 },
  progressCircle: { width: 80, height: 80, borderRadius: 40, borderWidth: 8, borderColor: '#7B61FF', alignItems: 'center', justifyContent: 'center' },
  progressText: { fontSize: 28, color: '#7B61FF', fontWeight: 'bold' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#222', marginBottom: 6 },
  subtitle: { fontSize: 15, color: '#666' },
  challengeHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  challengeTitle: { fontSize: 20, fontWeight: 'bold', color: '#111' },
  challengeViewAll: { fontSize: 15, color: '#888' },
  challengeScroll: { flexGrow: 0 },
  challengeCard: { width: 140, height: 160, backgroundColor: '#F8F8FF', borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  challengeIconWrap: { marginBottom: 12 },
  challengeCardTitle: { fontSize: 18, fontWeight: 'bold', color: '#3B2EFF', marginBottom: 2 },
  challengeCardSubtitle: { fontSize: 14, color: '#888' },
  // 新增样式
  shuffleRow: { marginBottom: 24 },
  shuffleCard: { 
    width: '100%', 
    height: 120, 
    backgroundColor: '#F8F8FF', 
    borderRadius: 18, 
    alignItems: 'center', 
    justifyContent: 'center',
    shadowColor: '#7B61FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  shuffleIconWrap: { marginBottom: 8 },
  shuffleTitle: { fontSize: 20, fontWeight: 'bold', color: '#3B2EFF', marginBottom: 2 },
  shuffleSubtitle: { fontSize: 14, color: '#888' },
  showsSection: { marginBottom: 20 },
  showsTitle: { fontSize: 18, fontWeight: 'bold', color: '#111', marginBottom: 12 },
  showsScroll: { flexGrow: 0 },
  showCard: { 
    width: 120, 
    height: 170, 
    borderRadius: 16, 
    marginRight: 16,
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eee',
  },
  posterContainer: {
    width: '100%',
    height: 112, // 上半部分 2/3
    backgroundColor: '#eee',
  },
  showPoster: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  showInfoBox: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  showName: { fontSize: 14, fontWeight: 'bold', color: '#222', textAlign: 'center', marginBottom: 2, width: '100%' },
  showWordCount: { fontSize: 12, color: '#666', textAlign: 'center' },
  // 单词本复习样式
  wordbookSection: { marginBottom: 20 },
  wordbookTitle: { fontSize: 18, fontWeight: 'bold', color: '#111', marginBottom: 12 },
  wordbookScroll: { flexGrow: 0 },
  wordbookCard: { 
    width: 120, 
    height: 100, 
    backgroundColor: '#F8F8FF', 
    borderRadius: 16, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  wordbookIconWrap: { marginBottom: 6 },
  wordbookName: { fontSize: 14, fontWeight: '600', color: '#222', marginBottom: 2, textAlign: 'center' },
  wordbookWordCount: { fontSize: 12, color: '#666' },
});

export default ReviewIntroScreen; 