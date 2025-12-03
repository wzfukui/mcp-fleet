import requests

def test_login():
    url = "http://localhost:8000/api/auth/token"
    
    # 1. Try with multipart/form-data (like frontend currently does)
    print("Test 1: multipart/form-data")
    try:
        files = {
            'username': (None, 'admin'),
            'password': (None, 'admin123')
        }
        res = requests.post(url, files=files)
        print(f"Status: {res.status_code}")
        print(f"Response: {res.text}")
    except Exception as e:
        print(f"Error: {e}")

    # 2. Try with application/x-www-form-urlencoded (Standard OAuth2)
    print("\nTest 2: application/x-www-form-urlencoded")
    try:
        data = {
            'username': 'admin',
            'password': 'admin123'
        }
        res = requests.post(url, data=data)
        print(f"Status: {res.status_code}")
        print(f"Response: {res.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_login()

