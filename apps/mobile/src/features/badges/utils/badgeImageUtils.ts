// 徽章图片工具函数

// 获取徽章图片源
export const getBadgeImageSource = (badgeId: string) => {
  // 使用绝对路径来避免相对路径问题
  const imageMap: { [key: string]: any } = {
    'collector_10': require('../../../../assets/images/collector_10.png'),
    'collector_50': require('../../../../assets/images/collector_50.png'),
    'collector_100': require('../../../../assets/images/collector_100.png'),
    'reviewer_10': require('../../../../assets/images/reviewer_10.png'),
    'streak_7': require('../../../../assets/images/streak_7.png'),
    'streak_30': require('../../../../assets/images/streak_30.png'),
    'contributor_5': require('../../../../assets/images/contributor_5.png'),
    'showlist_3': require('../../../../assets/images/showlist_3.png'),
  };
  
  return imageMap[badgeId] || imageMap['collector_10'];
};

// 检查徽章图片是否存在
export const hasBadgeImage = (badgeId: string): boolean => {
  const imageMap: { [key: string]: boolean } = {
    'collector_10': true,
    'collector_50': true,
    'collector_100': true,
    'reviewer_10': true,
    'streak_7': true,
    'streak_30': true,
    'contributor_5': true,
    'showlist_3': true,
  };
  
  return imageMap[badgeId] || false;
};

// 获取徽章图片路径（用于调试）
export const getBadgeImagePath = (badgeId: string): string => {
  return `assets/images/badges/${badgeId}.png`;
};
