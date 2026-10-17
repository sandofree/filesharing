// 全局变量
let selectedFile = null;

// 便签状态
const NOTE_COLORS = ['yellow', 'green', 'blue', 'pink', 'purple'];
let notes = [];
let editingNoteId = null;
let selectedColor = 'yellow';

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
    initFileSection();
    initNoteSection();
}

/* ============================================================
   文件区
   ============================================================ */
function initFileSection() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const removeFileBtn = document.getElementById('removeFile');
    const uploadForm = document.getElementById('uploadForm');

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

/* ============================================================
   便签区
   ============================================================ */
function initNoteSection() {
    const noteInput = document.getElementById('noteInput');
    const addNoteBtn = document.getElementById('addNoteBtn');
    const noteList = document.getElementById('noteList');
    const noteFilter = document.getElementById('noteFilter');
    const colorPicker = document.getElementById('colorPicker');

    // 颜色选择
    colorPicker.addEventListener('click', function (e) {
        const swatch = e.target.closest('.color-swatch');
        if (!swatch) {
            return;
        }
        selectedColor = swatch.dataset.color;
        updateColorPicker();
    });

    // 贴便签
    addNoteBtn.addEventListener('click', createNote);

    // Ctrl / Cmd + Enter 快速贴
    noteInput.addEventListener('keydown', function (e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            createNote();
        }
    });

    // 便签墙用事件委托，避免把内容拼进 onclick 字符串
    noteList.addEventListener('click', handleNoteListClick);
    noteList.addEventListener('keydown', handleNoteListKeydown);

    // 筛选
    noteFilter.addEventListener('input', renderNotes);

    loadNotes();
}

// 刷新颜色选择器的选中态
function updateColorPicker() {
    document.querySelectorAll('.color-swatch').forEach(function (el) {
        el.setAttribute('aria-pressed', el.dataset.color === selectedColor ? 'true' : 'false');
    });
}

// 拉取便签列表
function loadNotes() {
    fetch('/notes')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                notes = data.notes;
                renderNotes();
            } else {
                showToast(data.message || '获取便签失败', 'error');
            }
        })
        .catch(error => {
            showToast('获取便签失败，请刷新重试', 'error');
            console.error('Load notes error:', error);
        });
}

// 新建便签
function createNote() {
    const noteInput = document.getElementById('noteInput');
    const addNoteBtn = document.getElementById('addNoteBtn');
    const content = noteInput.value.trim();

    if (!content) {
        showToast('便签内容不能为空', 'error');
        noteInput.focus();
        return;
    }

    const formData = new FormData();
    formData.append('content', content);
    formData.append('color', selectedColor);

    addNoteBtn.disabled = true;

    fetch('/notes', {
        method: 'POST',
        body: formData
    })
        .then(response => response.json())
        .then(data => {
            addNoteBtn.disabled = false;

            if (data.success) {
                noteInput.value = '';
                noteInput.focus();
                showToast(data.message || '便签已贴上', 'success');
                loadNotes();
            } else {
                showToast(data.message || '贴上失败', 'error');
            }
        })
        .catch(error => {
            addNoteBtn.disabled = false;
            showToast('贴上失败，请重试', 'error');
            console.error('Create note error:', error);
        });
}

// 渲染便签墙
function renderNotes() {
    const noteList = document.getElementById('noteList');
    const noteCount = document.getElementById('noteCount');
    const filterInput = document.getElementById('noteFilter');
    const keyword = filterInput.value.trim().toLowerCase();

    noteCount.textContent = notes.length ? ` · ${notes.length}` : '';

    if (notes.length === 0) {
        noteList.innerHTML = `
            <div class="empty-state note-empty">
                <div class="empty-icon">📌</div>
                <p>便签墙还是空的</p>
                <p class="empty-hint">在上面写点东西，贴上去吧</p>
            </div>
        `;
        return;
    }

    const visible = keyword
        ? notes.filter(note => note.content.toLowerCase().includes(keyword))
        : notes;

    if (visible.length === 0) {
        noteList.innerHTML = `
            <div class="empty-state note-empty">
                <div class="empty-icon">🔍</div>
                <p>没有匹配的便签</p>
                <p class="empty-hint">换个关键词试试</p>
            </div>
        `;
        return;
    }

    noteList.innerHTML = visible.map(renderNoteCard).join('');

    // 编辑态自动聚焦，光标落在末尾
    const editInput = noteList.querySelector('.note-editing .note-edit-input');
    if (editInput) {
        editInput.focus();
        editInput.setSelectionRange(editInput.value.length, editInput.value.length);
    }
}

// 单张便签的HTML
function renderNoteCard(note) {
    const pinned = note.pinned;
    const safeId = escapeHtml(note.id);

    if (note.id === editingNoteId) {
        return `
            <article class="note note-editing" data-id="${safeId}" data-color="${note.color}">
                <textarea class="note-edit-input" data-role="edit-input" spellcheck="false">${escapeHtml(note.content)}</textarea>
                <div class="note-actions">
                    <button type="button" class="note-btn" data-action="save">💾 保存</button>
                    <button type="button" class="note-btn" data-action="cancel">✕ 取消</button>
                    <span class="note-hint">Ctrl+Enter 保存 · Esc 取消</span>
                </div>
            </article>
        `;
    }

    return `
        <article class="note" data-id="${safeId}" data-color="${note.color}">
            ${pinned ? '<span class="note-pin" title="已置顶">📌</span>' : ''}
            <div class="note-body">${escapeHtml(note.content)}</div>
            <div class="note-meta">
                <span>${formatNoteTime(note.updated_at)}</span>
                <span>${note.content.length} 字</span>
            </div>
            <div class="note-actions">
                <button type="button" class="note-btn note-btn-main" data-action="copy" title="复制内容">📋 复制</button>
                <button type="button" class="note-btn" data-action="edit" title="编辑">✏️</button>
                <button type="button" class="note-btn" data-action="pin" title="${pinned ? '取消置顶' : '置顶'}">${pinned ? '📍' : '📌'}</button>
                <button type="button" class="note-btn" data-action="color" title="换个颜色">🎨</button>
                <button type="button" class="note-btn note-btn-danger" data-action="delete" title="删除">🗑️</button>
            </div>
        </article>
    `;
}

// 便签墙点击事件
function handleNoteListClick(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) {
        return;
    }

    const card = btn.closest('.note');
    if (!card) {
        return;
    }

    const id = card.dataset.id;

    switch (btn.dataset.action) {
        case 'copy':
            copyNote(id);
            break;
        case 'edit':
            editingNoteId = id;
            renderNotes();
            break;
        case 'save':
            saveNote(id, card.querySelector('[data-role="edit-input"]'));
            break;
        case 'cancel':
            editingNoteId = null;
            renderNotes();
            break;
        case 'pin':
            togglePin(id);
            break;
        case 'color':
            cycleColor(id);
            break;
        case 'delete':
            deleteNote(id);
            break;
        default:
            break;
    }
}

// 编辑态快捷键
function handleNoteListKeydown(e) {
    const input = e.target.closest('[data-role="edit-input"]');
    if (!input) {
        return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        saveNote(input.closest('.note').dataset.id, input);
    } else if (e.key === 'Escape') {
        e.preventDefault();
        editingNoteId = null;
        renderNotes();
    }
}

// 更新单条便签（只提交变化的字段）
function patchNote(id, fields) {
    const formData = new FormData();
    Object.keys(fields).forEach(function (key) {
        const value = fields[key];
        formData.append(key, typeof value === 'boolean' ? (value ? '1' : '0') : value);
    });

    return fetch(`/notes/${encodeURIComponent(id)}`, {
        method: 'POST',
        body: formData
    }).then(response => response.json());
}

// 保存编辑
function saveNote(id, input) {
    if (!input) {
        return;
    }

    const content = input.value.trim();
    if (!content) {
        showToast('便签内容不能为空', 'error');
        input.focus();
        return;
    }

    patchNote(id, { content: content })
        .then(data => {
            if (data.success) {
                editingNoteId = null;
                showToast('便签已保存', 'success');
                loadNotes();
            } else {
                showToast(data.message || '保存失败', 'error');
            }
        })
        .catch(error => {
            showToast('保存失败，请重试', 'error');
            console.error('Save note error:', error);
        });
}

// 置顶 / 取消置顶
function togglePin(id) {
    const note = notes.find(item => item.id === id);
    if (!note) {
        return;
    }

    patchNote(id, { pinned: !note.pinned })
        .then(data => {
            if (data.success) {
                showToast(data.note.pinned ? '已置顶' : '已取消置顶', 'success');
                loadNotes();
            } else {
                showToast(data.message || '操作失败', 'error');
            }
        })
        .catch(error => {
            showToast('操作失败，请重试', 'error');
            console.error('Pin note error:', error);
        });
}

// 循环切换颜色
function cycleColor(id) {
    const note = notes.find(item => item.id === id);
    if (!note) {
        return;
    }

    const next = NOTE_COLORS[(NOTE_COLORS.indexOf(note.color) + 1) % NOTE_COLORS.length];

    patchNote(id, { color: next })
        .then(data => {
            if (!data.success) {
                showToast(data.message || '换色失败', 'error');
            }
            loadNotes();
        })
        .catch(error => {
            showToast('换色失败，请重试', 'error');
            console.error('Color note error:', error);
        });
}

// 删除便签
function deleteNote(id) {
    const note = notes.find(item => item.id === id);
    const preview = note ? note.content.slice(0, 30) : '';
    const label = note && note.content.length > 30 ? `${preview}…` : preview;

    if (!confirm(`确定要删除这张便签吗？\n\n${label}`)) {
        return;
    }

    fetch(`/notes/${encodeURIComponent(id)}/delete`, {
        method: 'POST'
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showToast(data.message || '便签已删除', 'success');
                loadNotes();
            } else {
                showToast(data.message || '删除失败', 'error');
            }
        })
        .catch(error => {
            showToast('删除失败，请重试', 'error');
            console.error('Delete note error:', error);
        });
}

// 复制便签内容
function copyNote(id) {
    const note = notes.find(item => item.id === id);
    if (!note) {
        return;
    }

    const content = note.content;

    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(content)
            .then(() => showToast('便签内容已复制', 'success'))
            .catch(() => fallbackCopy(content));
        return;
    }

    fallbackCopy(content);
}

// 非安全上下文下的兜底复制
function fallbackCopy(content) {
    const textarea = document.createElement('textarea');
    textarea.value = content;
    textarea.setAttribute('readonly', 'readonly');
    textarea.style.position = 'fixed';
    textarea.style.top = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();

    try {
        document.execCommand('copy');
        showToast('便签内容已复制', 'success');
    } catch (error) {
        showToast('复制失败，请手动选中复制', 'error');
        console.error('Copy error:', error);
    }

    document.body.removeChild(textarea);
}

// 便签时间：近期用相对时间，超过一周显示日期
function formatNoteTime(iso) {
    const date = new Date(iso);
    if (isNaN(date.getTime())) {
        return iso || '';
    }

    const pad = n => String(n).padStart(2, '0');
    const diff = (Date.now() - date.getTime()) / 1000;

    if (diff >= 0 && diff < 60) {
        return '刚刚';
    }
    if (diff >= 0 && diff < 3600) {
        return `${Math.floor(diff / 60)} 分钟前`;
    }

    const sameDay = date.toDateString() === new Date().toDateString();
    if (sameDay) {
        return `今天 ${pad(date.getHours())}:${pad(date.getMinutes())}`;
    }
    if (diff >= 0 && diff < 86400 * 7) {
        return `${Math.floor(diff / 86400)} 天前`;
    }

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/* ============================================================
   通用
   ============================================================ */
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
