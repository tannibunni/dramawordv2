# 使用 Node.js 18 作为基础镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制源代码
COPY . .

# 构建 TypeScript 代码
RUN npm run build

# 创建 uploads 目录
RUN mkdir -p uploads

# 暴露端口
EXPOSE 3001

# 启动命令
CMD ["npm", "start"] 