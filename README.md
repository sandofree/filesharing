# 文件共享 Flask 应用

一个简单易用的文件共享Web应用，支持密码登录、文件上传和下载。特别适合在电脑和手机之间快速分享文件。

## 功能特性

- 🔐 **密码保护** - 简单的密码登录系统，保护文件安全
- 📤 **文件上传** - 支持拖拽上传，最大支持100MB文件
- 📥 **文件下载** - 一键下载已上传的文件
- 🗑️ **文件管理** - 可删除不需要的文件
- 📱 **响应式设计** - 完美适配电脑和手机屏幕
- 🎨 **现代化界面** - 简洁美观的用户界面

## 技术栈

- **后端**: Python Flask
- **前端**: HTML5, CSS3, JavaScript
- **会话管理**: Flask-Session

## 安装步骤

### 1. 克隆或下载项目

```bash
cd filesharing
```

### 2. 安装依赖

确保已安装 Python 3.8 或更高版本。

```bash
pip install -r requirements.txt
```

或者使用 pip 直接安装：

```bash
pip install flask flask-session
```

### 3. 配置密码（可选）

默认密码为 `admin123`。如需修改密码，请编辑 [`config.py`](config.py:15) 文件：

```python
PASSWORD = os.environ.get('FILESHARING_PASSWORD') or 'your-password-here'
```

或者使用环境变量：

```bash
# Windows
set FILESHARING_PASSWORD=your-password-here

# Linux/Mac
export FILESHARING_PASSWORD=your-password-here
```

## 运行应用

### 方法一：直接运行

```bash
python app.py
```

### 方法二：使用入口文件

```bash
python main.py
```

应用启动后，会显示以下信息：

```
文件共享服务启动中...
登录密码: admin123
上传目录: d:\work\filesharing\uploads
最大文件大小: 100 MB
允许的文件类型: txt, pdf, png, jpg, jpeg, gif, doc, docx, xls, xlsx, zip, rar, mp4, mp3, avi, mov

访问地址: http://127.0.0.1:5000
按 Ctrl+C 停止服务
```

## 使用说明

### 1. 访问应用

在浏览器中打开：`http://127.0.0.1:5000`

### 2. 登录

输入密码（默认：`admin123`）并点击登录

### 3. 上传文件

- **方法一**: 点击上传区域选择文件
- **方法二**: 将文件拖拽到上传区域

### 4. 下载文件

在文件列表中点击下载按钮（⬇️）即可下载文件

### 5. 删除文件

点击删除按钮（🗑️）可以删除不需要的文件

### 6. 退出登录

点击右上角的"退出"按钮退出登录

## 支持的文件类型

- 文档: txt, pdf, doc, docx, xls, xlsx
- 图片: png, jpg, jpeg, gif
- 压缩包: zip, rar
- 视频: mp4, avi, mov
- 音频: mp3

## 配置说明

所有配置都在 [`config.py`](config.py:1) 文件中：

| 配置项                       | 说明                 | 默认值    |
| ---------------------------- | -------------------- | --------- |
| `SECRET_KEY`                 | Flask密钥            | 自动生成  |
| `PASSWORD`                   | 登录密码             | admin123  |
| `UPLOAD_FOLDER`              | 文件上传目录         | ./uploads |
| `MAX_CONTENT_LENGTH`         | 最大文件大小（字节） | 100MB     |
| `ALLOWED_EXTENSIONS`         | 允许的文件扩展名     | 多种格式  |
| `PERMANENT_SESSION_LIFETIME` | 会话有效期（秒）     | 3600      |

## 局域网访问

如果需要在局域网内其他设备访问：

1. 确保防火墙允许5000端口
2. 查看本机IP地址（Windows: `ipconfig`, Linux/Mac: `ifconfig`）
3. 在其他设备浏览器访问：`http://你的IP地址:5000`

例如：`http://192.168.1.100:5000`

## 安全建议

⚠️ **重要提示**：

1. **修改默认密码** - 生产环境务必修改默认密码
2. **使用HTTPS** - 生产环境建议配置HTTPS
3. **限制访问** - 考虑使用防火墙限制访问IP
4. **定期备份** - 定期备份uploads目录中的文件
5. **文件验证** - 上传的文件可能包含恶意内容，下载后请谨慎处理

## 项目结构

```
filesharing/
├── app.py                 # Flask主应用
├── config.py              # 应用配置
├── main.py                # 入口文件
├── pyproject.toml         # 项目依赖
├── README.md              # 项目文档
├── .gitignore            # Git忽略文件
├── uploads/               # 文件上传目录
├── templates/             # HTML模板
│   ├── login.html         # 登录页面
│   └── index.html         # 主页面
└── static/                # 静态资源
    ├── css/
    │   └── style.css      # 样式文件
    └── js/
        └── main.js        # JavaScript文件
```

## 故障排除

### 端口被占用

如果5000端口被占用，可以修改 [`app.py`](app.py:160) 中的端口号：

```python
app.run(host='0.0.0.0', port=8080, debug=True)
```

### 文件上传失败

- 检查文件大小是否超过100MB
- 确认文件类型是否在允许列表中
- 检查uploads目录是否有写入权限

### 无法访问

- 确认应用正在运行
- 检查防火墙设置
- 尝试使用 `http://127.0.0.1:5000` 而不是 `http://localhost:5000`

## 许可证

MIT License

## 贡献

欢迎提交问题和改进建议！

## 更新日志

### v0.1.0 (2024-12-25)
- 初始版本发布
- 实现基本的文件上传、下载功能
- 添加密码登录系统
- 响应式设计支持移动端
