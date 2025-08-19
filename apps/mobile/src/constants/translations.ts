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
  | 'no_learning_data'
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
  | 'current_version'
  | 'phone_login'
  | 'wechat_login'
  | 'apple_login'
  | 'email_login'
  | 'email_register'
  | 'create_account'
  | 'login_to_account'
  | 'email'
  | 'password'
  | 'confirm_password'
  | 'nickname'
  | 'register_now'
  | 'already_have_account'
  | 'dont_have_account'
  | 'forgot_password'
  | 'reset_password'
  | 'send_verification_email'
  | 'email_sent'
  | 'check_email'
  | 'invalid_email'
  | 'password_too_short'
  | 'passwords_not_match'
  | 'nickname_required'
  | 'registration_success'
  | 'login_success'
  | 'login_failed'
  | 'email_already_exists'
  | 'invalid_credentials'
  | 'email_required'
  | 'password_required'
  | 'confirm_password_required'
  | 'registration_failed'
  | 'network_error'
  | 'send_failed'
  | 'back_to_login'
  | 'ok'
  | 'processing'
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
  | 'korean_language'
  
  // 新增的翻译键（从translationService.ts合并）
  | 'collected_words'
  | 'contributed_words'
  | 'out_of'
  | 'level_text'
  | 'collected_vocabulary'
  | 'cumulative_review'
  | 'continuous_learning'
  | 'words_unit'
  | 'times_unit'
  | 'days_unit'
  | 'hello_greeting'
  | 'review_subtitle'
  | 'exp_gained'
  | 'congratulations_exp'
  | 'level_up_congratulations'
  | 'add_shows'
  | 'add_wordbook'
  | 'challenge_cards'
  | 'smart_challenge'
  | 'wrong_words_challenge'
  | 'wrong_words_count'
  | 'ebbinghaus_activated'
  | 'wrong_words_challenge_title'
  | 'series_review_title'
  | 'wordbook_review_title'
  | 'audio_play_failed'
  | 'audio_play_failed_message'
  | 'review_complete_message'
  | 'wrong_words_empty_title'
  | 'wrong_words_empty_subtitle'
  | 'start_review'
  | 'general_empty_subtitle'
  | 'smart_review_mode'
  | 'all_review_mode'
  | 'smart_review_description'
  | 'all_review_description'
  | 'switch_to_all'
  | 'switch_to_smart'
  | 'language_config_error'
  | 'query_failed'
  | 'search_failed'
  | 'get_word_detail_failed'
  | 'keep_current_language'
  | 'target_language'
  | 'chinese_to_target'
  | 'badge_unlocked'
  | 'show_answer'
  | 'examples'
  | 'learning_record'
  | 'search_count'
  | 'last_learned'
  | 'search_shows'
  | 'search_wordbooks'
  | 'searching'
  | 'no_results'
  | 'try_other_keywords'
  | 'no_shows'
  | 'no_recommendations'
  | 'shows_count'
  | 'watching_status'
  | 'completed_status'
  | 'plan_to_watch_status'
  | 'unknown_status'
  | 'wordbook'
  | 'unknown_genre'
  | 'last_watched'
  | 'mark_completed'
  | 'delete_show'
  | 'delete_confirm'
  | 'add_to_showlist'
  | 'already_added'
  | 'ongoing'
  | 'finished'
  | 'no_overview'
  | 'loading_overview'
  | 'no_collected_words'
  | 'word_details'
  | 'no_wordbooks'
  | 'no_wordbook_results'
  | 'try_other_wordbook_keywords'
  | 'cant_find_show_manual_add'
  | 'add_manually'
  | 'recommendations_tab'
  | 'shows_tab'
  | 'wordbooks_tab'
  | 'not_completed'
  | 'edit_wordbook'
  | 'name'
  | 'description'
  | 'icon'
  | 'create'
  | 'name_required'
  | 'save_success'
  | 'save_failed'
  | 'enable_notifications'
  | 'notification_permission_required'
  | 'permission_denied'
  | 'notifications_enabled'
  | 'notifications_disabled'
  | 'review_reminder'
  | 'daily_review'
  | 'weekly_review'
  | 'new_words'
  | 'streak_reminder'
  | 'achievement'
  | 'motivation'
  | 'review_now'
  | 'continue_learning'
  | 'check_progress'
  | 'daily_goal'
  | 'weekly_goal'
  | 'monthly_goal'
  | 'time_to_review'
  | 'keep_streak'
  | 'new_achievement'
  | 'learning_reminder'
  | 'vocabulary_growth'
  | 'practice_makes_perfect'
  | 'knowledge_power'
  
  // 订阅页面
  | 'subscription_management'
  | 'premium_user'
  | 'trial_user'
  | 'free_user'
  | 'trial_countdown'
  | 'trial_expired'
  | 'subscription_active'
  | 'monthly_plan'
  | 'yearly_plan' 
  | 'lifetime_plan'
  | 'subscribe_button'
  | 'subscribed'
  | 'processing'
  | 'feature_comparison'
  | 'free_version'
  | 'premium_version'
  | 'chinese_english_search'
  | 'multilingual_search'
  | 'wordbook_function'
  | 'review_function'
  | 'learning_statistics'
  | 'show_management'
  | 'ai_smart_interpretation'
  | 'offline_learning'
  | 'multi_device_sync'
  | 'premium_privileges'
  | 'trial_description'
  | 'free_description'
  | 'premium_feature_list'
  | 'trial_feature_list'
  | 'free_feature_list'
  | 'subscription_thank_you'
  | 'trial_ending_warning'
  | 'upgrade_to_unlock'
  | 'subscription_success'
  | 'subscription_failed'
  | 'restore_purchases'
  | 'restore_success'
  | 'restore_failed'
  | 'no_purchases_found'
  | 'days_remaining'
  | 'enjoy_all_features'
  | 'trial_ended_limitations'
  | 'manage_subscription'
  | 'subscribe_now'
  | 'start_trial'
  
  // 每日奖励
  | 'daily_rewards'
  | 'daily_rewards_title'
  | 'collect_new_words'
  | 'study_time'
  | 'perfect_review'
  | 'reward_available'
  | 'reward_claimed'
  | 'reward_locked'
  | 'claim_reward'
  | 'claim_all'
  | 'one_click_claim'
  | 'view_daily_rewards'
  | 'available_rewards_count'
  | 'collect_words_description'
  | 'collect_words_condition'
  | 'daily_review_description'
  | 'daily_review_condition'
  | 'study_time_description'
  | 'study_time_condition'
  | 'continuous_learning_description'
  | 'continuous_learning_condition'
  | 'perfect_review_description'
  | 'perfect_review_condition'
  | 'reward_claim_failed'
  | 'reward_claim_retry'
  | 'no_rewards_available'
  | 'confirm_claim_all'
  | 'no_rewards_title'
  | 'no_rewards_subtitle'
  | 'study_time_progress'
  | 'continuous_learning_progress'
  | 'perfect_review_progress'
  | 'today_collected_words'
  | 'today_completed_reviews'
  | 'today_study_minutes'
  | 'continuous_days'
  | 'need_more_study_time'
  | 'need_more_continuous_days'
  | 'per_word_xp'
  | 'start_challenge'
  | 'no_words_to_challenge'
  | 'start_review_now'
  | 'you_have_mastered'
  | 'flashcards'
  | 'no_errors_continue_learning'
  | 'monthly_subscription'
  | 'quarterly_subscription'
  | 'yearly_subscription'
  | 'most_flexible_choice'
  | 'cancel_anytime'
  | 'save_amount'
  | 'most_cost_effective'
  | 'one_time_payment'
  | 'use_forever'
  | 'long_term_best_value'
  | 'equivalent_to_months'
  | 'best_value'
  | 'one_time_payment_badge'
  | 'per_month'
  | 'per_quarter'
  | 'per_year'
  | 'balanced_choice'
  | 'save_8_percent';

// 翻译内容
export const translations: Record<AppLanguage, Record<TranslationKey, string>> = {
  'zh-CN': {
    // Profile页面
    guest_user: '游客用户',
    intermediate_learner: 'LEVEL 1',
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
    mastered_cards: '等待复习 {count} 张词卡',
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
    vocabulary: '单词本',
    profile: '我的',
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
    no_learning_data: '暂无学习数据',
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
    current_version: '当前版本： 1.0.0 免费体验版',
    phone_login: '使用手机号登录',
    wechat_login: '使用微信登录',
    apple_login: '使用 Apple 登录',
    email_login: '邮箱登录',
    email_register: '邮箱注册',
    create_account: '创建账户',
    login_to_account: '登录账户',
    email: '邮箱',
    password: '密码',
    confirm_password: '确认密码',
    nickname: '昵称',
    register_now: '立即注册',
    already_have_account: '已有账户？立即登录',
    dont_have_account: '没有账户？立即注册',
    forgot_password: '忘记密码？',
    reset_password: '重置密码',
    send_verification_email: '发送验证邮件',
    email_sent: '邮件已发送',
    check_email: '请查看邮箱验证邮件',
    invalid_email: '邮箱格式不正确',
    password_too_short: '密码至少6位',
    passwords_not_match: '密码不匹配',
    nickname_required: '请输入昵称',
    registration_success: '注册成功！',
    login_success: '登录成功！',
    login_failed: '登录失败',
    email_already_exists: '该邮箱已被注册',
    invalid_credentials: '邮箱或密码错误',
    email_required: '请输入邮箱',
    password_required: '请输入密码',
    confirm_password_required: '请确认密码',
    registration_failed: '注册失败',
    send_failed: '发送失败',
    back_to_login: '返回登录',
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
    
    // 新增的翻译键（从translationService.ts合并）
    collected_words: '收集单词',
    contributed_words: '贡献新词',
    out_of: '共 {total}',
    level_text: '等级',
    collected_vocabulary: '已收集词汇',
    cumulative_review: '累计复习',
    continuous_learning: '连续学习',
    words_unit: '个词',
    times_unit: '次',
    days_unit: '天',
    hello_greeting: 'HELLO，',
    review_subtitle: '最近都收集了啥单词？我们来回顾一下吧',
    exp_gained: '经验值',
    congratulations_exp: '恭喜获得经验值！',
    level_up_congratulations: '恭喜升级！',
    add_shows: '请添加剧集吧！',
    add_wordbook: '去添加自己的单词本吧！',
    challenge_cards: '挑战词卡',
    smart_challenge: '智能复习',
    wrong_words_challenge: '错词复习',
    wrong_words_count: '有 {count} 个错词待复习',
    ebbinghaus_activated: '☑️ 已切入艾宾浩斯记忆法',
    wrong_words_challenge_title: '⚠️ 错词挑战 - 专注记忆不熟悉的单词',
    series_review_title: '📚 剧集复习 - 显示所有单词',
    wordbook_review_title: '📚 单词本复习 - 显示所有单词',
    audio_play_failed: '播放失败',
    audio_play_failed_message: '音频播放功能暂时不可用，请稍后再试',
    review_complete_message: '🎯 本次复习完成 (记住: {remembered} 个，忘记: {forgotten} 个)',
    wrong_words_empty_title: '还没有复习单词',
    wrong_words_empty_subtitle: '快去复习一些单词吧！\n巩固记忆，提升掌握度。',
    start_review: '开始复习吧',
    general_empty_subtitle: '快去搜索并收藏一些单词吧！\n积累词汇量，提升学习效果。',
    smart_review_mode: '🧠 智能复习模式',
    all_review_mode: '📚 全部复习模式',
    smart_review_description: '优先显示需要复习的单词',
    all_review_description: '显示所有单词，不受时间限制',
    switch_to_all: '切换全部',
    switch_to_smart: '切换智能',
    language_config_error: '无法获取语言配置，请重试',
    query_failed: '查询失败',
    search_failed: '搜索失败',
    get_word_detail_failed: '无法获取单词详情',
    keep_current_language: '保持当前语言',
    target_language: '目标语言',
    chinese_to_target: '中文转{target}',
    badge_unlocked: '恭喜解锁 {count} 个单词徽章！',
    show_answer: '显示答案',
    examples: '例句：',
    learning_record: '学习记录',
    search_count: '搜索次数:',
    last_learned: '最后学习:',
    search_wordbooks: '搜索单词本...',
    searching: '搜索中...',
    no_results: '没有找到相关剧集',
    try_other_keywords: '尝试其他关键词',
    no_shows: '暂无剧集数据，请搜索添加',
    no_recommendations: '暂无推荐内容',
    shows_count: '{count} 个剧集',
    watching_status: '观看中',
    completed_status: '已完成',
    plan_to_watch_status: '想看',
    unknown_status: '未知',
    wordbook: '单词本',
    unknown_genre: '未知类型',
    last_watched: '最后观看',
    mark_completed: '已看完',
    delete_show: '删除剧集',
    delete_confirm: '确定要删除"{name}"吗？',
    add_to_showlist: '加入剧单',
    already_added: '已添加',
    ongoing: '连载中',
    finished: '已完结',
    no_overview: '暂无剧情简介',
    loading_overview: '加载剧情简介中...',
    no_collected_words: '暂无收藏单词',
    word_details: '单词详情',
    no_wordbooks: '暂无单词本，请创建',
    no_wordbook_results: '没有找到相关单词本',
    try_other_wordbook_keywords: '尝试其他关键词',
    cant_find_show_manual_add: '找不到剧集？手动添加',
    add_manually: '手动添加',
    recommendations_tab: '推荐',
    shows_tab: '剧单',
    wordbooks_tab: '单词本',
    not_completed: '未看',
    edit_wordbook: '编辑单词本',
    name: '名称',
    description: '描述',
    icon: '图标',
    create: '创建',
    name_required: '请输入单词本名称',
    save_success: '保存成功',
    save_failed: '保存失败',
    enable_notifications: '启用通知',
    notification_permission_required: '需要通知权限',
    permission_denied: '权限被拒绝',
    notifications_enabled: '通知已启用',
    notifications_disabled: '通知已禁用',
    review_reminder: '复习提醒',
    daily_review: '每日复习时间到了！',
    weekly_review: '本周复习总结',
    new_words: '新单词等你学习',
    streak_reminder: '保持学习连续',
    achievement: '学习成就',
    motivation: '学习激励',
    review_now: '立即复习',
    continue_learning: '继续学习',
    check_progress: '查看进度',
    daily_goal: '每日目标',
    weekly_goal: '每周目标',
    monthly_goal: '每月目标',
    time_to_review: '该复习了',
    keep_streak: '保持连续学习',
    new_achievement: '新成就解锁',
    learning_reminder: '学习提醒',
    vocabulary_growth: '词汇增长',
    practice_makes_perfect: '熟能生巧',
    knowledge_power: '知识就是力量',
    
    // 订阅页面
    subscription_management: '订阅管理',
    premium_user: '高级版用户',
    trial_user: '试用期用户',
    free_user: '免费版用户',
    trial_countdown: '试用期还有 {days} 天',
    trial_expired: '试用期已结束',
    subscription_active: '您已订阅 {plan} 计划',
    monthly_plan: '月度订阅',
    yearly_plan: '年度订阅',
    lifetime_plan: '终身订阅',
    subscribe_button: '订阅 {price}',
    subscribed: '已订阅',
    processing: '处理中...',
    feature_comparison: '功能',
    free_version: '免费版',
    premium_version: '高级版',
    chinese_english_search: '中英文查词',
    multilingual_search: '多语言查询',
    wordbook_function: '单词本功能',
    review_function: '复习功能',
    learning_statistics: '学习统计',
    show_management: '剧单管理',
    ai_smart_interpretation: 'AI智能释义',
    offline_learning: '离线学习',
    multi_device_sync: '多设备同步',
    premium_privileges: '🎉 高级版特权',
    trial_description: '试用期内您可以享受所有高级功能，包括：',
    free_description: '免费版支持基础的中英文查词功能，您可以：',
    premium_feature_list: '您已解锁所有高级功能，享受完整的语言学习体验：',
    trial_feature_list: '完整的中英文查词功能\n多语言支持（日语、韩语、西班牙语等）\n无限单词储存\n完整智能复习系统\nAI智能释义\n离线学习功能\n多设备数据同步',
    free_feature_list: '搜索中英文单词\n查看基础释义\n单词本功能（不支持）\n剧单管理（不支持）\n复习功能（不支持）\n学习统计（不支持）',
    subscription_thank_you: '感谢您的订阅！如有问题请联系客服。',
    trial_ending_warning: '试用期结束后功能将被锁定，立即订阅保持完整功能！',
    upgrade_to_unlock: '升级到高级版可解锁多语言支持、AI智能释义、无限储存等更多功能！',
    subscription_success: '恭喜您成为高级版用户，现在可以享受所有功能了！',
    subscription_failed: '订阅过程中出现错误，请稍后重试',
    restore_purchases: '恢复购买',
    restore_success: '您的购买记录已恢复，功能已解锁！',
    restore_failed: '恢复购买过程中出现错误',
    no_purchases_found: '没有找到可恢复的购买记录',
    days_remaining: '天',
    enjoy_all_features: '享受所有高级功能',
    trial_ended_limitations: '升级解锁所有功能',
    manage_subscription: '管理订阅',
    subscribe_now: '立即订阅',
    start_trial: '开始试用',
    
    // 每日奖励
    daily_rewards: '每日奖励',
    daily_rewards_title: '每日奖励',
    collect_new_words: '收藏新单词',
    study_time: '学习时长',
    perfect_review: '完美复习',
    reward_available: '可领取',
    reward_claimed: '已领取',
    reward_locked: '未达成',
    claim_reward: '领取',
    claim_all: '一键领取',
    one_click_claim: '一键领取',
    view_daily_rewards: '查看今日奖励项目',
    available_rewards_count: '可领取 {count} 个奖励',
    collect_words_description: '今日收集了新单词',
    collect_words_condition: '今日无新单词，去添加一些！',
    daily_review_description: '今日完成复习任务',
    daily_review_condition: '今日未复习，开始复习！',
    study_time_description: '今日学习时间达标',
    study_time_condition: '再学习30分钟即可获得奖励！',
    continuous_learning_description: '连续学习天数达标',
    continuous_learning_condition: '再坚持3天即可获得奖励！',
    perfect_review_description: '今日复习全对',
    perfect_review_condition: '今日还没有完美复习，加油！',
    reward_claim_failed: '领取失败',
    reward_claim_retry: '请稍后重试',
    no_rewards_available: '没有可领取的奖励',
    confirm_claim_all: '确定要领取所有 {count} 个奖励吗？共可获得 {xp} XP',
    no_rewards_title: '暂无奖励',
    no_rewards_subtitle: '完成学习任务即可获得奖励',
    study_time_progress: '已学习 {current} 分钟，还需 {needed} 分钟！',
    continuous_learning_progress: '连续学习 {current} 天，还需 {needed} 天！',
    perfect_review_progress: '复习有错误，继续努力争取全对！',
    today_collected_words: '今日收集了 {count} 个新单词',
    today_completed_reviews: '今日完成 {count} 次复习',
    today_study_minutes: '今日学习 {minutes} 分钟',
    continuous_days: '连续学习 {days} 天',
    need_more_study_time: '再学习 {needed} 分钟即可获得奖励！',
    need_more_continuous_days: '再坚持 {needed} 天即可获得奖励！',
    per_word_xp: '每词 +2XP',
    start_challenge: '开始挑战',
    no_words_to_challenge: '暂无可挑战词',
    start_review_now: '立即复习',
    you_have_mastered: 'You have mastered',
    flashcards: 'flashcards',
    no_errors_continue_learning: '暂无错词，继续学习',
    monthly_subscription: '月度订阅',
    quarterly_subscription: '季度订阅',
    yearly_subscription: '年度订阅',
    most_flexible_choice: '最灵活的选择',
    cancel_anytime: '随时可取消',
    save_amount: '节省{amount}',
    most_cost_effective: '最划算的选择',
    one_time_payment: '一次付费',
    use_forever: '永久使用',
    long_term_best_value: '长期最划算',
    equivalent_to_months: '等价于 {count} 个月年度订阅',
    best_value: '最划算',
    one_time_payment_badge: '一次付费',
    per_month: '/月',
    per_quarter: '/季度',
    per_year: '/年',
    balanced_choice: '平衡选择',
    save_8_percent: '节省8%',
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
    no_learning_data: 'No learning data available',
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
    current_version: 'Current Version: 1.0.0 Free Trial',
    phone_login: 'Login with phone number',
    wechat_login: 'Login with WeChat',
    apple_login: 'Login with Apple',
    email_login: 'Email Login',
    email_register: 'Email Register',
    create_account: 'Create Account',
    login_to_account: 'Login to Account',
    email: 'Email',
    password: 'Password',
    confirm_password: 'Confirm Password',
    nickname: 'Nickname',
    register_now: 'Register Now',
    already_have_account: 'Already have an account? Login',
    dont_have_account: "Don't have an account? Register",
    forgot_password: 'Forgot Password?',
    reset_password: 'Reset Password',
    send_verification_email: 'Send Verification Email',
    email_sent: 'Email Sent',
    check_email: 'Please check your email for verification',
    invalid_email: 'Invalid email format',
    password_too_short: 'Password must be at least 6 characters',
    passwords_not_match: 'Passwords do not match',
    nickname_required: 'Please enter a nickname',
    registration_success: 'Registration successful!',
    login_success: 'Login successful!',
    login_failed: 'Login failed',
    email_already_exists: 'This email is already registered',
    invalid_credentials: 'Invalid email or password',
    email_required: 'Please enter email',
    password_required: 'Please enter password',
    confirm_password_required: 'Please confirm password',
    registration_failed: 'Registration failed',
    send_failed: 'Send failed',
    back_to_login: 'Back to login',
    guest_login: 'Guest Mode',
    guest_mode_experience: 'Guest Mode',
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
    
    // 新增的翻译键（从translationService.ts合并）
    collected_words: 'Collected Words',
    contributed_words: 'Contributed Words',
    out_of: 'Out of {total}',
    level_text: 'Level',
    collected_vocabulary: 'Collected',
    cumulative_review: 'Review Times',
    continuous_learning: 'Streak Days',
    words_unit: ' ',
    times_unit: ' ',
    days_unit: ' ',
    hello_greeting: 'HELLO, ',
    review_subtitle: 'What words have you collected recently? Let\'s review them',
    exp_gained: 'EXP',
    congratulations_exp: 'Congratulations! You gained experience!',
    level_up_congratulations: 'Congratulations! Level Up!',
    add_shows: ' Add some shows!',
    add_wordbook: 'Go add your own wordbook!',
    challenge_cards: 'Challenge Cards',
    smart_challenge: 'Smart Challenge',
    wrong_words_challenge: 'Wrong Words Challenge',
    wrong_words_count: '{count} wrong words to review',
    ebbinghaus_activated: '☑️ Ebbinghaus Memory Method Activated',
    wrong_words_challenge_title: '⚠️ Wrong Words Challenge - Focus on unfamiliar words',
    series_review_title: '📚 Series Review - Show all words',
    wordbook_review_title: '📚 Wordbook Review - Show all words',
    audio_play_failed: 'Playback Failed',
    audio_play_failed_message: 'Audio playback is temporarily unavailable, please try again later',
    review_complete_message: '🎯 Review completed (Remembered: {remembered}, Forgotten: {forgotten})',
    wrong_words_empty_title: 'No words to review',
    wrong_words_empty_subtitle: 'Go review some words!\nStrengthen memory and improve mastery.',
    start_review: 'Start Review',
    general_empty_subtitle: 'Go search and collect some words!\nBuild your vocabulary and improve learning.',
    smart_review_mode: '🧠 Smart Review Mode',
    all_review_mode: '📚 All Review Mode',
    smart_review_description: 'Prioritize words that need review',
    all_review_description: 'Show all words without time restrictions',
    switch_to_all: 'Switch to All',
    switch_to_smart: 'Switch to Smart',
    language_config_error: 'Unable to get language configuration, please try again',
    query_failed: 'Query Failed',
    search_failed: 'Search Failed',
    get_word_detail_failed: 'Unable to get word details',
    keep_current_language: 'Keep Current',
    target_language: 'Target Language',
    chinese_to_target: 'Chinese to {target}',
    badge_unlocked: 'Congratulations! Unlocked {count} word badge!',
    show_answer: 'Show Answer',
    examples: 'Examples:',
    learning_record: 'Learning Record',
    search_count: 'Search Count:',
    last_learned: 'Last Learned:',
    search_wordbooks: 'Search wordbooks...',
    searching: 'Searching...',
    no_results: 'No shows found',
    try_other_keywords: 'Try other keywords',
    no_shows: 'No shows yet, search to add',
    no_recommendations: 'No recommendations yet',
    shows_count: '{count} shows',
    watching_status: 'Watching',
    completed_status: 'Completed',
    plan_to_watch_status: 'Plan to Watch',
    unknown_status: 'Unknown',
    wordbook: 'Wordbook',
    unknown_genre: 'Unknown Genre',
    last_watched: 'Last watched',
    mark_completed: 'Mark Completed',
    delete_show: 'Delete Show',
    delete_confirm: 'Are you sure you want to delete "{name}"?',
    add_to_showlist: 'Add to Showlist',
    already_added: 'Already Added',
    ongoing: 'Ongoing',
    finished: 'Finished',
    no_overview: 'No overview available',
    loading_overview: 'Loading overview...',
    no_collected_words: 'No collected words',
    word_details: 'Word Details',
    no_wordbooks: 'No wordbooks yet, create one',
    no_wordbook_results: 'No wordbooks found',
    try_other_wordbook_keywords: 'Try other keywords',
    cant_find_show_manual_add: 'Can\'t find the show? Add manually',
    add_manually: 'Add Manually',
    recommendations_tab: 'Picks',
    shows_tab: 'Shows',
    wordbooks_tab: 'Wordbooks',
    not_completed: 'Not Watched',
    edit_wordbook: 'Edit Wordbook',
    name: 'Name',
    description: 'Description',
    icon: 'Icon',
    create: 'Create',
    name_required: 'Please enter wordbook name',
    save_success: 'Save successful',
    save_failed: 'Save failed',
    enable_notifications: 'Enable Notifications',
    notification_permission_required: 'Notification Permission Required',
    permission_denied: 'Permission Denied',
    notifications_enabled: 'Notifications enabled',
    notifications_disabled: 'Notifications disabled',
    review_reminder: 'Review Reminder',
    daily_review: 'Time for daily review!',
    weekly_review: 'Weekly Review Summary',
    new_words: 'New words waiting for you',
    streak_reminder: 'Keep your learning streak',
    achievement: 'Learning Achievement',
    motivation: 'Learning Motivation',
    review_now: 'Review Now',
    continue_learning: 'Continue Learning',
    check_progress: 'Check Progress',
    daily_goal: 'Daily Goal',
    weekly_goal: 'Weekly Goal',
    monthly_goal: 'Monthly Goal',
    time_to_review: 'Time to Review',
    keep_streak: 'Keep Your Streak',
    new_achievement: 'New Achievement Unlocked',
    learning_reminder: 'Learning Reminder',
    vocabulary_growth: 'Vocabulary Growth',
    practice_makes_perfect: 'Practice Makes Perfect',
    knowledge_power: 'Knowledge is Power',
    
    // 订阅页面
    subscription_management: 'Subscription Management',
    premium_user: 'Premium User',
    trial_user: 'Trial User',
    free_user: 'Free User',
    trial_countdown: '{days} days remaining in trial',
    trial_expired: 'Trial period ended',
    subscription_active: 'You are subscribed to {plan} plan',
    monthly_plan: 'Monthly',
    yearly_plan: 'Yearly',
    lifetime_plan: 'Lifetime',
    subscribe_button: 'Subscribe {price}',
    subscribed: 'Subscribed',
    processing: 'Processing...',
    feature_comparison: 'Features',
    free_version: 'Free',
    premium_version: 'Premium',
    chinese_english_search: 'Chinese-English Search',
    multilingual_search: 'Multilingual Search',
    wordbook_function: 'Wordbook Function',
    review_function: 'Review Function',
    learning_statistics: 'Learning Statistics',
    show_management: 'Show Management',
    ai_smart_interpretation: 'AI Smart Interpretation',
    offline_learning: 'Offline Learning',
    multi_device_sync: 'Multi-device Sync',
    premium_privileges: '🎉 Premium Privileges',
    trial_description: 'During the trial period, you can enjoy all premium features, including:',
    free_description: 'Free version supports basic Chinese-English word search, you can:',
    premium_feature_list: 'You have unlocked all premium features, enjoy the complete language learning experience:',
    trial_feature_list: 'Complete Chinese-English word search\nMultilingual support (Japanese, Korean, Spanish, etc.)\nUnlimited word storage\nComplete smart review system\nAI smart interpretation\nOffline learning function\nMulti-device data sync',
    free_feature_list: 'Search Chinese-English words\nView basic definitions\nWordbook function (not supported)\nShow management (not supported)\nReview function (not supported)\nLearning statistics (not supported)',
    subscription_thank_you: 'Thank you for your subscription! Contact customer service if you have any questions.',
    trial_ending_warning: 'Functions will be locked after trial ends, subscribe now to maintain full functionality!',
    upgrade_to_unlock: 'Upgrade to Premium to unlock multilingual support, AI smart interpretation, unlimited storage and more features!',
    subscription_success: 'Congratulations! You are now a Premium user and can enjoy all features!',
    subscription_failed: 'An error occurred during subscription, please try again later',
    restore_purchases: 'Restore Purchases',
    restore_success: 'Your purchases have been restored, features unlocked!',
    restore_failed: 'An error occurred while restoring purchases',
    no_purchases_found: 'No restorable purchases found',
    days_remaining: ' days',
    enjoy_all_features: 'Enjoy all premium features',
    trial_ended_limitations: 'Upgrade to unlock all features',
    manage_subscription: 'Manage Subscription',
    subscribe_now: 'Subscribe Now',
    start_trial: 'Start Trial',
    
    // 每日奖励
    daily_rewards: 'Daily Rewards',
    daily_rewards_title: 'Daily Rewards',
    collect_new_words: 'Collect New Words',
    study_time: 'Study Time',
    perfect_review: 'Perfect Review',
    reward_available: 'Available',
    reward_claimed: 'Claimed',
    reward_locked: 'Locked',
    claim_reward: 'Claim',
    claim_all: 'Claim All',
    one_click_claim: 'Claim All',
    view_daily_rewards: 'View today\'s reward items',
    available_rewards_count: '{count} rewards available',
    collect_words_description: 'Collected new words today',
    collect_words_condition: 'No new words today, add some!',
    daily_review_description: 'Completed review tasks today',
    daily_review_condition: 'No review today, start now!',
    study_time_description: 'Study time goal achieved today',
    study_time_condition: 'Study 30 more minutes to get reward!',
    continuous_learning_description: 'Continuous learning days achieved',
    continuous_learning_condition: 'Keep going 3 more days to get reward!',
    perfect_review_description: 'Perfect review score today',
    perfect_review_condition: 'No perfect review today, keep it up!',
    reward_claim_failed: 'Claim Failed',
    reward_claim_retry: 'Please try again later',
    no_rewards_available: 'No rewards available to claim',
    confirm_claim_all: 'Claim all {count} rewards? Total {xp} XP available',
    no_rewards_title: 'No Rewards',
    no_rewards_subtitle: 'Complete learning tasks to get rewards',
    study_time_progress: 'Studied {current} minutes, {needed} more to go!',
    continuous_learning_progress: 'Learning streak: {current} days, {needed} more to go!',
    perfect_review_progress: 'Made some mistakes, keep trying for perfect score!',
    today_collected_words: 'Collected {count} new words today',
    today_completed_reviews: 'Completed {count} reviews today',
    today_study_minutes: 'Studied {minutes} minutes today',
    continuous_days: 'Learning streak: {days} days',
    need_more_study_time: 'Study {needed} more minutes to get reward!',
    need_more_continuous_days: 'Keep going {needed} more days to get reward!',
    per_word_xp: '+2XP each',
    start_challenge: 'Start Challenge',
    no_words_to_challenge: 'No words available',
    start_review_now: 'Start Review',
    you_have_mastered: 'You have mastered',
    flashcards: 'flashcards',
    no_errors_continue_learning: 'No errors, continue learning',
    monthly_subscription: 'Monthly Subscription',
    quarterly_subscription: 'Quarterly Subscription',
    yearly_subscription: 'Yearly Subscription',
    most_flexible_choice: 'Most flexible choice',
    cancel_anytime: 'cancel anytime',
    save_amount: 'Save {amount}',
    most_cost_effective: 'most cost-effective choice',
    one_time_payment: 'One-time payment',
    use_forever: 'use forever',
    long_term_best_value: 'long-term best value',
    equivalent_to_months: 'equivalent to {count} months yearly subscription',
    best_value: 'Best Value',
    one_time_payment_badge: 'One-time',
    per_month: '/month',
    per_quarter: '/quarter',
    per_year: '/year',
    balanced_choice: 'Balanced choice',
    save_8_percent: 'Save 8%',
  },
};

// 翻译服务类
export class TranslationService {
  private static instance: TranslationService;
  private currentLanguage: AppLanguage = 'zh-CN';

  private constructor() {}

  static getInstance(): TranslationService {
    if (!TranslationService.instance) {
      TranslationService.instance = new TranslationService();
    }
    return TranslationService.instance;
  }

  // 设置当前语言
  setLanguage(language: AppLanguage): void {
    this.currentLanguage = language;
  }

  // 获取当前语言
  getLanguage(): AppLanguage {
    return this.currentLanguage;
  }

  // 翻译函数
  translate(key: TranslationKey, params?: Record<string, string | number>): string {
    let text = translations[this.currentLanguage][key] || key;
    
    // 替换参数
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        text = text.replace(new RegExp(`{${param}}`, 'g'), String(value));
      });
    }
    
    return text;
  }
}

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

// 导出单例实例
export const translationService = TranslationService.getInstance(); 