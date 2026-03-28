1. 放入 quartz/static/xxx.html
2. 运行 npx quartz build
3. 访问 http://localhost:8080/static/xxx.html
4. git add & commit & push


lsof -ti:8080 | xargs -r kill -9 && echo "已终止占用端口的进程"



==================

新增 HTML 静态文件操作指南
第一步：放入源目录
cp /path/to/your-file.html /home/robot/ai_doc/web/kintzhao.github.io/quartz/static/

第二步：重新构建
cd /home/robot/ai_doc/web/kintzhao.github.io
npx quartz build

第三步：添加主页链接（可选）
编辑 content/index.md，在"特色资源"表格中添加：
| [显示名称](/static/your-file.html) | 简短描述 |

第四步：提交到 Git

git add quartz/static/your-file.html
git commit -m "添加 XXX 静态页面"
git push


快捷脚本（可选）

# 一键添加静态文件
add_static() {
  local file=$1
  local name=$(basename "$file")
  cp "$file" /home/robot/ai_doc/web/kintzhao.github.io/quartz/static/
  cd /home/robot/ai_doc/web/kintzhao.github.io
  npx quartz build
  git add quartz/static/"$name"
  git commit -m "添加静态文件: $name"
  git push
  echo "✅ 访问地址: http://localhost:8080/static/$name"
}

# 使用示例
# add_static /path/to/new-page.html
访问地址规则
文件位置	访问 URL
quartz/static/xxx.html	http://localhost:8080/static/xxx.html
quartz/static/sub/yyy.pdf	http://localhost:8080/static/sub/yyy.pdf

