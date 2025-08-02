#!/bin/bash

# 自动接受代码脚本
# 用法: ./scripts/accept-code.sh [--quick|-q]

set -e

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# 日志函数
log() {
    echo -e "${2:-$NC}$1${NC}"
}

# 检查是否为快速模式
QUICK_MODE=false
if [[ "$1" == "--quick" || "$1" == "-q" ]]; then
    QUICK_MODE=true
fi

log "🤖 开始自动接受代码流程" "$BOLD"
log "============================================================" "$BLUE"

if [ "$QUICK_MODE" = true ]; then
    log "⚡ 快速接受模式 - 跳过详细检查" "$YELLOW"
    
    # 检查是否有未推送的提交
    if git log --oneline origin/main..HEAD | grep -q .; then
        log "📤 发现未推送的提交，正在推送..." "$BLUE"
        git push origin main
        log "✅ 代码已成功推送" "$GREEN"
    else
        log "✅ 所有代码已是最新状态" "$GREEN"
    fi
    
    log "🎉 快速接受完成！" "$BOLD"
    exit 0
fi

# 完整检查模式
log "📋 1. 检查Git状态..." "$BLUE"
if git status --porcelain | grep -q .; then
    log "   ❌ Git工作目录有未提交的更改" "$RED"
    log "   请先提交或暂存更改" "$YELLOW"
    exit 1
else
    log "   ✅ Git工作目录干净" "$GREEN"
fi

log "📋 2. 检查废弃服务使用..." "$BLUE"
if find apps/mobile/src -name "*.ts" -o -name "*.tsx" | xargs grep -l "syncManager\|incrementalSyncManager\|dataSyncService\|optimizedDataSyncService\|DataSyncService" 2>/dev/null; then
    log "   ❌ 发现废弃服务使用" "$RED"
    exit 1
else
    log "   ✅ 没有发现废弃服务使用" "$GREEN"
fi

log "📋 3. 检查备份文件..." "$BLUE"
BACKUP_DIR="backup/old-sync-services"
REQUIRED_FILES=("syncManager.ts" "incrementalSyncManager.ts" "dataSyncService.ts" "optimizedDataSyncService.ts")

if [ ! -d "$BACKUP_DIR" ]; then
    log "   ❌ 备份目录不存在" "$RED"
    exit 1
fi

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$BACKUP_DIR/$file" ]; then
        log "   ❌ 缺少备份文件: $file" "$RED"
        exit 1
    fi
done
log "   ✅ 备份文件完整" "$GREEN"

log "📋 4. 运行系统集成验证..." "$BLUE"
if node scripts/verify-system-integration.js | grep -q "✅ 系统集成验证通过"; then
    log "   ✅ 系统集成验证通过" "$GREEN"
else
    log "   ❌ 系统集成验证失败" "$RED"
    exit 1
fi

log "📋 5. 运行一致性验证..." "$BLUE"
if node scripts/verify-unified-sync-consistency.js | grep -q "✅ 统一同步服务一致性验证通过"; then
    log "   ✅ 一致性验证通过" "$GREEN"
else
    log "   ❌ 一致性验证失败" "$RED"
    exit 1
fi

log "📋 6. 检查未推送的提交..." "$BLUE"
if git log --oneline origin/main..HEAD | grep -q .; then
    log "   📤 发现未推送的提交，正在推送..." "$BLUE"
    git push origin main
    log "   ✅ 代码已成功推送到远程仓库" "$GREEN"
else
    log "   ✅ 所有代码已是最新状态" "$GREEN"
fi

log "🎉 自动接受完成！" "$BOLD"
log "✅ 代码已成功接受并部署" "$GREEN"

# 生成时间戳报告
REPORT_FILE="auto-accept-report-$(date +%s).txt"
{
    echo "自动接受报告 - $(date)"
    echo "=================================="
    echo "Git状态: 干净"
    echo "废弃服务: 无"
    echo "备份文件: 完整"
    echo "系统集成: 通过"
    echo "一致性验证: 通过"
    echo "推送状态: 成功"
} > "$REPORT_FILE"

log "📄 报告已保存: $REPORT_FILE" "$BLUE" 