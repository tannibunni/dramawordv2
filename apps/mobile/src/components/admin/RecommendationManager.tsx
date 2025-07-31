import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RecommendationService, RecommendationCard } from '../../services/recommendationService';
import { TMDBService } from '../../services/tmdbService';
import { colors } from '../../constants/colors';

interface RecommendationManagerProps {
  visible: boolean;
  onClose: () => void;
}

export const RecommendationManager: React.FC<RecommendationManagerProps> = ({
  visible,
  onClose,
}) => {
  const [recommendations, setRecommendations] = useState<RecommendationCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState<RecommendationCard | null>(null);
  
  // 创建表单状态
  const [createForm, setCreateForm] = useState({
    tmdbShowId: '',
    title: '',
    originalTitle: '',
    backdropUrl: '',
    posterUrl: '',
    recommendationText: '',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    category: [] as string[],
    tags: [] as string[],
    priority: '5',
    status: 'draft' as 'active' | 'inactive' | 'draft',
  });

  // 加载推荐列表
  const loadRecommendations = async () => {
    setLoading(true);
    try {
      const response = await RecommendationService.getRecommendations({
        limit: 50,
        status: 'all',
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
      setRecommendations(response.data || []);
    } catch (error) {
      console.error('加载推荐列表失败:', error);
      Alert.alert('错误', '加载推荐列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 搜索TMDB剧集
  const searchTMDBShow = async (query: string) => {
    if (!query.trim()) return;
    
    try {
      const response = await TMDBService.searchShows(query, 1, 'zh-CN');
      if (response.results.length > 0) {
        const show = response.results[0];
        setCreateForm(prev => ({
          ...prev,
          tmdbShowId: show.id.toString(),
          title: show.name,
          originalTitle: show.original_name,
          backdropUrl: show.backdrop_path ? `https://image.tmdb.org/t/p/w780${show.backdrop_path}` : '',
          posterUrl: show.poster_path ? `https://image.tmdb.org/t/p/w92${show.poster_path}` : '',
        }));
        Alert.alert('成功', `找到剧集: ${show.name}`);
      } else {
        Alert.alert('提示', '未找到相关剧集');
      }
    } catch (error) {
      console.error('搜索TMDB剧集失败:', error);
      Alert.alert('错误', '搜索TMDB剧集失败');
    }
  };

  // 创建推荐内容
  const createRecommendation = async () => {
    if (!createForm.tmdbShowId || !createForm.recommendationText) {
      Alert.alert('错误', '请填写必要信息');
      return;
    }

    try {
      const recommendationData = {
        tmdbShowId: parseInt(createForm.tmdbShowId),
        title: createForm.title,
        originalTitle: createForm.originalTitle,
        backdropUrl: createForm.backdropUrl,
        posterUrl: createForm.posterUrl,
        recommendation: {
          text: createForm.recommendationText,
          difficulty: createForm.difficulty,
          language: 'zh-CN' as const,
          category: createForm.category,
          tags: createForm.tags,
        },
        metadata: {
          genre: [],
          rating: 0,
          year: 0,
          status: createForm.status,
          priority: parseInt(createForm.priority),
          views: 0,
          likes: 0,
        },
      };

      await RecommendationService.createRecommendation(recommendationData);
      Alert.alert('成功', '推荐内容创建成功');
      setShowCreateModal(false);
      resetCreateForm();
      loadRecommendations();
    } catch (error) {
      console.error('创建推荐内容失败:', error);
      Alert.alert('错误', '创建推荐内容失败');
    }
  };

  // 更新推荐内容
  const updateRecommendation = async () => {
    if (!selectedRecommendation) return;

    try {
      const updateData = {
        recommendation: {
          text: createForm.recommendationText,
          difficulty: createForm.difficulty,
          category: createForm.category,
          tags: createForm.tags,
        },
        metadata: {
          status: createForm.status,
          priority: parseInt(createForm.priority),
        },
      };

      await RecommendationService.updateRecommendation(selectedRecommendation._id!, updateData);
      Alert.alert('成功', '推荐内容更新成功');
      setShowEditModal(false);
      setSelectedRecommendation(null);
      loadRecommendations();
    } catch (error) {
      console.error('更新推荐内容失败:', error);
      Alert.alert('错误', '更新推荐内容失败');
    }
  };

  // 删除推荐内容
  const deleteRecommendation = async (id: string) => {
    Alert.alert(
      '确认删除',
      '确定要删除这个推荐内容吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              await RecommendationService.deleteRecommendation(id);
              Alert.alert('成功', '推荐内容删除成功');
              loadRecommendations();
            } catch (error) {
              console.error('删除推荐内容失败:', error);
              Alert.alert('错误', '删除推荐内容失败');
            }
          },
        },
      ]
    );
  };

  // 重置创建表单
  const resetCreateForm = () => {
    setCreateForm({
      tmdbShowId: '',
      title: '',
      originalTitle: '',
      backdropUrl: '',
      posterUrl: '',
      recommendationText: '',
      difficulty: 'medium',
      category: [],
      tags: [],
      priority: '5',
      status: 'draft',
    });
  };

  // 打开编辑模态框
  const openEditModal = (recommendation: RecommendationCard) => {
    setSelectedRecommendation(recommendation);
    setCreateForm({
      tmdbShowId: recommendation.tmdbShowId.toString(),
      title: recommendation.title,
      originalTitle: recommendation.originalTitle,
      backdropUrl: recommendation.backdropUrl,
      posterUrl: recommendation.posterUrl,
      recommendationText: recommendation.recommendation.text,
      difficulty: recommendation.recommendation.difficulty,
      category: recommendation.recommendation.category,
      tags: recommendation.recommendation.tags,
      priority: recommendation.metadata.priority.toString(),
      status: recommendation.metadata.status,
    });
    setShowEditModal(true);
  };

  useEffect(() => {
    if (visible) {
      loadRecommendations();
    }
  }, [visible]);

  const renderRecommendationItem = ({ item }: { item: RecommendationCard }) => (
    <View style={styles.recommendationItem}>
      <View style={styles.recommendationHeader}>
        <Text style={styles.recommendationTitle}>{item.title}</Text>
        <View style={styles.recommendationActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => openEditModal(item)}
          >
            <Ionicons name="pencil" size={16} color={colors.primary[500]} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => deleteRecommendation(item._id!)}
          >
            <Ionicons name="trash" size={16} color={colors.error[500]} />
          </TouchableOpacity>
        </View>
      </View>
      
      <Text style={styles.recommendationText} numberOfLines={2}>
        {item.recommendation.text}
      </Text>
      
      <View style={styles.recommendationMeta}>
        <Text style={styles.metaText}>难度: {item.recommendation.difficulty}</Text>
        <Text style={styles.metaText}>状态: {item.metadata.status}</Text>
        <Text style={styles.metaText}>优先级: {item.metadata.priority}</Text>
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* 头部 */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>推荐内容管理</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        </View>

        {/* 操作按钮 */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addButtonText}>添加推荐</Text>
          </TouchableOpacity>
        </View>

        {/* 推荐列表 */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary[500]} />
            <Text style={styles.loadingText}>加载中...</Text>
          </View>
        ) : (
          <FlatList
            data={recommendations}
            renderItem={renderRecommendationItem}
            keyExtractor={(item) => item._id!}
            style={styles.list}
            contentContainerStyle={styles.listContent}
          />
        )}

        {/* 创建模态框 */}
        <Modal visible={showCreateModal} animationType="slide">
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>创建推荐内容</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              <Text style={styles.formLabel}>TMDB剧集ID</Text>
              <TextInput
                style={styles.textInput}
                value={createForm.tmdbShowId}
                onChangeText={(text) => setCreateForm(prev => ({ ...prev, tmdbShowId: text }))}
                placeholder="输入TMDB剧集ID"
                keyboardType="numeric"
              />
              
              <TouchableOpacity
                style={styles.searchButton}
                onPress={() => searchTMDBShow(createForm.tmdbShowId)}
              >
                <Text style={styles.searchButtonText}>搜索TMDB剧集</Text>
              </TouchableOpacity>

              <Text style={styles.formLabel}>剧集标题</Text>
              <TextInput
                style={styles.textInput}
                value={createForm.title}
                onChangeText={(text) => setCreateForm(prev => ({ ...prev, title: text }))}
                placeholder="剧集标题"
              />

              <Text style={styles.formLabel}>推荐文案</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={createForm.recommendationText}
                onChangeText={(text) => setCreateForm(prev => ({ ...prev, recommendationText: text }))}
                placeholder="输入推荐文案"
                multiline
                numberOfLines={4}
              />

              <Text style={styles.formLabel}>难度</Text>
              <View style={styles.difficultyButtons}>
                {(['easy', 'medium', 'hard'] as const).map((difficulty) => (
                  <TouchableOpacity
                    key={difficulty}
                    style={[
                      styles.difficultyButton,
                      createForm.difficulty === difficulty && styles.difficultyButtonActive
                    ]}
                    onPress={() => setCreateForm(prev => ({ ...prev, difficulty }))}
                  >
                    <Text style={[
                      styles.difficultyButtonText,
                      createForm.difficulty === difficulty && styles.difficultyButtonTextActive
                    ]}>
                      {difficulty === 'easy' ? '简单' : difficulty === 'medium' ? '中等' : '困难'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.formLabel}>优先级</Text>
              <TextInput
                style={styles.textInput}
                value={createForm.priority}
                onChangeText={(text) => setCreateForm(prev => ({ ...prev, priority: text }))}
                placeholder="1-10"
                keyboardType="numeric"
              />

              <TouchableOpacity
                style={styles.submitButton}
                onPress={createRecommendation}
              >
                <Text style={styles.submitButtonText}>创建推荐</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </Modal>

        {/* 编辑模态框 */}
        <Modal visible={showEditModal} animationType="slide">
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>编辑推荐内容</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              <Text style={styles.formLabel}>推荐文案</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={createForm.recommendationText}
                onChangeText={(text) => setCreateForm(prev => ({ ...prev, recommendationText: text }))}
                placeholder="输入推荐文案"
                multiline
                numberOfLines={4}
              />

              <Text style={styles.formLabel}>难度</Text>
              <View style={styles.difficultyButtons}>
                {(['easy', 'medium', 'hard'] as const).map((difficulty) => (
                  <TouchableOpacity
                    key={difficulty}
                    style={[
                      styles.difficultyButton,
                      createForm.difficulty === difficulty && styles.difficultyButtonActive
                    ]}
                    onPress={() => setCreateForm(prev => ({ ...prev, difficulty }))}
                  >
                    <Text style={[
                      styles.difficultyButtonText,
                      createForm.difficulty === difficulty && styles.difficultyButtonTextActive
                    ]}>
                      {difficulty === 'easy' ? '简单' : difficulty === 'medium' ? '中等' : '困难'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.formLabel}>状态</Text>
              <View style={styles.statusButtons}>
                {(['draft', 'active', 'inactive'] as const).map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.statusButton,
                      createForm.status === status && styles.statusButtonActive
                    ]}
                    onPress={() => setCreateForm(prev => ({ ...prev, status }))}
                  >
                    <Text style={[
                      styles.statusButtonText,
                      createForm.status === status && styles.statusButtonTextActive
                    ]}>
                      {status === 'draft' ? '草稿' : status === 'active' ? '激活' : '停用'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={updateRecommendation}
              >
                <Text style={styles.submitButtonText}>更新推荐</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </Modal>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
  },
  closeButton: {
    padding: 8,
  },
  actions: {
    padding: 20,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[500],
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.text.secondary,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 20,
  },
  recommendationItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
  },
  recommendationActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  recommendationText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 8,
  },
  recommendationMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  metaText: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginRight: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: 8,
    marginTop: 16,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text.primary,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  searchButton: {
    backgroundColor: colors.accent[500],
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  difficultyButtons: {
    flexDirection: 'row',
    marginTop: 8,
  },
  difficultyButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  difficultyButtonActive: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  difficultyButtonText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  difficultyButtonTextActive: {
    color: '#fff',
  },
  statusButtons: {
    flexDirection: 'row',
    marginTop: 8,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  statusButtonActive: {
    backgroundColor: colors.success[500],
    borderColor: colors.success[500],
  },
  statusButtonText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  statusButtonTextActive: {
    color: '#fff',
  },
  submitButton: {
    backgroundColor: colors.primary[500],
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 