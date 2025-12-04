#!/usr/bin/env python3
"""
数据库迁移脚本：为 mcp_servers 表添加 image 字段
"""
import sqlite3
import os

# 数据库路径
DB_PATH = os.path.join(os.path.dirname(__file__), "mcp_platform.db")

def migrate():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # 检查 image 列是否已存在
        cursor.execute("PRAGMA table_info(mcp_servers)")
        columns = [col[1] for col in cursor.fetchall()]
        
        if 'image' not in columns:
            print("Adding 'image' column to mcp_servers table...")
            cursor.execute("""
                ALTER TABLE mcp_servers 
                ADD COLUMN image TEXT DEFAULT 'corp/mcp-base:latest'
            """)
            conn.commit()
            print("✓ Migration completed successfully!")
        else:
            print("✓ Column 'image' already exists, skipping migration.")
            
    except Exception as e:
        print(f"✗ Migration failed: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()

