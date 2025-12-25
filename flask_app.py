"""
文件共享Flask应用
支持密码登录、文件上传、下载和删除
支持文本共享功能
"""
from flask import Flask, render_template, request, redirect, url_for, send_from_directory, session, flash, jsonify
from flask_session import Session
from werkzeug.utils import secure_filename
import os
from datetime import datetime
from config import Config

app = Flask(__name__)
app.config.from_object(Config)

# 初始化Flask-Session
Session(app)

# 确保上传目录存在
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# 文本共享文件
TEXT_SHARE_FILE = os.path.join(os.path.dirname(__file__), 'shared_texts', 'TEXT_SHARE_FILE.txt')
os.makedirs(os.path.dirname(TEXT_SHARE_FILE), exist_ok=True)


def get_file_info(filepath):
    """获取文件信息"""
    stat = os.stat(filepath)
    size = stat.st_size
    mtime = datetime.fromtimestamp(stat.st_mtime)
    
    # 格式化文件大小
    if size < 1024:
        size_str = f"{size} B"
    elif size < 1024 * 1024:
        size_str = f"{size / 1024:.1f} KB"
    elif size < 1024 * 1024 * 1024:
        size_str = f"{size / (1024 * 1024):.1f} MB"
    else:
        size_str = f"{size / (1024 * 1024 * 1024):.1f} GB"
    
    return {
        'name': os.path.basename(filepath),
        'size': size,
        'size_str': size_str,
        'mtime': mtime,
        'mtime_str': mtime.strftime('%Y-%m-%d %H:%M:%S')
    }

def get_files():
    files = []
    upload_folder = app.config['UPLOAD_FOLDER']
    if os.path.exists(upload_folder):
        for filename in os.listdir(upload_folder):
            if not filename.startswith('.'):
                filepath = os.path.join(upload_folder, filename)
                if os.path.isfile(filepath):
                    file_info = get_file_info(filepath)
                    files.append(file_info)
        
        files.sort(key=lambda x: x['mtime'], reverse=True)

    return files

def get_shared_text():
    """获取共享文本内容"""
    if os.path.exists(TEXT_SHARE_FILE):
        with open(TEXT_SHARE_FILE, 'r', encoding='utf-8') as f:
            return f.read()
    return ''

@app.route('/')
def index():
    """主页路由"""
    if 'logged_in' not in session:
        return redirect(url_for('login'))
    
    return render_template('index.html', files=get_files())


@app.route('/login', methods=['GET', 'POST'])
def login():
    """登录路由"""
    if request.method == 'POST':
        password = request.form.get('password')
        if password == app.config['PASSWORD']:
            session['logged_in'] = True
            flash('登录成功！', 'success')
            return redirect(url_for('index'))
        else:
            flash('密码错误，请重试！', 'error')
    
    return render_template('login.html')


@app.route('/logout')
def logout():
    """退出登录"""
    session.pop('logged_in', None)
    flash('已退出登录！', 'info')
    return redirect(url_for('login'))


@app.route('/upload', methods=['POST'])
def upload_file():
    """文件上传路由"""
    if 'logged_in' not in session:
        return jsonify({'success': False, 'message': '请先登录'}), 401
    
    if 'file' not in request.files:
        return jsonify({'success': False, 'message': '没有选择文件'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'success': False, 'message': '没有选择文件'}), 400
    
    if file and file.filename:
        filename = secure_filename(file.filename)
        
        # 处理文件名冲突
        base, ext = os.path.splitext(filename)
        counter = 1
        while os.path.exists(os.path.join(app.config['UPLOAD_FOLDER'], filename)):
            filename = f"{base}_{counter}{ext}"
            counter += 1
        
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        return jsonify({
            'success': True,
            'message': f'文件 {filename} 上传成功！',
            'filename': filename
        })
    else:
        return jsonify({
            'success': False,
            'message': f'不支持的文件类型。允许的类型：{", ".join(app.config["ALLOWED_EXTENSIONS"])}'
        }), 400


@app.route('/download/<filename>')
def download_file(filename):
    """文件下载路由"""
    if 'logged_in' not in session:
        flash('请先登录！', 'error')
        return redirect(url_for('login'))
    
    return send_from_directory(
        app.config['UPLOAD_FOLDER'],
        filename,
        as_attachment=True
    )


@app.route('/delete/<filename>', methods=['POST'])
def delete_file(filename):
    """文件删除路由"""
    if 'logged_in' not in session:
        return jsonify({'success': False, 'message': '请先登录'}), 401
    
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    
    if os.path.exists(filepath) and os.path.isfile(filepath):
        os.remove(filepath)
        return jsonify({
            'success': True,
            'message': f'文件 {filename} 删除成功！'
        })
    else:
        return jsonify({
            'success': False,
            'message': '文件不存在'
        }), 404


@app.route('/files')
def list_files():
    """获取文件列表API"""
    if 'logged_in' not in session:
        return jsonify({'success': False, 'message': '请先登录'}), 401
        
    return jsonify({'success': True, 'files': get_files()})


@app.route('/share_text', methods=['POST'])
def share_text():
    """共享文本路由"""
    if 'logged_in' not in session:
        return jsonify({'success': False, 'message': '请先登录'}), 401
    
    content = request.form.get('content', '').strip()
    
    if not content:
        return jsonify({'success': False, 'message': '文本内容不能为空'}), 400
    
    # 保存文本到单个文件
    with open(TEXT_SHARE_FILE, 'w', encoding='utf-8') as f:
        f.write(content)
    
    return jsonify({
        'success': True,
        'message': '文本共享成功！'
    })


@app.route('/get_text')
def get_text():
    """获取共享文本内容"""
    if 'logged_in' not in session:
        return jsonify({'success': False, 'message': '请先登录'}), 401
    
    content = get_shared_text()
    return jsonify({'success': True, 'content': content})


if __name__ == '__main__':
    print(f"文件共享服务启动中...")
    print(f"登录密码: {app.config['PASSWORD']}")
    print(f"上传目录: {app.config['UPLOAD_FOLDER']}")
    print(f"文本共享文件: {TEXT_SHARE_FILE}")
    print(f"最大文件大小: {app.config['MAX_CONTENT_LENGTH'] / (1024*1024):.0f} MB")
    print(f"\n访问地址: http://127.0.0.1:5000")
    print(f"按 Ctrl+C 停止服务\n")
    
    app.run(host='0.0.0.0', port=5000, debug=True)
