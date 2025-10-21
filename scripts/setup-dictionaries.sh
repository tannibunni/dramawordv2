#!/bin/bash

# CC-CEDICT 词典文件设置脚本
# 用于下载、处理和设置中文词典文件

set -e  # 遇到错误时退出

echo "🚀 开始设置 CC-CEDICT 词典文件..."
echo "=================================================="

# 配置
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DATA_DIR="$PROJECT_ROOT/data/dictionaries"
API_DATA_DIR="$PROJECT_ROOT/services/api/data/dictionaries"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 检查依赖
check_dependencies() {
    log_info "检查依赖..."
    
    # 检查 Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安装，请先安装 Node.js"
        exit 1
    fi
    
    # 检查 npm
    if ! command -v npm &> /dev/null; then
        log_error "npm 未安装，请先安装 npm"
        exit 1
    fi
    
    # 检查 wget 或 curl
    if ! command -v wget &> /dev/null && ! command -v curl &> /dev/null; then
        log_error "wget 或 curl 未安装，请先安装其中一个"
        exit 1
    fi
    
    log_success "依赖检查完成"
}

# 创建目录
create_directories() {
    log_info "创建必要的目录..."
    
    mkdir -p "$DATA_DIR"
    mkdir -p "$API_DATA_DIR"
    
    log_success "目录创建完成"
}

# 下载原始 CC-CEDICT 文件
download_ccedict() {
    log_info "下载 CC-CEDICT 原始文件..."
    
    local ccedict_url="https://raw.githubusercontent.com/cc-cedict/cc-cedict/master/cedict_ts.u8"
    local output_file="$DATA_DIR/cc-cedict-raw.txt"
    
    if [ -f "$output_file" ]; then
        log_warning "CC-CEDICT 原始文件已存在，跳过下载"
        return 0
    fi
    
    if command -v wget &> /dev/null; then
        wget -O "$output_file" "$ccedict_url"
    elif command -v curl &> /dev/null; then
        curl -o "$output_file" "$ccedict_url"
    fi
    
    if [ -f "$output_file" ]; then
        log_success "CC-CEDICT 原始文件下载完成"
    else
        log_error "CC-CEDICT 原始文件下载失败"
        exit 1
    fi
}

# 处理词典文件
process_dictionary() {
    log_info "处理词典文件..."
    
    cd "$SCRIPT_DIR"
    
    # 运行 Node.js 处理脚本
    if [ -f "prepare-ccedict.js" ]; then
        node prepare-ccedict.js
        log_success "词典文件处理完成"
    else
        log_error "处理脚本不存在: prepare-ccedict.js"
        exit 1
    fi
}

# 复制文件到 API 目录
copy_to_api() {
    log_info "复制文件到 API 目录..."
    
    # 复制处理后的文件
    if [ -f "$DATA_DIR/cc-cedict-processed.txt" ]; then
        cp "$DATA_DIR/cc-cedict-processed.txt" "$API_DATA_DIR/cc-cedict-processed.txt"
        log_success "复制处理后的词典文件"
    fi
    
    # 复制 JSON 文件
    if [ -f "$DATA_DIR/cc-cedict.json" ]; then
        cp "$DATA_DIR/cc-cedict.json" "$API_DATA_DIR/cc-cedict.json"
        log_success "复制 JSON 词典文件"
    fi
}

# 验证文件
verify_files() {
    log_info "验证文件..."
    
    local files=(
        "$API_DATA_DIR/cc-cedict-processed.txt"
        "$API_DATA_DIR/cc-cedict.json"
    )
    
    for file in "${files[@]}"; do
        if [ -f "$file" ]; then
            local size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null || echo "0")
            log_success "文件存在: $(basename "$file") (${size} bytes)"
        else
            log_error "文件不存在: $(basename "$file")"
            exit 1
        fi
    done
}

# 显示统计信息
show_statistics() {
    log_info "显示统计信息..."
    
    if [ -f "$API_DATA_DIR/cc-cedict.json" ]; then
        echo ""
        echo "📊 词典统计信息:"
        echo "=================="
        
        # 使用 Node.js 解析 JSON 并显示统计信息
        node -e "
            const fs = require('fs');
            const path = '$API_DATA_DIR/cc-cedict.json';
            try {
                const data = JSON.parse(fs.readFileSync(path, 'utf8'));
                console.log('词典名称:', data.metadata.name);
                console.log('语言:', data.metadata.language);
                console.log('总词条数:', data.metadata.totalEntries);
                console.log('生成时间:', data.metadata.generatedAt);
                console.log('文件大小:', fs.statSync(path).size, 'bytes');
            } catch (error) {
                console.error('解析统计信息失败:', error.message);
            }
        "
    fi
}

# 清理临时文件
cleanup() {
    log_info "清理临时文件..."
    
    # 删除原始下载文件（可选）
    if [ -f "$DATA_DIR/cc-cedict-raw.txt" ]; then
        read -p "是否删除原始下载文件? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rm "$DATA_DIR/cc-cedict-raw.txt"
            log_success "删除原始下载文件"
        fi
    fi
}

# 主函数
main() {
    echo "开始时间: $(date)"
    echo ""
    
    check_dependencies
    create_directories
    download_ccedict
    process_dictionary
    copy_to_api
    verify_files
    show_statistics
    cleanup
    
    echo ""
    echo "结束时间: $(date)"
    echo ""
    log_success "CC-CEDICT 词典文件设置完成！"
    echo ""
    echo "📋 下一步:"
    echo "1. 启动 API 服务器"
    echo "2. 在应用中测试词典下载功能"
    echo "3. 验证离线词典查询功能"
    echo ""
}

# 运行主函数
main "$@"
