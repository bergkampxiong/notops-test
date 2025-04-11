import json
import urllib.parse
import ldap
from typing import Dict, Any

def parse_ldap_url(url: str) -> Dict[str, Any]:
    """解析LDAP URL"""
    try:
        # 移除可能的ldap://或ldaps://前缀
        url = url.replace('ldap://', '').replace('ldaps://', '')
        
        # 分离主机和端口
        if ':' in url:
            host, port = url.split(':')
            port = int(port)
        else:
            host = url
            port = 389  # 默认LDAP端口
        
        return {
            'host': host,
            'port': port
        }
    except Exception as e:
        raise ValueError(f"无效的LDAP URL格式: {str(e)}")

def test_ldap_connection(server_url: str, bind_dn: str, bind_password: str, search_base: str, use_ssl: bool = False) -> Dict[str, Any]:
    """测试LDAP连接"""
    conn = None
    try:
        # 解析服务器地址
        server_info = parse_ldap_url(server_url)
        print(f"解析后的服务器信息:\n{json.dumps(server_info, indent=2, ensure_ascii=False)}")
        
        # 创建LDAP连接
        print("尝试创建LDAP连接...")
        if use_ssl:
            conn = ldap.initialize(f"ldaps://{server_info['host']}:{server_info['port']}")
            conn.set_option(ldap.OPT_X_TLS_REQUIRE_CERT, ldap.OPT_X_TLS_NEVER)
        else:
            conn = ldap.initialize(f"ldap://{server_info['host']}:{server_info['port']}")
        
        # 设置连接选项
        conn.set_option(ldap.OPT_REFERRALS, 0)
        conn.set_option(ldap.OPT_PROTOCOL_VERSION, 3)
        
        print("LDAP连接对象创建成功")
        
        # 尝试绑定
        print("尝试LDAP绑定...")
        conn.simple_bind_s(bind_dn, bind_password)
        print("LDAP绑定成功")
        
        # 测试搜索
        print("尝试LDAP搜索...")
        search_filter = '(objectClass=*)'
        search_scope = ldap.SCOPE_BASE
        search_attrs = ['objectClass']
        
        result = conn.search_s(
            search_base,
            search_scope,
            search_filter,
            search_attrs
        )
        
        print("LDAP搜索成功")
        
        return {
            "status": "success",
            "message": "LDAP连接测试成功",
            "details": {
                "server": {
                    "host": server_info['host'],
                    "port": server_info['port']
                },
                "bind_dn": bind_dn,
                "search_base": search_base,
                "use_ssl": use_ssl
            }
        }
        
    except ldap.INVALID_CREDENTIALS:
        error_msg = "LDAP认证失败：用户名或密码错误"
        print(f"LDAP错误: {error_msg}")
        return {
            "status": "error",
            "message": error_msg,
            "details": {
                "error": error_msg,
                "suggestion": "请检查绑定DN和密码是否正确"
            }
        }
        
    except ldap.SERVER_DOWN:
        error_msg = "LDAP连接被拒绝"
        print(f"LDAP错误: {error_msg}")
        return {
            "status": "error",
            "message": error_msg,
            "details": {
                "error": error_msg,
                "suggestion": "请检查服务器地址和端口是否正确，以及网络连接和防火墙设置"
            }
        }
        
    except Exception as e:
        error_msg = str(e)
        print(f"未知错误: {error_msg}")
        return {
            "status": "error",
            "message": f"发生未知错误：{error_msg}",
            "details": {
                "error": error_msg,
                "suggestion": "请检查系统日志获取更多信息"
            }
        }
        
    finally:
        if conn:
            print("尝试关闭LDAP连接...")
            conn.unbind_s()
            print("LDAP连接已关闭") 