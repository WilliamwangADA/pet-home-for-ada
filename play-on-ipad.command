#!/bin/bash
# 在 Mac 上起个小服务器，iPad 连同一个 Wi-Fi 就能打开（改完代码不用 push 就能试）
cd "$(dirname "$0")"
IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1)
echo "iPad Safari 打开: http://$IP:8080/index.html"
# 注意：别用 python3 -m http.server —— 它是单线程的，浏览器并行拉十几个文件时
# 会卡在那儿半天出不来（一度以为是游戏慢，其实是这个服务器）。
python3 - 8080 <<'PY'
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
ThreadingHTTPServer(('0.0.0.0', int(sys.argv[1])), SimpleHTTPRequestHandler).serve_forever()
PY
