#!/usr/bin/env python3
"""
数据库迁移脚本
添加 ports 和 host_ports 字段到 mcp_servers 表
"""
import sqlite3
import os
import sys

def get_db_path():
    """获取数据库路径"""
    # 尝试生产环境路径
    prod_path = "/opt/mcp-platform/data/mcp_platform.db"
    if os.path.exists(prod_path):
        return prod_path
    
    # 开发环境路径
    dev_path = os.path.join(os.path.dirname(__file__), "mcp_data", "mcp_platform.db")
    if os.path.exists(dev_path):
        return dev_path
    
    # 检查当前目录
    current_path = "mcp_platform.db"
    if os.path.exists(current_path):
        return current_path
    
    print("❌ 未找到数据库文件")
    print(f"   尝试的路径:")
    print(f"   - {prod_path}")
    print(f"   - {dev_path}")
    print(f"   - {current_path}")
    return None

def check_column_exists(cursor, table_name, column_name):
    """检查列是否存在"""
    cursor.execute(f"PRAGMA table_info({table_name})")
    columns = [row[1] for row in cursor.fetchall()]
    return column_name in columns

def migrate_database(db_path):
    """执行数据库迁移"""
    print(f"📁 数据库路径: {db_path}")
    
    # 备份数据库
    backup_path = db_path + ".backup"
    if not os.path.exists(backup_path):
        import shutil
        shutil.copy2(db_path, backup_path)
        print(f"✅ 已创建备份: {backup_path}")
    else:
        print(f"ℹ️  备份已存在: {backup_path}")
    
    # 连接数据库
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # 检查并添加 ports 字段
        if not check_column_exists(cursor, 'mcp_servers', 'ports'):
            print("➕ 添加 ports 字段...")
            cursor.execute("ALTER TABLE mcp_servers ADD COLUMN ports TEXT")
            print("✅ ports 字段添加成功")
        else:
            print("ℹ️  ports 字段已存在")
        
        # 检查并添加 host_ports 字段
        if not check_column_exists(cursor, 'mcp_servers', 'host_ports'):
            print("➕ 添加 host_ports 字段...")
            cursor.execute("ALTER TABLE mcp_servers ADD COLUMN host_ports TEXT")
            print("✅ host_ports 字段添加成功")
        else:
            print("ℹ️  host_ports 字段已存在")
        
        # 迁移旧的 port 数据到 ports 字段（如果存在）
        if check_column_exists(cursor, 'mcp_servers', 'port'):
            print("🔄 迁移旧的 port 数据到 ports 字段...")
            cursor.execute("""
                UPDATE mcp_servers 
                SET ports = CAST(port AS TEXT) 
                WHERE port IS NOT NULL AND (ports IS NULL OR ports = '')
            """)
            affected = cursor.rowcount
            if affected > 0:
                print(f"✅ 已迁移 {affected} 条记录")
            else:
                print("ℹ️  没有需要迁移的数据")
        
        # 提交更改
        conn.commit()
        print("\n✅ 数据库迁移完成！")
        
        # 显示当前表结构
        print("\n📋 当前 mcp_servers 表结构:")
        cursor.execute("PRAGMA table_info(mcp_servers)")
        for row in cursor.fetchall():
            col_id, name, col_type, not_null, default, pk = row
            print(f"   - {name} ({col_type})")
        
    except Exception as e:
        print(f"\n❌ 迁移失败: {e}")
        conn.rollback()
        sys.exit(1)
    finally:
        conn.close()

def main():
    print("=" * 60)
    print("🔧 MCP Fleet 数据库迁移工具")
    print("=" * 60)
    print()
    
    db_path = get_db_path()
    if not db_path:
        sys.exit(1)
    
    migrate_database(db_path)
    
    print()
    print("=" * 60)
    print("✨ 迁移完成！请重启后端服务")
    print("=" * 60)

if __name__ == "__main__":
    main()

