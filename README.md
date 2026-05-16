# 文件共享 Flask 应用

一个简单易用的文件共享 Web 应用，支持密码登录、文件上传下载和文本共享。特别适合在电脑和手机之间快速分享文件。

## 功能特性

- 🔐 **密码保护** — 单密码登录系统，保护文件安全
- 📤 **文件上传** — 支持点击选择和拖拽上传，最大 100MB
- 📥 **文件下载** — 一键下载已上传的文件，支持中文文件名
- 🗑️ **文件管理** — 可删除不需要的文件
- 📝 **文本共享** — 跨设备共享剪贴板文本，支持复制
- 📱 **响应式设计** — 完美适配电脑和手机屏幕
- 🎨 **现代化界面** — 简洁美观的用户界面，流畅的动画效果

## 技术栈

| 层级     | 技术                                    |
| -------- | --------------------------------------- |
| 后端     | Python 3.13+, Flask                     |
| 前端     | HTML5, CSS3 (原生, 无框架)              |
| 会话管理 | Flask-Session (文件系统存储)            |
| 包管理   | uv                                      |

## 项目结构

```
filesharing/
├── flask_app.py              # Flask 主应用 — 路由、业务逻辑
├── config.py                 # 应用配置 — 密钥、密码、上传路径
├── pyproject.toml            # 项目元数据和依赖声明
├── uv.lock                   # 依赖锁定文件
├── README.md                 # 项目文档
│
├── templates/
│   ├── login.html            # 登录页面
│   └── index.html            # 主页面（文件管理 + 文本共享）
│
├── static/
│   ├── css/
│   │   └── style.css         # 全局样式（823 行，含响应式）
│   └── js/
│       └── main.js           # 前端逻辑（385 行）
│
├── uploads/                  # 文件上传存储目录（自动创建）
├── shared_texts/
│   └── TEXT_SHARE_FILE.txt   # 共享文本存储文件（自动创建）
│
├── flask_session/            # 服务器端会话文件（自动创建）
└── .venv/                    # 虚拟环境（uv sync 生成）
```

## 快速开始

### 前置条件

- Python >= 3.13
- [uv](https://docs.astral.sh/uv/)（推荐）或 pip

### 安装与运行

```bash
# 克隆项目后进入目录
cd filesharing

# 安装依赖
uv sync

# 启动服务
uv run flask_app.py
```

服务启动后在浏览器访问 `http://127.0.0.1:5000` 即可使用。

### 使用 pip

```bash
python -m venv .venv
.venv\Scripts\activate     # Windows
# source .venv/bin/activate # macOS / Linux

pip install flask flask-session
python flask_app.py
```

## 配置

所有配置在 [`config.py`](config.py) 中定义。可通过环境变量覆盖：

| 配置项                | 默认值                                              | 环境变量              | 说明                     |
| --------------------- | --------------------------------------------------- | --------------------- | ------------------------ |
| `SECRET_KEY`          | `bws61kwyLrTm1gYVEcaOyf8ZF5Ys1AvI`                 | `SECRET_KEY`          | Flask 密钥，用于会话加密 |
| `PASSWORD`            | `13681129585`                                       | `FILESHARING_PASSWORD` | 登录密码                 |
| `UPLOAD_FOLDER`       | 项目根目录/uploads/                                 | —                     | 文件上传存储目录         |
| `MAX_CONTENT_LENGTH`  | 104857600（100 MB）                                 | —                     | 单文件大小上限           |
| `SESSION_TYPE`        | filesystem                                          | —                     | 会话存储方式             |

> **安全提醒**：生产环境务必通过环境变量设置 `SECRET_KEY` 和 `FILESHARING_PASSWORD`，不要使用代码中的默认值。

## API 接口

所有需要认证的接口返回 401 状态码及 `{"success": false, "message": "请先登录"}`。

### 页面路由

| 方法 | 路径        | 说明               |
| ---- | ----------- | ------------------ |
| GET  | `/`         | 主页（文件管理页） |
| GET  | `/login`    | 登录页面           |
| POST | `/login`    | 提交登录密码       |
| GET  | `/logout`   | 退出登录           |

### 文件管理 API

| 方法 | 路径                    | 说明                   |
| ---- | ----------------------- | ---------------------- |
| GET  | `/files`                | 获取文件列表（JSON）   |
| POST | `/upload`               | 上传文件               |
| GET  | `/download/<filename>`  | 下载文件               |
| POST | `/delete/<filename>`    | 删除文件               |

#### 上传文件

```http
POST /upload
Content-Type: multipart/form-data

file: <二进制文件>
```

响应：
```json
{"success": true, "message": "文件 xxx 上传成功！", "filename": "xxx"}
```

#### 获取文件列表

```http
GET /files
```

响应：
```json
{
  "success": true,
  "files": [
    {
      "name": "报告.pdf",
      "size": 2048000,
      "size_str": "2.0 MB",
      "mtime": "2026-05-16 10:30:00",
      "mtime_str": "2026-05-16 10:30:00"
    }
  ]
}
```

#### 下载文件

```http
GET /download/报告.pdf
```
返回文件二进制内容。使用 `Content-Disposition: attachment; filename*=utf-8''...` 确保中文文件名正确。

#### 删除文件

```http
POST /delete/报告.pdf
```

响应：
```json
{"success": true, "message": "文件 报告.pdf 删除成功！"}
```

### 文本共享 API

| 方法   | 路径          | 说明                     |
| ------ | ------------- | ------------------------ |
| POST   | `/share_text` | 共享文本（覆盖写入）     |
| GET    | `/get_text`   | 获取当前共享的文本内容   |

#### 共享文本

```http
POST /share_text
Content-Type: multipart/form-data

content: 要共享的文本内容
```

响应：
```json
{"success": true, "message": "文本共享成功！"}
```

#### 获取共享文本

```http
GET /get_text
```

响应：
```json
{"success": true, "content": "共享的文本内容"}
```

## 安全说明

- **单密码系统**：所有已登录用户共享同一权限级别，适合家庭或小团队内部使用
- **会话**：默认不设有效期，登录后持续有效直至退出或服务器重启
- **文件名安全**：后端 `secure_filename()` 过滤路径穿越字符和注入字符，保留 Unicode（含中文）
- **XSS 防护**：前端 `escapeHtml()` 对文件名做 HTML 转义，`escapeJs()` 对内联脚本参数做 JavaScript 转义
- **路径穿越**：下载和删除接口对文件名做安全处理，防止越权访问 uploads/ 之外的文件
- **HTTPS 建议**：若暴露在公网，建议在前置反向代理（nginx / Caddy）上终止 TLS

## 开发说明

### 启动模式

`flask_app.py` 末尾以 `debug=True` 启动，文件修改后自动重载。生产环境应移除 `debug=True`，用 WSGI 服务器（gunicorn / waitress）运行。

### 扩展思路

- **文件类型过滤**：在 `config.py` 添加 `ALLOWED_EXTENSIONS`，在 `upload_file()` 中校验文件后缀
- **多用户系统**：引入用户注册/登录，取代单密码
- **文件预览**：对接浏览器原生支持的图片、视频、PDF 预览
- **密码修改**：增加修改密码页面

## License

MIT
