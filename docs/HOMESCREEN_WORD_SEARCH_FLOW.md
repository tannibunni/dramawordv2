# HomeScreen 查词功能调用链与 Prompt 机制说明

## 1. 前端查词调用链

### 主要入口
- `apps/mobile/src/screens/Home/HomeScreen.tsx`
  - 中文查英文：
    - 调用：`wordService.translateChineseToEnglish(word)`
    - 实现：`apps/mobile/src/services/wordService.ts`
    - 后端接口：`/translate`，由 `services/api/src/controllers/.wordControllerts` 的 `translateChineseToEnglish` 处理
  - 英文查中文：
    - 调用：`wordService.searchWord(word, 'en')`
    - 实现：`apps/mobile/src/services/wordService.ts`
    - 后端接口：`/search`，由 `services/api/src/controllers/wordController.ts` 的 `searchWord` 处理

## 2. 后端查词与 Prompt 机制

- 路由定义：`services/api/src/routes/wordRoutes.ts`
- 主逻辑：`services/api/src/controllers/wordController.ts`
  - `getPromptTemplate`、`getLanguagePrompt` 等函数根据 `uiLanguage`（界面语言）、`language`（查词目标语言）、`type`（如 definition）动态加载 prompt 文件。
- Prompt 文件路径示例：
  - `services/api/prompts/{uiLanguage}/{language}.json`
  - 例如：`services/api/prompts/zh-CN/en.json`
- Prompt 文件内容决定了 AI 生成释义/例句的风格和语言。

## 3. 主要涉及文件列表

- **前端：**
  - `apps/mobile/src/screens/Home/HomeScreen.tsx`（查词入口）
  - `apps/mobile/src/services/wordService.ts`（查词 API 封装）
- **后端：**
  - `services/api/src/routes/wordRoutes.ts`（路由定义）
  - `services/api/src/controllers/wordController.ts`（查词/翻译主逻辑、Prompt 加载）
  - `services/api/prompts/zh-CN/en.json`（Prompt 模板，实际内容可变）

## 4. Prompt 机制说明

- 查词时，后端会根据你的界面语言（如 zh-CN）和查词目标语言（如 en）加载对应的 prompt 文件，决定 AI 返回内容的语言和格式。
- 如果 prompt 文件内容要求“释义和例句都用英文”，即使你在中文界面，AI 也会返回英文释义。
- 你可以修改 `services/api/prompts/zh-CN/en.json` 里的 prompt，让 AI 返回中文释义。

## 5. 修改建议

- 如需查词结果为中文释义，请检查并修改对应 prompt 文件内容，确保其 instruct AI 返回中文释义和例句。
- 可在 `services/api/prompts/zh-CN/en.json` 中调整提示词，例如：
  ```json
  {
    "definition": "你是专业的中英词典助手。请用中文详细解释英文单词“{{word}}”，并给出中文例句。"
  }
  ``` 