# 清空数据指南

## 方法一：通过MongoDB Atlas网页界面（推荐）

1. 登录 [MongoDB Atlas](https://cloud.mongodb.com)
2. 选择你的项目
3. 点击 "Browse Collections"
4. 选择你的数据库
5. 对以下集合执行删除操作：
   - `words` - 单词数据
   - `searchhistories` - 搜索历史
   - `userlearningrecords` - 用户学习记录
   - `users` - 用户数据
   - `shows` - 剧集数据

## 方法二：通过脚本（需要MongoDB连接字符串）

1. 运行脚本：
   ```bash
   node clear-mongo-data.js
   ```

2. 输入你的MongoDB连接字符串
3. 确认删除操作

## 方法三：通过API（如果后端运行正常）

1. 运行脚本：
   ```bash
   node clear-data.js
   ```

## 方法四：手动删除（通过MongoDB Compass）

1. 打开 MongoDB Compass
2. 连接到你的数据库
3. 选择每个集合
4. 点击 "Delete Documents" -> "Delete All Documents"

## 注意事项

⚠️ **警告**：删除操作不可逆，请确保你真的需要清空所有数据！

## 清空的内容

- ✅ 所有单词记录
- ✅ 所有搜索历史
- ✅ 所有用户学习记录
- ✅ 所有用户数据
- ✅ 所有剧集数据
- ✅ 内存缓存（如果通过API）

## 验证清空结果

清空后，你可以通过以下方式验证：

1. 检查MongoDB Atlas中的集合是否为空
2. 在应用中搜索单词，应该会重新生成数据
3. 检查首页的历史记录是否为空 