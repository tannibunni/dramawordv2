export type SupportedLegalLang = 'zh-CN' | 'en-US';

export const userAgreementText: Record<SupportedLegalLang, string> = {
  'zh-CN': `欢迎使用本应用。使用本应用即表示你已阅读、理解并同意遵守本《用户协议》。请在使用前仔细阅读，尤其是涉及免除或限制责任的条款。

1. 使用范围：本应用仅供个人学习与交流使用，不得用于任何商业、非法或未经授权的目的。
2. 账户与安全：请妥善保管账户信息，不得将账户转让、出售或出借给他人使用。你需对账户下的所有行为负责，如发现账户被盗或异常，应立即通知我们。
3. 内容与版权：本应用中的推荐内容与元数据来自 TMDB 等第三方来源，版权归原作者或权利人所有。你不得对上述内容进行未经授权的复制、修改、传播或商业使用。
4. 用户内容：你在本应用中提交的评论、笔记等内容不得侵犯他人合法权益。你同意授予我们在应用内展示、优化和推荐你所提交内容的权利。
5. 数据与隐私：我们将依据《隐私政策》收集、存储和使用你的个人信息。你理解并同意，在提供部分功能或服务时，我们可能会调用必要的第三方接口。
6. 禁止行为：不得上传、发布、传播任何违法违规、侵权、低俗或危害网络安全的内容；不得进行反向工程、恶意攻击、爬取数据等行为。
7. 未成年人使用：若你未满18周岁，应在监护人指导下使用本应用，并确保已获得监护人同意。
8. 免责声明：本应用按“现状”提供，不对内容的完整性、准确性、适用性做任何明示或暗示的保证。因使用本应用或依赖其内容而造成的任何直接或间接损失，我们不承担责任。
9. 协议变更与终止：我们有权根据运营需要随时更新本协议，更新后的版本将在应用内公布并即时生效。若你不同意更新内容，应立即停止使用本应用。
10. 适用法律与争议解决：本协议适用中华人民共和国法律。如因本协议引发争议，双方应友好协商解决；协商不成的，均提交至本公司所在地有管辖权的人民法院处理。`,

  'en-US': `Welcome to our app. By using this app, you confirm that you have read, understood, and agreed to comply with this User Agreement. Please read carefully, especially clauses that limit or exempt liability.

1. Scope of Use: This app is for personal learning and communication purposes only, and may not be used for any commercial, illegal, or unauthorized activities.
2. Account & Security: Keep your account credentials safe and do not transfer, sell, or lend your account to others. You are responsible for all activities under your account. Notify us immediately if you detect unauthorized use.
3. Content & Copyright: Recommendations and metadata are sourced from TMDB and other third parties; copyrights belong to their respective owners. You may not copy, modify, distribute, or commercially exploit such content without permission.
4. User Content: Any comments, notes, or other content you submit must not infringe upon others’ rights. You grant us the right to display, optimize, and recommend your submitted content within the app.
5. Data & Privacy: We collect, store, and use your personal information in accordance with our Privacy Policy. You understand and agree that certain features may require necessary third-party APIs or services.
6. Prohibited Conduct: Do not upload, post, or distribute any unlawful, infringing, obscene, or harmful content; do not engage in reverse engineering, malicious attacks, or unauthorized data scraping.
7. Minors: If you are under 18 years old, you should use the app under the supervision and guidance of a parent or guardian, and only after obtaining their consent.
8. Disclaimer: This app is provided "as is" without warranties of completeness, accuracy, or fitness for a particular purpose. We are not liable for any direct or indirect losses arising from your use or reliance on the content.
9. Changes & Termination: We may update this agreement at any time; updates will be published in-app and take effect immediately. If you do not agree with the updates, you should stop using the app.
10. Governing Law & Dispute Resolution: This agreement is governed by the laws of the People’s Republic of China. Any disputes arising hereunder shall be resolved amicably; failing that, they shall be submitted to the competent People’s Court where our company is located.`,
};

export const privacyPolicyText: Record<SupportedLegalLang, string> = {
  'zh-CN': `隐私政策（生效日期：2025年8月8日）

我们非常重视您的隐私和个人信息保护。本隐私政策说明我们如何收集、使用和保护您的信息。

1. 信息收集：我们仅收集为提供服务所必需的个人信息。
2. 信息使用：收集的信息仅用于改善服务体验，不会用于未经授权的用途。
3. 信息保护：我们采取合理的技术和管理措施保障您的信息安全。
4. 第三方服务：部分功能可能调用第三方接口，相关数据处理遵循其隐私政策。
5. 用户权利：您有权访问、更正或删除您的个人信息。
6. 联系方式：如有隐私相关问题，请通过邮箱 dt14gs@gmail.com 与我们联系。

感谢您对我们的信任与支持。`,

  'en-US': `Privacy Policy (Effective Date: August 8, 2025)

We highly value your privacy and the protection of your personal information. This Privacy Policy explains how we collect, use, and protect your information.

1. Information Collection: We only collect personal information necessary to provide our services.
2. Information Use: Collected information is used solely to improve service experience and not for unauthorized purposes.
3. Information Protection: We implement reasonable technical and administrative measures to safeguard your information.
4. Third-Party Services: Some features may use third-party APIs; data handling is subject to their privacy policies.
5. User Rights: You have the right to access, correct, or delete your personal information.
6. Contact: For any privacy-related inquiries, please contact us at dt14gs@gmail.com.

Thank you for your trust and support.`,
};