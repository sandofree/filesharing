// 全局变量
let selectedFile = null;

// DOM加载完成后执行
document.addEventListener('DOMContentLoaded', function () {
    // 如果在登录页面
    const loginForm = document.querySelector('.login-form');
    if (loginForm) {
        initLoginPage();
    }

    // 如果在主页面
    const uploadForm = document.getElementById('uploadForm');
    if (uploadForm) {
        initMainPage();
    }
});

// 初始化登录页面
function initLoginPage() {
    const passwordInput = document.getElementById('password');

    // 支持回车键提交
    passwordInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            passwordInput.closest('form').submit();
        }
    });
}

// 初始化主页面
function initMainPage() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const uploadBtn = document.getElementById('uploadBtn');
    const removeFileBtn = document.getElementById('removeFile');
    const refreshBtn = document.getElementById('refreshBtn');
    const textShareForm = document.getElementById('textShareForm');

    // 点击上传区域触发文件选择
    uploadArea.addEventListener('click', function () {
        fileInput.click();
    });

    // 文件选择事件
    fileInput.addEventListener('change', function (e) {
        handleFileSelect(e.target.files[0]);
    });

    // 拖拽上传
    uploadArea.addEventListener('dragover', function (e) {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', function (e) {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', function (e) {
        e.preventDefault();
        uploadArea.classList.remove('dragover');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    });

    // 移除选中的文件
    removeFileBtn.addEventListener('click', function () {
        clearSelectedFile();
    });

    // 上传表单提交
    uploadForm.addEventListener('submit', function (e) {
        e.preventDefault();
        uploadFile();
    });

    // 刷新文件列表
    refreshBtn.addEventListener('click', function () {
        refreshFileList();
    });

    // 文本共享表单提交
    if (textShareForm) {
        textShareForm.addEventListener('submit', function (e) {
            e.preventDefault();
            shareText();
        });
    }

    // 加载当前共享的文本
    loadSharedText();
}

// 处理文件选择
function handleFileSelect(file) {
    if (!file) {
        clearSelectedFile();
        return;
    }

    selectedFile = file;

    const selectedFileDiv = document.getElementById('selectedFile');
    const fileNameSpan = document.getElementById('fileName');
    const uploadBtn = document.getElementById('uploadBtn');

    fileNameSpan.textContent = file.name;
    selectedFileDiv.style.display = 'flex';
    uploadBtn.disabled = false;

    // 检查文件大小
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
        showToast('文件大小超过100MB限制', 'error');
        clearSelectedFile();
    }
}

// 清除选中的文件
function clearSelectedFile() {
    selectedFile = null;

    const fileInput = document.getElementById('fileInput');
    const selectedFileDiv = document.getElementById('selectedFile');
    const uploadBtn = document.getElementById('uploadBtn');

    fileInput.value = '';
    selectedFileDiv.style.display = 'none';
    uploadBtn.disabled = true;
}

// 上传文件
function uploadFile() {
    if (!selectedFile) {
        showToast('请先选择文件', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    showLoading(true);

    fetch('/upload', {
        method: 'POST',
        body: formData
    })
        .then(response => response.json())
        .then(data => {
            showLoading(false);

            if (data.success) {
                showToast(data.message, 'success');
                clearSelectedFile();
                refreshFileList();
            } else {
                showToast(data.message, 'error');
            }
        })
        .catch(error => {
            showLoading(false);
            showToast('上传失败，请重试', 'error');
            console.error('Upload error:', error);
        });
}

// 删除文件
function deleteFile(filename) {
    if (!confirm(`确定要删除文件 "${filename}" 吗？`)) {
        return;
    }

    showLoading(true);

    fetch(`/delete/${filename}`, {
        method: 'POST'
    })
        .then(response => response.json())
        .then(data => {
            showLoading(false);

            if (data.success) {
                showToast(data.message, 'success');
                refreshFileList();
            } else {
                showToast(data.message, 'error');
            }
        })
        .catch(error => {
            showLoading(false);
            showToast('删除失败，请重试', 'error');
            console.error('Delete error:', error);
        });
}

// 刷新文件列表
function refreshFileList() {
    showLoading(true);

    fetch('/files')
        .then(response => response.json())
        .then(data => {
            showLoading(false);

            if (data.success) {
                updateFileList(data.files);
            } else {
                showToast('获取文件列表失败', 'error');
            }
        })
        .catch(error => {
            showLoading(false);
            showToast('刷新失败，请重试', 'error');
            console.error('Refresh error:', error);
        });
}

// 更新文件列表UI
function updateFileList(files) {
    const fileList = document.getElementById('fileList');

    if (files.length === 0) {
        fileList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📭</div>
                <p>暂无文件</p>
                <p class="empty-hint">上传文件后即可在此处查看</p>
            </div>
        `;
        return;
    }

    fileList.innerHTML = files.map(file => `
        <div class="file-item" data-filename="${file.name}">
            <div class="file-icon">📄</div>
            <div class="file-info">
                <div class="file-name">${escapeHtml(file.name)}</div>
                <div class="file-meta">
                    <span class="file-size">${file.size_str}</span>
                    <span class="file-time">${file.mtime_str}</span>
                </div>
            </div>
            <div class="file-actions">
                <a href="/download/${encodeURIComponent(file.name)}" 
                   class="btn btn-download btn-sm"
                   title="下载">
                    ⬇️
                </a>
                <button class="btn btn-delete btn-sm"
                        onclick="deleteFile('${escapeJs(file.name)}')"
                        title="删除">
                    🗑️
                </button>
            </div>
        </div>
    `).join('');
}

// 显示Toast消息
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');

    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// 显示/隐藏加载遮罩
function showLoading(show) {
    const loadingOverlay = document.getElementById('loadingOverlay');
    loadingOverlay.style.display = show ? 'flex' : 'none';
}

// HTML转义（防止XSS）
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// JavaScript字符串转义
function escapeJs(text) {
    return text
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r');
}

// 加载共享文本
function loadSharedText() {
    fetch('/get_text')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const contentInput = document.getElementById('textContent');
                if (contentInput) {
                    contentInput.value = data.content;
                }
            }
        })
        .catch(error => {
            console.error('Load text error:', error);
        });
}

// 共享文本
function shareText() {
    const contentInput = document.getElementById('textContent');
    const content = contentInput.value.trim();

    if (!content) {
        showToast('文本内容不能为空', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('content', content);

    showLoading(true);

    fetch('/share_text', {
        method: 'POST',
        body: formData
    })
        .then(response => response.json())
        .then(data => {
            showLoading(false);

            if (data.success) {
                showToast(data.message, 'success');
            } else {
                showToast(data.message, 'error');
            }
        })
        .catch(error => {
            showLoading(false);
            showToast('共享失败，请重试', 'error');
            console.error('Share text error:', error);
        });
}
