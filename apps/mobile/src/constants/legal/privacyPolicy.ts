export type SupportedLegalLang = 'zh-CN' | 'en-US';

export const privacyPolicyText: Record<SupportedLegalLang, string> = {
  'zh-CN': `《隐私政策》
生效日期：2025-08-08

我们尊重并保护你的隐私。本政策说明我们收集哪些信息、如何使用，以及你对信息的权利。

一、我们收集的信息
1) 登录信息：当你使用“使用 Apple 登录”功能时，我们会从 Apple 获取一个匿名化的用户标识，以及（如你同意）你的邮箱地址。我们不会获取你的 Apple 账号密码。
2) 使用记录：包括你查过的单词、保存的生词表与学习进度，仅用于在不同设备之间同步与功能优化。
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
这些服务可能在境外处理相关请求数据，我们会采取加密和访问控制等措施保障安全。

四、数据存储与安全
1) 我们仅在提供服务所必需的期限内保存你的数据，超期将删除或匿名化。
2) 我们采用加密传输、访问权限控制等措施保护数据安全。

五、你的权利
1) 你有权访问、更正或删除你的个人数据。
2) 你可以随时在“设置”中注销账户，注销后我们将删除与你账户相关的个人数据。

六、政策更新
如本政策有重大变更，我们将在应用内提示并在生效前征得你的同意。

七、联系我们
如有问题或建议，请通过以下方式联系我们：
邮箱：lt14gs@gmail.com

如本政策中中英文版本存在不一致，以中文版本为准。`,

  'en-US': `Privacy Policy
Effective Date: 2025-08-08

We respect and protect your privacy. This policy explains what information we collect, how we use it, and your rights.

1. Information We Collect
a) Login Information: When you use "Sign in with Apple", we receive an anonymized user identifier and, if you agree, your email address. We do not receive your Apple account password.
b) Usage Records: Words you look up, saved vocabulary lists, and learning progress, used only for cross-device sync and feature improvements.
c) Device Information: Device model, OS version, and app version, for improving user experience and fixing issues.

2. How We Use This Information
a) Provide login, sync, lookup, and review functions.
b) Improve and optimize our products and services.
c) Perform troubleshooting and security protection when necessary.

3. Third-Party Services
We may use the following third-party services to provide features:
- Apple (account login and authentication)
- OpenAI API (definition generation)
- TMDB API (media metadata)
These services may process related request data outside your jurisdiction. We take measures such as encryption and access control to keep it secure.

4. Data Storage and Security
a) We retain your data only as long as necessary to provide the service, after which it is deleted or anonymized.
b) We use encrypted transmission and access control to protect your data.

5. Your Rights
a) You may access, correct, or delete your personal data.
b) You may delete your account in “Settings”. Upon deletion, we will remove your personal data associated with the account.

6. Changes to This Policy
We will notify you in-app of any material changes and obtain your consent before they take effect.

7. Contact Us
If you have questions or suggestions, please contact:
Email: lt14gs@gmail.com

If there is any inconsistency between the English and Chinese versions, the Chinese version shall prevail.`,
};