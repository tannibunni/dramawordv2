export type SupportedLegalLang = 'zh-CN' | 'en-US';

export const userAgreementText: Record<SupportedLegalLang, string> = {
  'zh-CN': `欢迎使用本应用。使用本应用即表示你同意遵守本《用户协议》。请在使用前仔细阅读：

1. 使用范围：本应用仅用于个人学习与交流，不得用于商业目的。
2. 账户与安全：请妥善保管你的账户信息，对账户下的所有活动负责。
3. 内容与版权：本应用中的推荐内容与元数据来自 TMDB 等第三方来源，版权归其原作者所有。
4. 数据与隐私：我们遵循《隐私政策》处理你的数据，请同时阅读并同意。
5. 禁止行为：不得进行任何违法、侵权或破坏系统安全的行为。
6. 变更与终止：我们可能根据需要更新本协议或终止服务，请留意应用内通知。`,
  'en-US': `Welcome to our app. By using this app, you agree to this User Agreement. Please read carefully before use:

1. Scope: The app is for personal learning and communication only, not for commercial use.
2. Account & Security: Keep your account credentials safe and be responsible for activities under your account.
3. Content & Copyright: Recommendations and metadata come from TMDB and other third parties; copyrights belong to their owners.
4. Data & Privacy: We process your data under the Privacy Policy; please read and agree to it as well.
5. Prohibited Conduct: Do not engage in illegal, infringing, or security-threatening activities.
6. Changes & Termination: We may update this agreement or terminate the service; watch for in-app notices.`,
};


