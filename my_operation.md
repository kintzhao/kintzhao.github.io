1. 放入 quartz/static/xxx.html
2. 运行 npx quartz build
3. 访问 http://localhost:8080/static/xxx.html
4. git add & commit & push


lsof -ti:8080 | xargs -r kill -9 && echo "已终止占用端口的进程"