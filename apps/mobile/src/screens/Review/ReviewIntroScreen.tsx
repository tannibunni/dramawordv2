
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useVocabulary } from '../../context/VocabularyContext';
import { useShowList, Show } from '../../context/ShowListContext';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '../../components/navigation/NavigationContext';
import { TMDBService } from '../../services/tmdbService';
import { colors } from '../../constants/colors';
import { useAppLanguage } from '../../context/AppLanguageContext';
import { t } from '../../constants/translations';

interface ReviewIntroScreenProps {
  navigation: any;
}

const ReviewIntroScreen: React.FC<ReviewIntroScreenProps> = ({ navigation }) => {
  const { vocabulary } = useVocabulary();
  const { shows } = useShowList();
  const todayCount = vocabulary?.length || 0;
  const { navigate } = useNavigation();
  const { appLanguage } = useAppLanguage();

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

  const showsCount = showItems.reduce((sum, show) => sum + getShowWords(show.id).length, 0);
  const wordbookCount = wordbookItems.reduce((sum, show) => sum + getShowWords(show.id).length, 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* 顶部进度环+文案 */}
        <View style={styles.topRow}>
          <View style={styles.progressCircle}>
            <Text style={styles.progressText}>{todayCount}</Text>
          </View>
          <View style={{flex: 1, marginLeft: 18}}>
            <Text style={styles.title}>{t('ready_to_challenge', appLanguage)}</Text>
            <Text style={styles.subtitle}>{t('mastered_cards', appLanguage, { count: todayCount })}</Text>
          </View>
        </View>

        {/* 挑战区块 */}
        <View style={styles.challengeSection}>
          <View style={styles.challengeHeader}>
            <Text style={styles.challengeTitle}>{t('challenge', appLanguage)}</Text>
            <TouchableOpacity>
              <Text style={styles.challengeViewAll}>{t('view_all', appLanguage)}</Text>
            </TouchableOpacity>
          </View>

          {/* 第一行：随机复习 */}
          <View style={styles.shuffleRow}>
            <TouchableOpacity style={styles.shuffleCard} activeOpacity={0.8} onPress={() => handlePressChallenge('shuffle')}>
              <View style={styles.shuffleIconWrap}>
                <Ionicons name="shuffle" size={32} color={colors.primary[500]} />
              </View>
              <Text style={styles.shuffleTitle}>{t('random', appLanguage)}</Text>
              <Text style={styles.shuffleSubtitle}>{t('shuffle', appLanguage)}</Text>
            </TouchableOpacity>
          </View>

          {/* 第二行：剧集复习 */}
          {showItems.length > 0 && (
            <View style={styles.showsRow}>
              <TouchableOpacity style={styles.showsCard} activeOpacity={0.8} onPress={() => handlePressChallenge('shows')}>
                <View style={styles.showsIconWrap}>
                  <Ionicons name="tv-outline" size={32} color={colors.primary[500]} />
                </View>
                <Text style={styles.showsTitle}>{t('series_review', appLanguage)}</Text>
                <Text style={styles.showsSubtitle}>{t('words_count', appLanguage, { count: showsCount })}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* 第三行：单词本复习 */}
          {wordbookItems.length > 0 && (
            <View style={styles.wordbookRow}>
              <TouchableOpacity style={styles.wordbookCard} activeOpacity={0.8} onPress={() => handlePressChallenge('wordbook')}>
                <View style={styles.wordbookIconWrap}>
                  <Ionicons name="book-outline" size={32} color={colors.primary[500]} />
                </View>
                                 <Text style={styles.showsTitle}>{t('wordbook_review', appLanguage)}</Text>
                <Text style={styles.wordbookSubtitle}>{t('words_count', appLanguage, { count: wordbookCount })}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.background.primary, 
    paddingHorizontal: 20 
  },
  content: {
    flex: 1,
  },
  header: {
    marginTop: 32,
    marginBottom: 32,
  },
  topRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 32, 
    marginBottom: 32 
  },
  progressCircle: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    borderWidth: 8, 
    borderColor: colors.primary[500], 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  progressText: { 
    fontSize: 28, 
    color: colors.primary[500], 
    fontWeight: 'bold' 
  },
  title: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: colors.text.primary, 
    marginBottom: 6 
  },
  subtitle: { 
    fontSize: 15, 
    color: colors.text.secondary 
  },
  challengeSection: {
    marginBottom: 20,
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  challengeTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: colors.text.primary 
  },
  challengeViewAll: { 
    fontSize: 15, 
    color: colors.text.tertiary 
  },
  challengeScroll: { 
    flexGrow: 0 
  },
  challengeCard: { 
    width: 140, 
    height: 160, 
    backgroundColor: colors.primary[50], 
    borderRadius: 18, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginRight: 16 
  },
  challengeIconWrap: { 
    marginBottom: 12 
  },
  challengeCardTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: colors.primary[500], 
    marginBottom: 2 
  },
  challengeCardSubtitle: { 
    fontSize: 14, 
    color: colors.text.tertiary 
  },
  // 新增样式
  shuffleRow: { 
    marginBottom: 24 
  },
  shuffleCard: { 
    width: '100%', 
    height: 120, 
    backgroundColor: colors.primary[50], 
    borderRadius: 18, 
    alignItems: 'center', 
    justifyContent: 'center',
    shadowColor: colors.primary[200],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  shuffleIconWrap: { 
    marginBottom: 8 
  },
  shuffleTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: colors.primary[500], 
    marginBottom: 2 
  },
  shuffleSubtitle: { 
    fontSize: 14, 
    color: colors.text.tertiary 
  },
  showsSection: { 
    marginBottom: 20 
  },
  showsRow: {
    marginBottom: 24,
  },
  showsCard: {
    width: '100%',
    height: 120,
    backgroundColor: colors.primary[50],
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary[200],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  showsIconWrap: {
    marginBottom: 8,
  },
  showsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 2,
  },
  showsSubtitle: {
    fontSize: 14,
    color: colors.text.tertiary,
  },
  showsScroll: { 
    flexGrow: 0 
  },
  showCard: { 
    width: 120, 
    height: 170, 
    borderRadius: 16, 
    marginRight: 16,
    overflow: 'hidden',
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
    shadowColor: colors.primary[200],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  posterContainer: {
    width: '100%',
    height: 112, // 上半部分 2/3
    backgroundColor: colors.background.tertiary,
  },
  showPoster: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  showInfoBox: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  showName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 2,
  },
  showWordCount: {
    fontSize: 10,
    color: colors.text.tertiary,
  },
  wordbookSection: {
    marginBottom: 20,
  },
  wordbookRow: {
    marginBottom: 24,
  },
  wordbookCard: {
    width: '100%',
    height: 120,
    backgroundColor: colors.primary[50],
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary[200],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  wordbookIconWrap: {
    marginBottom: 8,
  },
  wordbookName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 2,
  },
  wordbookWordCount: {
    fontSize: 10,
    color: colors.text.tertiary,
  },
  wordbookSubtitle: {
    fontSize: 14,
    color: colors.text.tertiary,
  },
});

export default ReviewIntroScreen; 