// 应用语言类型
export type AppLanguage = 'zh-CN' | 'en-US';

// 翻译键类型
export type TranslationKey = 
  // Profile页面
  | 'guest_user'
  | 'intermediate_learner'
  | 'join_date'
  | 'login'
  | 'logged_in'
  | 'logout'
  | 'member_subscription'
  | 'settings'
  | 'push_notifications'
  | 'language_settings'
  | 'help_feedback'
  | 'about_us'
  | 'clear_all_data'
  | 'confirm_clear_data'
  | 'clear_success'
  | 'all_data_cleared'
  | 'clear_failed'
  | 'clear_error'
  
  // Review页面
  | 'ready_to_challenge'
  | 'mastered_cards'
  | 'challenge'
  | 'series_review'
  | 'wordbook_review'
  | 'random'
  | 'shuffle'
  | 'view_all'
  | 'words_count'
  
  // Home页面
  | 'recent_searches'
  | 'loading'
  | 'no_recent_history'
  | 'clear_history'
  | 'confirm_clear_history'
  | 'clear_history_success'
  | 'clear_history_failed'
  | 'clear_history_error'
  | 'search_placeholder'
  | 'search_english_placeholder'
  | 'search_korean_placeholder'
  | 'search_japanese_placeholder'
  
  // 通用
  | 'confirm'
  | 'cancel'
  | 'save'
  | 'delete'
  | 'edit'
  | 'close'
  | 'back'
  | 'next'
  | 'previous'
  | 'submit'
  | 'reset'
  | 'retry'
  | 'ok'
  | 'yes'
  | 'no'
  
  // 导航
  | 'home'
  | 'search'
  | 'review'
  | 'vocabulary'
  | 'profile'
  | 'shows'
  
  // 语言选择
  | 'language_chinese'
  | 'language_english'
  | 'current_language'
  | 'switch_language'
  | 'language_environment'
  
  // 学习相关
  | 'learning_language'
  | 'total_words'
  | 'mastered_words'
  | 'learning_days'
  | 'current_streak'
  | 'accuracy'
  | 'experience'
  | 'level'
  
  // 错误和提示
  | 'network_error'
  | 'server_error'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'validation_error'
  | 'upload_error'
  | 'no_review_words'
  | 'unknown_error'
  | 'please_retry'
  | 'check_network'
  | 'contact_admin'
  | 'error'
  | 'search_shows_failed'
  | 'confirm_delete_show'
  | 'overview'
  | 'expand'
  | 'collapse'
  | 'all'
  | 'watching'
  | 'completed'
  | 'plan_to_watch'
  | 'current_filter'
  | 'no_shows_data'
  | 'search_shows'
  | 'no_saved_words'
  | 'go_search_and_save_words'
  | 'no_recent_searches'
  | 'no_suggestions'
  | 'search_suggestions'
  | 'chinese_to_english_title'
  | 'mark_word_source'
  | 'select_show_or_search'
  | 'search_shows_placeholder'
  | 'my_shows'
  | 'default_vocabulary'
  | 'wordbook_tag'
  | 'no_shows_add_first'
  | 'enter_wordbook_name'
  | 'create_wordbook'
  | 'no_definition'
  | 'continue_learning_for_suggestions'
  | 'start_learning_to_see_progress'
  | 'no_learning_records'
  | 'start_learning'
  | 'learning_analytics'
  | 'progress_analysis'
  | 'navigate_to_learning'
  | 'wechat_user'
  | 'apple_user'
  | 'phone_user'
  | 'user'
  | 'about_dramaword'
  | 'still_need'
  | 'search_words'
  | 'congratulations_unlock'
  | 'word_badge'
  | 'word_not_found'
  | 'check_spelling_or_search'
  | 'swipe_down_for_more_examples'
  | 'swipe_left_ignore_right_collect'
  | 'ignore'
  | 'collect'
  | 'source_from'
  | 'switch_language_environment'
  | 'current_environment'
  | 'tip'
  | 'please_enter_word'
  | 'load_history_failed'
  | 'check_network_connection'
  | 'no_suitable_english_meaning'
  | 'try_other_chinese_words'
  | 'please_enter_wordbook_name'
  | 'no_audio_resource'
  | 'no_audio_resource_message'
  | 'play_error'
  | 'play_failed'
  | 'feedback_helpful'
  | 'feedback_not_helpful'
  | 'feedback_submitted'
  | 'feedback_error'
  | 'add'
  | 'added'
  | 'add_to_list'
  | 'not_watched'
  
  // 登录页面
  | 'app_name'
  | 'app_slogan'
  | 'phone_login'
  | 'wechat_login'
  | 'apple_login'
  | 'guest_login'
  | 'guest_mode_experience'
  | 'login_agreement'
  | 'user_agreement'
  | 'privacy_policy'
  | 'enter_phone_number'
  | 'enter_verification_code'
  | 'send_code'
  | 'resend_code'
  | 'verify_code'
  | 'phone_number_required'
  | 'verification_code_required'
  | 'code_sent'
  | 'code_send_failed'
  | 'verification_failed'
  | 'invalid_phone_number'
  | 'invalid_verification_code'
  
  // 欢迎页面
  | 'welcome_to_dramaword'
  | 'welcome_user'
  | 'all_languages'
  | 'english_language'
  | 'japanese_language'
  | 'korean_language';

// 翻译内容
export const translations: Record<AppLanguage, Record<TranslationKey, string>> = {
  'zh-CN': {
    // Profile页面
    guest_user: '游客用户',
    intermediate_learner: '中级学习者',
    join_date: '加入时间',
    login: '登录',
    logged_in: '已登录',
    logout: '退出登录',
    member_subscription: '会员订阅/升级',
    settings: '设置',
    push_notifications: '推送通知',
    language_settings: '语言设置',
    help_feedback: '帮助与反馈',
    about_us: '关于我们',
    clear_all_data: '清除所有数据',
    confirm_clear_data: '确定要清除所有数据吗？此操作不可恢复。',
    clear_success: '清除成功',
    all_data_cleared: '所有数据已清除',
    clear_failed: '清除失败',
    clear_error: '清除数据时发生错误',
    
    // Review页面
    ready_to_challenge: '准备好挑战今天的词卡了吗？',
    mastered_cards: '你已掌握 {count} 张词卡',
    challenge: '挑战',
    series_review: '剧集复习',
    wordbook_review: '单词本复习',
    random: '随机',
    shuffle: 'Shuffle',
    view_all: 'View all',
    words_count: '{count} 词',
    
    // Home页面
    recent_searches: '最近查词',
    loading: '加载中...',
    no_recent_history: '暂无最近查词记录',
    clear_history: '清除历史',
    confirm_clear_history: '确定要清除所有最近查词记录吗？',
    clear_history_success: '最近查词记录已清除',
    clear_history_failed: '清除最近查词记录失败',
    clear_history_error: '清除最近查词记录时发生错误',
    search_placeholder: '输入单词或中文词语...',
    search_english_placeholder: '输入英语单词或中文词语...',
    search_korean_placeholder: '输入韩语单词或中文词语...',
    search_japanese_placeholder: '输入日语单词或中文词语...',
    
    // 通用
    confirm: '确定',
    cancel: '取消',
    save: '保存',
    delete: '删除',
    edit: '编辑',
    close: '关闭',
    back: '返回',
    next: '下一步',
    previous: '上一步',
    submit: '提交',
    reset: '重置',
    retry: '重试',
    ok: '确定',
    yes: '是',
    no: '否',
    
    // 导航
    home: '首页',
    search: '搜索',
    review: '复习',
    vocabulary: '词汇',
    profile: '个人',
    shows: '剧单',
    
    // 语言选择
    language_chinese: '中文',
    language_english: 'English',
    current_language: '当前语言',
    switch_language: '切换语言',
    language_environment: '语言环境',
    
    // 学习相关
    learning_language: '学习语言',
    total_words: '总单词数',
    mastered_words: '已掌握单词',
    learning_days: '学习天数',
    current_streak: '连续学习',
    accuracy: '准确率',
    experience: '经验值',
    level: '等级',
    
    // 错误和提示
    network_error: '网络连接失败，请检查网络设置',
    server_error: '服务器错误，请稍后重试',
    unauthorized: '登录已过期，请重新登录',
    forbidden: '没有权限执行此操作',
    not_found: '请求的资源不存在',
    validation_error: '输入数据格式错误',
    upload_error: '文件上传失败',
    no_review_words: '还没有复习单词',
    unknown_error: '未知错误，请稍后重试',
    please_retry: '请稍后重试',
    check_network: '请检查网络连接',
    contact_admin: '请联系管理员',
    error: '错误',
    search_shows_failed: '搜索剧集失败，请稍后重试',
    confirm_delete_show: '确定要删除这个剧集吗？',
    overview: '剧情简介',
    expand: '展开',
    collapse: '收起',
    all: '全部',
    watching: '观看中',
    completed: '已完成',
    plan_to_watch: '想看',
    current_filter: '当前筛选',
    no_shows_data: '暂无剧集数据，请搜索添加',
    search_shows: '搜索剧集...',
    no_saved_words: '暂无收藏的单词',
    go_search_and_save_words: '去首页搜索并收藏单词吧',
    no_recent_searches: '暂无最近查词记录',
    no_suggestions: '暂无建议',
    search_suggestions: '搜索建议',
    chinese_to_english_title: '中文转英文',
    mark_word_source: '标记单词来源',
    select_show_or_search: '请选择剧集或搜索',
    search_shows_placeholder: '搜索你喜欢的剧集',
    my_shows: '我的剧单',
    default_vocabulary: '默认单词本',
    wordbook_tag: '单词本',
    no_shows_add_first: '请先添加剧集到你的单词本',
    enter_wordbook_name: '请输入单词本名称',
    create_wordbook: '创建单词本',
    no_definition: '暂无释义',
    continue_learning_for_suggestions: '继续学习获取个性化建议',
    start_learning_to_see_progress: '开始学习后这里会显示你的进度',
    no_learning_records: '还没有学习记录',
    start_learning: '开始学习',
    learning_analytics: '学习分析',
    progress_analysis: '开始学习后这里会显示你的进度分析',
    navigate_to_learning: '跳转到学习页面',
    wechat_user: '微信用户',
    apple_user: 'Apple用户',
    phone_user: '手机用户',
    user: '用户',
    about_dramaword: '关于剧词记',
    still_need: '还差{count}个',
    search_words: '搜索单词...',
    congratulations_unlock: '恭喜解锁 {count} 个单词徽章！',
    word_badge: '个单词徽章',
    word_not_found: '未找到该单词',
    check_spelling_or_search: '请检查拼写或在首页查词',
    swipe_down_for_more_examples: '向下滑动查看更多例句',
    swipe_left_ignore_right_collect: '左滑忽略 · 右滑收藏',
    ignore: '忽略',
    collect: '收藏',
    source_from: '来源于',
    switch_language_environment: '切换语言环境',
    current_environment: '当前环境：',
    tip: '提示',
    please_enter_word: '请输入要查询的单词',
    load_history_failed: '加载历史词失败，请检查网络连接',
    check_network_connection: '请检查网络连接',
    no_suitable_english_meaning: '未找到合适的英文释义',
    try_other_chinese_words: '请尝试输入其他中文词语，或稍后再试。',
    please_enter_wordbook_name: '请输入单词本名称',
    no_audio_resource: '没有发音',
    no_audio_resource_message: '该单词暂无发音资源',
    play_error: '播放出错',
    play_failed: '播放失败',
    feedback_helpful: '有帮助',
    feedback_not_helpful: '没帮助',
    feedback_submitted: '反馈已提交',
    feedback_error: '反馈提交失败',
    add: '添加',
    added: '已添加',
    add_to_list: '加入剧单',
    not_watched: '未看',
    
    // 登录页面
    app_name: '剧词记',
    app_slogan: '看剧，记住真·有用的单词',
    phone_login: '使用手机号登录',
    wechat_login: '使用微信登录',
    apple_login: '使用 Apple 登录',
    guest_login: '游客模式立即体验',
    guest_mode_experience: '游客模式立即体验',
    login_agreement: '登录即代表你同意',
    user_agreement: '《用户协议》',
    privacy_policy: '《隐私政策》',
    enter_phone_number: '请输入手机号',
    enter_verification_code: '请输入验证码',
    send_code: '发送验证码',
    resend_code: '重新发送',
    verify_code: '验证',
    phone_number_required: '请输入正确的手机号',
    verification_code_required: '请输入6位验证码',
    code_sent: '验证码已发送',
    code_send_failed: '发送验证码失败，请重试',
    verification_failed: '验证码错误，请重试',
    invalid_phone_number: '请输入正确的手机号',
    invalid_verification_code: '请输入6位验证码',
    
    // 欢迎页面
    welcome_to_dramaword: '欢迎来到剧词记',
    welcome_user: '欢迎回来，{username}！',
    all_languages: '全部',
    english_language: '英语',
    japanese_language: '日语',
    korean_language: '韩语',
  },
  
  'en-US': {
    // Profile页面
    guest_user: 'Guest User',
    intermediate_learner: 'Intermediate Learner',
    join_date: 'Joined',
    login: 'Login',
    logged_in: 'Logged In',
    logout: 'Logout',
    
    member_subscription: 'Member Subscription',
    settings: 'Settings',
    push_notifications: 'Push Notifications',
    language_settings: 'Language Settings',
    help_feedback: 'Help & Feedback',
    about_us: 'About Us',
    clear_all_data: 'Clear All Data',
    confirm_clear_data: 'Are you sure you want to clear all data? This action cannot be undone.',
    clear_success: 'Clear Successful',
    all_data_cleared: 'All data cleared',
    clear_failed: 'Clear Failed',
    clear_error: 'Error occurred while clearing data',
    
    // Review页面
    ready_to_challenge: 'Ready to challenge today\'s flashcards?',
    mastered_cards: 'You have mastered {count} flashcards',
    challenge: 'Challenge',
    series_review: 'Series Review',
    wordbook_review: 'Wordbook Review',
    random: 'Random',
    shuffle: 'Shuffle',
    view_all: 'View all',
    words_count: '{count} words',
    
    // Home页面
    recent_searches: 'Recent',
    loading: 'Loading...',
    no_recent_history: 'No recent search history',
    clear_history: 'Clear History',
    confirm_clear_history: 'Are you sure you want to clear all recent search history?',
    clear_history_success: 'Recent search history cleared',
    clear_history_failed: 'Failed to clear recent search history',
    clear_history_error: 'Error occurred while clearing search history',
    search_placeholder: 'Enter words or Chinese terms...',
    search_english_placeholder: 'Enter English words or Chinese terms...',
    search_korean_placeholder: 'Enter Korean words or Chinese terms...',
    search_japanese_placeholder: 'Enter Japanese words or Chinese terms...',
    
    // 通用
    confirm: 'Confirm',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    close: 'Close',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    submit: 'Submit',
    reset: 'Reset',
    retry: 'Retry',
    ok: 'OK',
    yes: 'Yes',
    no: 'No',
    
    // 导航
    home: 'Home',
    search: 'Search',
    review: 'Review',
    vocabulary: 'Vocabulary',
    profile: 'Profile',
    shows: 'Shows',
    
    // 语言选择
    language_chinese: '中文',
    language_english: 'English',
    current_language: 'Current Language',
    switch_language: 'Switch Language',
    language_environment: 'Language Environment',
    
    // 学习相关
    learning_language: 'Learning Language',
    total_words: 'Total Words',
    mastered_words: 'Mastered Words',
    learning_days: 'Learning Days',
    current_streak: 'Current Streak',
    accuracy: 'Accuracy',
    experience: 'Experience',
    level: 'Level',
    
    // 错误和提示
    network_error: 'Network connection failed, please check your network settings',
    server_error: 'Server error, please try again later',
    unauthorized: 'Login expired, please login again',
    forbidden: 'You don\'t have permission to perform this operation',
    not_found: 'The requested resource does not exist',
    validation_error: 'Input data format error',
    upload_error: 'File upload failed',
    no_review_words: 'No words to review yet',
    unknown_error: 'Unknown error, please try again later',
    please_retry: 'Please try again later',
    check_network: 'Please check your network connection',
    contact_admin: 'Please contact administrator',
    error: 'Error',
    search_shows_failed: 'Failed to search shows, please try again later',
    confirm_delete_show: 'Are you sure you want to delete this show?',
    overview: 'Overview',
    expand: 'Expand',
    collapse: 'Collapse',
    all: 'All',
    watching: 'Watching',
    completed: 'Completed',
    plan_to_watch: 'Plan to Watch',
    current_filter: 'Current Filter',
    no_shows_data: 'No shows data yet, please search to add',
    search_shows: 'Search shows...',
    no_saved_words: 'No saved words yet',
    go_search_and_save_words: 'Go to Home to search and save words',
    no_recent_searches: 'No recent search history',
    no_suggestions: 'No suggestions',
    search_suggestions: 'Search Suggestions',
    chinese_to_english_title: 'Chinese to English',
    mark_word_source: 'Mark Word Source',
    select_show_or_search: 'Please select a show or search',
    search_shows_placeholder: 'Add your shows',
    my_shows: 'My Shows',
    default_vocabulary: 'Default Vocabulary',
    wordbook_tag: 'Wordbook',
    no_shows_add_first: 'Please add shows to your wordbook first',
    enter_wordbook_name: 'Please enter wordbook name',
    create_wordbook: 'Create Wordbook',
    no_definition: 'No definition',
    continue_learning_for_suggestions: 'Continue learning to get personalized suggestions',
    start_learning_to_see_progress: 'Your progress will be shown here after you start learning',
    no_learning_records: 'No learning records yet',
    start_learning: 'Start Learning',
    learning_analytics: 'Learning Analytics',
    progress_analysis: 'Your progress analysis will be shown here after you start learning',
    navigate_to_learning: 'Navigate to learning page',
    wechat_user: 'WeChat User',
    apple_user: 'Apple User',
    phone_user: 'Phone User',
    user: 'User',
    about_dramaword: 'About DramaWord',
    still_need: 'Need {count} more',
    search_words: 'Search words...',
    congratulations_unlock: 'Congratulations! Unlocked {count} word badge!',
    word_badge: ' word badge',
    word_not_found: 'Word not found',
    check_spelling_or_search: 'Please check spelling or search on home page',
    swipe_down_for_more_examples: 'Swipe down for more examples',
    swipe_left_ignore_right_collect: 'Swipe left to ignore · Swipe right to collect',
    ignore: 'Ignore',
    collect: 'Collect',
    source_from: 'From',
    switch_language_environment: 'Switch Language Environment',
    current_environment: 'Current Environment: ',
    tip: 'Tip',
    please_enter_word: 'Please enter a word to search',
    load_history_failed: 'Failed to load search history, please check network connection',
    check_network_connection: 'Please check network connection',
    no_suitable_english_meaning: 'No suitable English meaning found',
    try_other_chinese_words: 'Please try other Chinese words or try again later.',
    please_enter_wordbook_name: 'Please enter wordbook name',
    no_audio_resource: 'No Audio',
    no_audio_resource_message: 'This word has no audio resource',
    play_error: 'Play Error',
    play_failed: 'Play Failed',
    feedback_helpful: 'Helpful',
    feedback_not_helpful: 'Not Helpful',
    feedback_submitted: 'Feedback Submitted',
    feedback_error: 'Feedback Submission Failed',
    add: 'Add',
    added: 'Added',
    add_to_list: 'Add to List',
    not_watched: 'Not watched',
    
    // 登录页面
    app_name: 'DramaWord',
    app_slogan: 'Watch dramas, remember truly useful words',
    phone_login: 'Login with phone number',
    wechat_login: 'Login with WeChat',
    apple_login: 'Login with Apple',
    guest_login: 'Experience guest mode immediately',
    guest_mode_experience: 'Experience guest mode immediately',
    login_agreement: 'By logging in, you agree to',
    user_agreement: 'User Agreement',
    privacy_policy: 'Privacy Policy',
    enter_phone_number: 'Please enter your phone number',
    enter_verification_code: 'Please enter the verification code',
    send_code: 'Send verification code',
    resend_code: 'Resend code',
    verify_code: 'Verify',
    phone_number_required: 'Please enter a valid phone number',
    verification_code_required: 'Please enter a 6-digit verification code',
    code_sent: 'Verification code sent',
    code_send_failed: 'Failed to send verification code, please try again',
    verification_failed: 'Incorrect verification code, please try again',
    invalid_phone_number: 'Please enter a valid phone number',
    invalid_verification_code: 'Please enter a 6-digit verification code',
    
    // 欢迎页面
    welcome_to_dramaword: 'Welcome to DramaWord',
    welcome_user: 'Welcome back, {username}!',
    all_languages: 'All',
    english_language: 'English',
    japanese_language: 'Japanese',
    korean_language: 'Korean',
  },
};

// 翻译函数
export const t = (key: TranslationKey, language: AppLanguage = 'zh-CN', params?: Record<string, string | number>): string => {
  let text = translations[language][key] || key;
  
  // 替换参数
  if (params) {
    Object.entries(params).forEach(([param, value]) => {
      text = text.replace(new RegExp(`{${param}}`, 'g'), String(value));
    });
  }
  
  return text;
};

// 应用语言配置
export const APP_LANGUAGES = {
  'zh-CN': {
    code: 'zh-CN',
    name: '中文',
    nativeName: 'Chinese',
    flag: '🇨🇳',
  },
  'en-US': {
    code: 'en-US',
    name: 'English',
    nativeName: '英文',
    flag: '🇺🇸',
  },
} as const;

export type AppLanguageCode = keyof typeof APP_LANGUAGES; 