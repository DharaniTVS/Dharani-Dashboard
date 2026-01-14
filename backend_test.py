import requests
import sys
import json
from datetime import datetime

class DharaniTVSAPITester:
    def __init__(self, base_url="https://tvs-command-hub.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, auth_required=False):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if auth_required and self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, dict) and len(str(response_data)) < 500:
                        print(f"   Response: {response_data}")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                self.failed_tests.append({
                    'test': name,
                    'endpoint': endpoint,
                    'expected': expected_status,
                    'actual': response.status_code,
                    'error': response.text[:200]
                })
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append({
                'test': name,
                'endpoint': endpoint,
                'error': str(e)
            })
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root API", "GET", "", 200)

    def test_send_otp(self, phone="+919876543210"):
        """Test send OTP (demo mode)"""
        return self.run_test(
            "Send OTP",
            "POST",
            "auth/send-otp",
            200,
            data={"phone": phone}
        )

    def test_verify_otp(self, phone="+919876543210", code="123456"):
        """Test verify OTP and get token (demo mode)"""
        success, response = self.run_test(
            "Verify OTP",
            "POST",
            "auth/verify-otp",
            200,
            data={
                "phone": phone,
                "code": code,
                "name": "Test User",
                "role": "owner"
            }
        )
        if success and 'access_token' in response:
            self.token = response['access_token']
            print(f"   Token obtained: {self.token[:20]}...")
            return True
        return False

    def test_get_me(self):
        """Test get current user info"""
        return self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200,
            auth_required=True
        )

    def test_dashboard_overview(self):
        """Test dashboard overview"""
        return self.run_test(
            "Dashboard Overview",
            "GET",
            "dashboard/overview",
            200,
            auth_required=True
        )

    def test_sales_executives(self):
        """Test sales executives performance"""
        return self.run_test(
            "Sales Executives",
            "GET",
            "sales/executives",
            200,
            auth_required=True
        )

    def test_service_technicians(self):
        """Test service technicians performance"""
        return self.run_test(
            "Service Technicians",
            "GET",
            "service/technicians",
            200,
            auth_required=True
        )

    def test_ai_chat(self):
        """Test AI chat interface"""
        return self.run_test(
            "AI Chat",
            "POST",
            "ai/chat",
            200,
            data={"message": "Which branch is performing best?"},
            auth_required=True
        )

    def test_commitments_today(self):
        """Test today's commitments"""
        return self.run_test(
            "Today's Commitments",
            "GET",
            "commitments/today",
            200,
            auth_required=True
        )

    def test_plans_endpoints(self):
        """Test all plan endpoints"""
        results = []
        for plan_type in ['day', 'week', 'month']:
            success, _ = self.run_test(
                f"{plan_type.title()} Plan",
                "GET",
                f"plans/{plan_type}",
                200,
                auth_required=True
            )
            results.append(success)
        return all(results)

def main():
    print("🚀 Starting Dharani TVS Business AI Manager API Tests")
    print("=" * 60)
    
    tester = DharaniTVSAPITester()
    
    # Test sequence
    tests = [
        ("Root API", tester.test_root_endpoint),
        ("Send OTP", tester.test_send_otp),
        ("Verify OTP & Login", tester.test_verify_otp),
        ("Get Current User", tester.test_get_me),
        ("Dashboard Overview", tester.test_dashboard_overview),
        ("Sales Executives", tester.test_sales_executives),
        ("Service Technicians", tester.test_service_technicians),
        ("AI Chat", tester.test_ai_chat),
        ("Today's Commitments", tester.test_commitments_today),
        ("Plans Endpoints", tester.test_plans_endpoints)
    ]

    for test_name, test_func in tests:
        try:
            test_func()
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {e}")
            tester.failed_tests.append({
                'test': test_name,
                'error': str(e)
            })

    # Print results
    print("\n" + "=" * 60)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if tester.failed_tests:
        print("\n❌ Failed Tests:")
        for failure in tester.failed_tests:
            print(f"   - {failure['test']}: {failure.get('error', 'Unknown error')}")
    
    success_rate = (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0
    print(f"\n✅ Success Rate: {success_rate:.1f}%")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())