export type SupportedLegalLang = 'zh-CN' | 'en-US';

export const privacyPolicyText: Record<SupportedLegalLang, string> = {
  'zh-CN': `我们重视你的隐私。本《隐私政策》说明我们如何收集、使用与保护你的信息：

1. 收集范围：账号信息、学习记录、搜索历史等为提供服务所需的数据。
2. 使用目的：用于提供与改进服务、个性化推荐与同步功能。
3. 存储与安全：数据采用加密传输与存储，采取必要的安全措施。
4. 第三方：可能使用第三方服务（如 TMDB、云服务）以完成内容获取与数据同步。
5. 权利：你有权访问、更正或删除你的数据。
6. 变更：我们可能更新本政策，重大变更会在应用内提示。`,
  'en-US': `We value your privacy. This Privacy Policy explains how we collect, use and protect your data:

1. Data Collected: Account info, learning records, search history required to provide services.
2. Purpose: To provide/improve services, personalize recommendations, and enable sync.
3. Storage & Security: Data is transmitted and stored securely with necessary safeguards.
4. Third Parties: We may use third-party services (e.g., TMDB, cloud) for content and sync.
5. Your Rights: You can access, correct, or delete your data.
6. Changes: We may update this policy and will notify you in-app for material changes.`,
};


