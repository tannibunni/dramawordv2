export type SupportedLegalLang = 'zh-CN' | 'en-US';

export const privacyPolicyText: Record<SupportedLegalLang, string> = {
  'zh-CN': `《隐私政策》
生效日期：2025-08-08

我们尊重并保护您的隐私。本政策适用于全球范围内的用户，旨在说明我们收集哪些信息、如何使用这些信息，以及您在适用法律范围内享有的权利。我们承诺遵守您所在司法管辖区的相关法律法规，并在必要时进行跨境数据处理。

一、我们收集的信息
1) 登录信息：当您使用“使用 Apple 登录”功能时，我们会从 Apple 获取一个匿名化的用户标识，以及（如您同意）您的邮箱地址。我们不会获取您的 Apple 账号密码。
2) 使用记录：包括您查询的单词、保存的生词表与学习进度，仅用于在不同设备之间同步与功能优化。
3) 设备信息：如设备型号、系统版本、APP 版本，用于改进产品体验与修复问题。

二、我们如何使用这些信息
1) 提供登录、数据同步、查词与复习等核心功能。
2) 改进和优化我们的产品与服务。
3) 在必要时进行故障排查与安全防护。

三、第三方服务
我们可能会调用以下第三方服务来实现功能：
- Apple（提供账户登录与认证）
- OpenAI API（用于释义生成）
- TMDB API（用于影视元数据）
这些服务可能涉及跨境数据处理。我们采取加密、访问控制等措施保障数据安全。

四、数据存储与安全
1) 我们仅在提供服务所必需的期限内保存您的数据，超期将删除或匿名化。
2) 我们采用加密传输、访问权限控制等措施保护数据安全。

五、您的权利
1) 您有权依据适用法律访问、更正或删除您的个人数据。
2) 您可以随时在“设置”中注销账户，注销后我们将删除与您账户相关的个人数据。

六、政策更新
如本政策有重大变更，我们将在应用内提示并在生效前征得您的同意。

七、联系我们
如有问题或建议，请通过以下方式联系我们：
邮箱：dt14gs@gmail.com

如本政策中中英文版本存在不一致，以中文版本为准。`,

  'en-US': `Privacy Policy
Effective Date: 2025-08-08

We respect and protect your privacy. This policy applies globally and explains what information we collect, how we use it, and your rights under applicable laws in your jurisdiction. We comply with relevant legal requirements and may process data across borders as necessary.

1. Information We Collect
a) Login Information: When you use "Sign in with Apple", we receive an anonymized user identifier and, if you agree, your email address. We do not receive your Apple account password.
b) Usage Records: Words you look up, saved vocabulary lists, and learning progress, used solely for cross-device synchronization and feature enhancement.
c) Device Information: Device model, OS version, and app version, to improve user experience and resolve issues.

2. How We Use This Information
a) To provide login, data synchronization, lookup, and review functionalities.
b) To improve and optimize our products and services.
c) To perform troubleshooting and ensure security when necessary.

3. Third-Party Services
We may use the following third-party services to provide features:
- Apple (account login and authentication)
- OpenAI API (definition generation)
- TMDB API (media metadata)
These services may involve cross-border data processing. We implement encryption and access controls to protect your data.

4. Data Storage and Security
a) We retain your data only as long as necessary to provide the service, after which it is deleted or anonymized.
b) We use encrypted transmission and access controls to safeguard your data.

5. Your Rights
a) You may access, correct, or delete your personal data in accordance with applicable laws.
b) You may delete your account in “Settings”. Upon deletion, we will remove personal data associated with your account.

6. Changes to This Policy
We will notify you in-app of any material changes and obtain your consent before they take effect.

7. Contact Us
If you have questions or suggestions, please contact:
Email: dt14gs@gmail.com

If there is any inconsistency between the English and Chinese versions, the Chinese version shall prevail.`,
};