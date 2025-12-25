"""
应用配置文件
"""
import os

# 基础配置
class Config:
    # 应用密钥，用于会话加密
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'bws61kwyLrTm1gYVEcaOyf8ZF5Ys1AvI'
    
    # 登录密码（生产环境应使用环境变量）
    PASSWORD = os.environ.get('FILESHARING_PASSWORD') or '13681129585'
    
    # 上传文件配置
    UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
    MAX_CONTENT_LENGTH = 100 * 1024 * 1024  # 最大文件大小：100MB
    
    # 会话配置
    SESSION_TYPE = 'filesystem'
    SESSION_PERMANENT = True
    #PERMANENT_SESSION_LIFETIME = 3600  # 会话有效期：1小时（秒）
