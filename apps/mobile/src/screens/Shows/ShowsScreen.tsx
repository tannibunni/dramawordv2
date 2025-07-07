import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface Show {
  id: string;
  title: string;
  originalTitle: string;
  overview: string;
  posterPath: string;
  releaseDate: string;
  rating: number;
  genre: string;
  status: 'watching' | 'completed' | 'plan_to_watch';
  wordCount: number;
  lastWatched: string;
}

const ShowsScreen: React.FC = () => {
  const [shows, setShows] = useState<Show[]>([]);
  const [filteredShows, setFilteredShows] = useState<Show[]>([]);
  const [searchText, setSearchText] = useState('');
  const [selectedShow, setSelectedShow] = useState<Show | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'watching' | 'completed' | 'plan_to_watch'>('all');

  useEffect(() => {
    loadShows();
  }, []);

  useEffect(() => {
    filterShows();
  }, [shows, searchText, filter]);

  const loadShows = () => {
    // 模拟API调用
    setTimeout(() => {
      const mockShows: Show[] = [
        {
          id: '1',
          title: '老友记',
          originalTitle: 'Friends',
          overview: '六个好朋友在纽约的生活故事，充满了友情、爱情和幽默。',
          posterPath: 'https://via.placeholder.com/150x225/4F6DFF/FFFFFF?text=Friends',
          releaseDate: '1994-09-22',
          rating: 9.0,
          genre: '喜剧',
          status: 'watching',
          wordCount: 1250,
          lastWatched: '2024-01-15',
        },
        {
          id: '2',
          title: '绝命毒师',
          originalTitle: 'Breaking Bad',
          overview: '一个高中化学老师为了家庭而走上制毒道路的黑暗故事。',
          posterPath: 'https://via.placeholder.com/150x225/6BCF7A/FFFFFF?text=BB',
          releaseDate: '2008-01-20',
          rating: 9.5,
          genre: '犯罪/剧情',
          status: 'completed',
          wordCount: 890,
          lastWatched: '2024-01-10',
        },
        {
          id: '3',
          title: '办公室',
          originalTitle: 'The Office',
          overview: '一个虚构的纸业公司办公室里的日常工作和生活。',
          posterPath: 'https://via.placeholder.com/150x225/F4B942/FFFFFF?text=Office',
          releaseDate: '2005-03-24',
          rating: 8.9,
          genre: '喜剧',
          status: 'watching',
          wordCount: 567,
          lastWatched: '2024-01-14',
        },
        {
          id: '4',
          title: '权力的游戏',
          originalTitle: 'Game of Thrones',
          overview: '七个王国争夺铁王座的史诗级奇幻剧。',
          posterPath: 'https://via.placeholder.com/150x225/F76C6C/FFFFFF?text=GoT',
          releaseDate: '2011-04-17',
          rating: 9.3,
          genre: '奇幻/剧情',
          status: 'plan_to_watch',
          wordCount: 0,
          lastWatched: '',
        },
        {
          id: '5',
          title: '纸牌屋',
          originalTitle: 'House of Cards',
          overview: '一个政治家的权力斗争和阴谋故事。',
          posterPath: 'https://via.placeholder.com/150x225/888888/FFFFFF?text=HoC',
          releaseDate: '2013-02-01',
          rating: 8.7,
          genre: '政治/剧情',
          status: 'completed',
          wordCount: 432,
          lastWatched: '2024-01-08',
        },
      ];
      setShows(mockShows);
    }, 1000);
  };

  const filterShows = () => {
    let filtered = shows;

    // 按状态过滤
    if (filter !== 'all') {
      filtered = filtered.filter(show => show.status === filter);
    }

    // 按搜索文本过滤
    if (searchText) {
      filtered = filtered.filter(show =>
        show.title.toLowerCase().includes(searchText.toLowerCase()) ||
        show.originalTitle.toLowerCase().includes(searchText.toLowerCase()) ||
        show.genre.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    setFilteredShows(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'watching': return '#4F6DFF';
      case 'completed': return '#6BCF7A';
      case 'plan_to_watch': return '#F4B942';
      default: return '#888888';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'watching': return '观看中';
      case 'completed': return '已完成';
      case 'plan_to_watch': return '计划观看';
      default: return '未知';
    }
  };

  const changeShowStatus = (showId: string, newStatus: Show['status']) => {
    setShows(prevShows =>
      prevShows.map(show =>
        show.id === showId ? { ...show, status: newStatus } : show
      )
    );
  };

  const openShowDetail = (show: Show) => {
    setSelectedShow(show);
    setShowDetailModal(true);
  };

  const renderShowItem = ({ item }: { item: Show }) => (
    <TouchableOpacity
      style={styles.showItem}
      onPress={() => openShowDetail(item)}
    >
      <Image source={{ uri: item.posterPath }} style={styles.poster} />
      
      <View style={styles.showInfo}>
        <View style={styles.showHeader}>
          <Text style={styles.showTitle}>{item.title}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
        </View>
        
        <Text style={styles.originalTitle}>{item.originalTitle}</Text>
        <Text style={styles.genreText}>{item.genre}</Text>
        
        <View style={styles.showMeta}>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color="#F4B942" />
            <Text style={styles.ratingText}>{item.rating}</Text>
          </View>
          <Text style={styles.wordCountText}>{item.wordCount} 个单词</Text>
        </View>
        
        {item.lastWatched && (
          <Text style={styles.lastWatchedText}>最后观看: {item.lastWatched}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderFilterButton = (filterType: Show['status'] | 'all', label: string) => (
    <TouchableOpacity
      style={[styles.filterButton, filter === filterType && styles.filterButtonActive]}
      onPress={() => setFilter(filterType)}
    >
      <Text style={[styles.filterButtonText, filter === filterType && styles.filterButtonTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* 搜索栏 */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#888888" />
          <TextInput
            style={styles.searchInput}
            placeholder="搜索剧集..."
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
      </View>

      {/* 过滤器 */}
      <View style={styles.filterContainer}>
        {renderFilterButton('all', '全部')}
        {renderFilterButton('watching', '观看中')}
        {renderFilterButton('completed', '已完成')}
        {renderFilterButton('plan_to_watch', '计划')}
      </View>

      {/* 统计信息 */}
      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          共 {filteredShows.length} 部剧集
          {filter === 'all' && ` (观看中 ${shows.filter(s => s.status === 'watching').length} 部)`}
        </Text>
      </View>

      {/* 剧集列表 */}
      <FlatList
        data={filteredShows}
        renderItem={renderShowItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />

      {/* 剧集详情模态框 */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        {selectedShow && (
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowDetailModal(false)}
              >
                <Ionicons name="close" size={24} color="#2D2D2D" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>剧集详情</Text>
              <View style={styles.placeholder} />
            </View>

            <View style={styles.modalContent}>
              <Image source={{ uri: selectedShow.posterPath }} style={styles.modalPoster} />
              
              <Text style={styles.modalShowTitle}>{selectedShow.title}</Text>
              <Text style={styles.modalOriginalTitle}>{selectedShow.originalTitle}</Text>
              
              <View style={styles.modalMeta}>
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={20} color="#F4B942" />
                  <Text style={styles.modalRatingText}>{selectedShow.rating}</Text>
                </View>
                <Text style={styles.modalGenreText}>{selectedShow.genre}</Text>
                <Text style={styles.modalDateText}>{selectedShow.releaseDate}</Text>
              </View>

              <Text style={styles.modalOverview}>{selectedShow.overview}</Text>

              <View style={styles.modalStats}>
                <View style={styles.modalStatItem}>
                  <Text style={styles.modalStatLabel}>观看状态</Text>
                  <Text style={styles.modalStatValue}>
                    {getStatusText(selectedShow.status)}
                  </Text>
                </View>
                <View style={styles.modalStatItem}>
                  <Text style={styles.modalStatLabel}>学习单词</Text>
                  <Text style={styles.modalStatValue}>{selectedShow.wordCount} 个</Text>
                </View>
                {selectedShow.lastWatched && (
                  <View style={styles.modalStatItem}>
                    <Text style={styles.modalStatLabel}>最后观看</Text>
                    <Text style={styles.modalStatValue}>{selectedShow.lastWatched}</Text>
                  </View>
                )}
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalActionButton, { backgroundColor: '#4F6DFF' }]}
                  onPress={() => {
                    console.log('开始学习');
                    setShowDetailModal(false);
                  }}
                >
                  <Ionicons name="play" size={20} color="white" />
                  <Text style={styles.modalActionText}>开始学习</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalActionButton, { backgroundColor: '#F76C6C' }]}
                  onPress={() => {
                    console.log('删除剧集');
                    setShowDetailModal(false);
                  }}
                >
                  <Ionicons name="trash" size={20} color="white" />
                  <Text style={styles.modalActionText}>删除</Text>
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        )}
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9FB',
  },
  searchContainer: {
    padding: 20,
    paddingBottom: 10,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#2D2D2D',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    marginRight: 12,
  },
  filterButtonActive: {
    backgroundColor: '#4F6DFF',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#888888',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: 'white',
  },
  statsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  statsText: {
    fontSize: 14,
    color: '#888888',
  },
  listContainer: {
    padding: 20,
    paddingTop: 0,
  },
  showItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  poster: {
    width: 60,
    height: 90,
    borderRadius: 8,
    marginRight: 16,
  },
  showInfo: {
    flex: 1,
  },
  showHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  showTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D2D2D',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },
  originalTitle: {
    fontSize: 14,
    color: '#888888',
    marginBottom: 4,
  },
  genreText: {
    fontSize: 12,
    color: '#4F6DFF',
    marginBottom: 8,
  },
  showMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D2D2D',
    marginLeft: 4,
  },
  wordCountText: {
    fontSize: 12,
    color: '#888888',
  },
  lastWatchedText: {
    fontSize: 12,
    color: '#888888',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9F9FB',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: 'white',
  },
  closeButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D2D2D',
  },
  placeholder: {
    width: 32,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalPoster: {
    width: 120,
    height: 180,
    borderRadius: 12,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalShowTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D2D2D',
    textAlign: 'center',
    marginBottom: 4,
  },
  modalOriginalTitle: {
    fontSize: 16,
    color: '#888888',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalMeta: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalRatingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D2D2D',
    marginLeft: 4,
  },
  modalGenreText: {
    fontSize: 14,
    color: '#4F6DFF',
    marginHorizontal: 12,
  },
  modalDateText: {
    fontSize: 14,
    color: '#888888',
  },
  modalOverview: {
    fontSize: 16,
    color: '#2D2D2D',
    lineHeight: 24,
    marginBottom: 24,
    textAlign: 'center',
  },
  modalStats: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  modalStatItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  modalStatLabel: {
    fontSize: 14,
    color: '#888888',
  },
  modalStatValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D2D2D',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    marginHorizontal: 6,
  },
  modalActionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default ShowsScreen; 