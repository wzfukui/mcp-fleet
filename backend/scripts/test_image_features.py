#!/usr/bin/env python3
"""
MCP Fleet 基础镜像功能测试脚本
用于验证镜像中各项功能是否正常工作
"""

import sys

def test_database_drivers():
    """测试数据库驱动"""
    print("\n" + "="*50)
    print("测试数据库驱动")
    print("="*50)
    
    tests = {
        'MySQL (pymysql)': lambda: __import__('pymysql'),
        'MySQL (mysqlclient)': lambda: __import__('MySQLdb'),
        'PostgreSQL': lambda: __import__('psycopg2'),
        'Redis': lambda: __import__('redis'),
        'MongoDB': lambda: __import__('pymongo'),
        'Elasticsearch': lambda: __import__('elasticsearch'),
    }
    
    for name, test_func in tests.items():
        try:
            test_func()
            print(f"✓ {name}")
        except ImportError as e:
            print(f"✗ {name}: {e}")
            return False
    
    return True


def test_network_tools():
    """测试网络工具"""
    print("\n" + "="*50)
    print("测试网络工具")
    print("="*50)
    
    tests = {
        'SSH (paramiko)': lambda: __import__('paramiko'),
        'Netmiko': lambda: __import__('netmiko'),
        'Pexpect': lambda: __import__('pexpect'),
        'Telnet': lambda: __import__('telnetlib3'),
        'SNMP': lambda: __import__('pysnmp_lextudio'),
        'SFTP': lambda: __import__('pysftp'),
    }
    
    for name, test_func in tests.items():
        try:
            test_func()
            print(f"✓ {name}")
        except ImportError as e:
            print(f"✗ {name}: {e}")
            return False
    
    return True


def test_web_parsing():
    """测试网页解析工具"""
    print("\n" + "="*50)
    print("测试网页解析工具")
    print("="*50)
    
    tests = {
        'BeautifulSoup': lambda: __import__('bs4'),
        'lxml': lambda: __import__('lxml'),
        'html5lib': lambda: __import__('html5lib'),
        'pyquery': lambda: __import__('pyquery'),
        'requests': lambda: __import__('requests'),
        'httpx': lambda: __import__('httpx'),
        'aiohttp': lambda: __import__('aiohttp'),
    }
    
    for name, test_func in tests.items():
        try:
            test_func()
            print(f"✓ {name}")
        except ImportError as e:
            print(f"✗ {name}: {e}")
            return False
    
    return True


def test_data_processing():
    """测试数据处理工具"""
    print("\n" + "="*50)
    print("测试数据处理工具")
    print("="*50)
    
    tests = {
        'JSON (orjson)': lambda: __import__('orjson'),
        'JSON Schema': lambda: __import__('jsonschema'),
        'XML (xmltodict)': lambda: __import__('xmltodict'),
        'XML (defusedxml)': lambda: __import__('defusedxml'),
        'YAML': lambda: __import__('yaml'),
        'TOML': lambda: __import__('toml'),
        'Pandas': lambda: __import__('pandas'),
        'Excel (openpyxl)': lambda: __import__('openpyxl'),
        'Excel (xlrd)': lambda: __import__('xlrd'),
        'Encoding (chardet)': lambda: __import__('chardet'),
        'Date (arrow)': lambda: __import__('arrow'),
    }
    
    for name, test_func in tests.items():
        try:
            test_func()
            print(f"✓ {name}")
        except ImportError as e:
            print(f"✗ {name}: {e}")
            return False
    
    return True


def test_enterprise_tools():
    """测试企业集成工具"""
    print("\n" + "="*50)
    print("测试企业集成工具")
    print("="*50)
    
    tests = {
        'LDAP': lambda: __import__('ldap'),
        'Cisco Config Parse': lambda: __import__('ciscoconfparse'),
        'Jinja2': lambda: __import__('jinja2'),
        'Cryptography': lambda: __import__('cryptography'),
    }
    
    for name, test_func in tests.items():
        try:
            test_func()
            print(f"✓ {name}")
        except ImportError as e:
            print(f"✗ {name}: {e}")
            return False
    
    return True


def test_html_parsing_demo():
    """演示 HTML 解析功能"""
    print("\n" + "="*50)
    print("HTML 解析功能演示")
    print("="*50)
    
    try:
        from bs4 import BeautifulSoup
        
        html = """
        <html>
            <body>
                <div class="device">
                    <h1>防火墙设备</h1>
                    <table>
                        <tr><td>IP</td><td>192.168.1.1</td></tr>
                        <tr><td>状态</td><td>在线</td></tr>
                    </table>
                </div>
            </body>
        </html>
        """
        
        # 使用 lxml 解析器
        soup = BeautifulSoup(html, 'lxml')
        device_name = soup.find('h1').text
        rows = soup.find_all('tr')
        
        print(f"✓ 成功解析 HTML")
        print(f"  设备名称: {device_name}")
        print(f"  表格行数: {len(rows)}")
        
        return True
    except Exception as e:
        print(f"✗ HTML 解析失败: {e}")
        return False


def test_json_processing_demo():
    """演示 JSON 处理功能"""
    print("\n" + "="*50)
    print("JSON 处理功能演示")
    print("="*50)
    
    try:
        import orjson
        
        data = {
            "device": "firewall-01",
            "events": [
                {"time": "2024-01-01", "level": "high"},
                {"time": "2024-01-02", "level": "low"}
            ]
        }
        
        # 序列化
        json_bytes = orjson.dumps(data)
        
        # 反序列化
        parsed = orjson.loads(json_bytes)
        
        print(f"✓ JSON 处理成功")
        print(f"  设备: {parsed['device']}")
        print(f"  事件数: {len(parsed['events'])}")
        
        return True
    except Exception as e:
        print(f"✗ JSON 处理失败: {e}")
        return False


def test_encoding_detection_demo():
    """演示编码检测功能"""
    print("\n" + "="*50)
    print("编码检测功能演示")
    print("="*50)
    
    try:
        import chardet
        
        # 模拟 GBK 编码的数据
        text = "防火墙配置文件"
        gbk_bytes = text.encode('gbk')
        
        # 检测编码
        result = chardet.detect(gbk_bytes)
        
        print(f"✓ 编码检测成功")
        print(f"  检测到的编码: {result['encoding']}")
        print(f"  置信度: {result['confidence']:.2%}")
        
        return True
    except Exception as e:
        print(f"✗ 编码检测失败: {e}")
        return False


def main():
    """主测试函数"""
    print("\n" + "="*60)
    print("MCP Fleet 基础镜像功能测试")
    print("="*60)
    
    # 显示 Python 版本
    print(f"\nPython 版本: {sys.version}")
    
    # 运行所有测试
    tests = [
        ("数据库驱动", test_database_drivers),
        ("网络工具", test_network_tools),
        ("网页解析", test_web_parsing),
        ("数据处理", test_data_processing),
        ("企业工具", test_enterprise_tools),
        ("HTML 解析演示", test_html_parsing_demo),
        ("JSON 处理演示", test_json_processing_demo),
        ("编码检测演示", test_encoding_detection_demo),
    ]
    
    results = []
    for name, test_func in tests:
        try:
            result = test_func()
            results.append((name, result))
        except Exception as e:
            print(f"\n✗ {name} 测试异常: {e}")
            results.append((name, False))
    
    # 显示测试总结
    print("\n" + "="*60)
    print("测试总结")
    print("="*60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "✓ 通过" if result else "✗ 失败"
        print(f"{status}: {name}")
    
    print(f"\n总计: {passed}/{total} 测试通过")
    
    if passed == total:
        print("\n🎉 所有测试通过！镜像功能正常。")
        return 0
    else:
        print(f"\n⚠️  有 {total - passed} 个测试失败，请检查镜像构建。")
        return 1


if __name__ == "__main__":
    sys.exit(main())

