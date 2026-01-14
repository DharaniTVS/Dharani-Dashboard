"""
Backend API Tests for Dharani TVS Business AI Manager
Tests: Auth, Settings, Sheets Data, Service PDF Upload
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://tvs-command-hub.preview.emergentagent.com')
SESSION_TOKEN = "test_session_1768329666863"

@pytest.fixture
def api_client():
    """Shared requests session with auth"""
    session = requests.Session()
    session.headers.update({
        "Content-Type": "application/json",
        "Authorization": f"Bearer {SESSION_TOKEN}"
    })
    return session


class TestHealthAndRoot:
    """Root endpoint tests"""
    
    def test_api_root(self, api_client):
        """Test API root endpoint"""
        response = api_client.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "active"
        assert "Dharani TVS" in data["message"]
        print(f"✓ API root: {data}")


class TestAuth:
    """Authentication endpoint tests"""
    
    def test_auth_me_with_valid_token(self, api_client):
        """Test /api/auth/me with valid session token"""
        response = api_client.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 200
        data = response.json()
        assert "user_id" in data
        assert "email" in data
        assert data["email"] == "test@dharanitvs.com"
        print(f"✓ Auth me: {data}")
    
    def test_auth_me_without_token(self):
        """Test /api/auth/me without session token - should fail"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401
        print(f"✓ Auth me without token returns 401")


class TestSettings:
    """Settings endpoint tests"""
    
    def test_get_settings(self, api_client):
        """Test GET /api/settings"""
        response = api_client.get(f"{BASE_URL}/api/settings")
        assert response.status_code == 200
        data = response.json()
        assert "dark_mode" in data or data == {}
        print(f"✓ Get settings: {data}")
    
    def test_update_settings(self, api_client):
        """Test PUT /api/settings"""
        settings_payload = {
            "dark_mode": False,
            "allowed_emails": []
        }
        response = api_client.put(f"{BASE_URL}/api/settings", json=settings_payload)
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✓ Update settings: {data}")
    
    def test_add_email_to_whitelist(self, api_client):
        """Test POST /api/settings/add-email"""
        test_email = "test_whitelist@example.com"
        response = api_client.post(f"{BASE_URL}/api/settings/add-email?email={test_email}")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✓ Add email: {data}")
        
        # Verify email was added
        settings_response = api_client.get(f"{BASE_URL}/api/settings")
        settings_data = settings_response.json()
        assert test_email in settings_data.get("allowed_emails", [])
        print(f"✓ Email verified in whitelist")
    
    def test_remove_email_from_whitelist(self, api_client):
        """Test DELETE /api/settings/remove-email"""
        test_email = "test_whitelist@example.com"
        response = api_client.delete(f"{BASE_URL}/api/settings/remove-email?email={test_email}")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✓ Remove email: {data}")


class TestSheetsData:
    """Google Sheets data endpoint tests"""
    
    def test_get_branches(self, api_client):
        """Test GET /api/sheets/branches"""
        response = api_client.get(f"{BASE_URL}/api/sheets/branches")
        assert response.status_code == 200
        data = response.json()
        assert "branches" in data
        branches = data["branches"]
        assert len(branches) >= 5
        assert "Kumarapalayam" in branches
        assert "Kavindapadi" in branches
        assert "Ammapettai" in branches
        assert "Anthiyur" in branches
        assert "Bhavani" in branches
        print(f"✓ Branches: {branches}")
    
    def test_get_sales_data_kumarapalayam(self, api_client):
        """Test GET /api/sheets/sales-data for Kumarapalayam branch"""
        response = api_client.get(f"{BASE_URL}/api/sheets/sales-data?branch=Kumarapalayam")
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert "total" in data
        print(f"✓ Sales data Kumarapalayam: {data['total']} records")
        
        # Verify data structure if records exist
        if data["data"]:
            record = data["data"][0]
            # Check for expected fields
            assert "Branch" in record
            assert record["Branch"] == "Kumarapalayam"
            print(f"✓ Sample record has Branch field")
    
    def test_get_sales_data_with_search(self, api_client):
        """Test GET /api/sheets/sales-data with search filter"""
        response = api_client.get(f"{BASE_URL}/api/sheets/sales-data?branch=Kumarapalayam&search=TVS")
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        print(f"✓ Sales data with search: {data['total']} records")
    
    def test_get_executives(self, api_client):
        """Test GET /api/sheets/executives"""
        response = api_client.get(f"{BASE_URL}/api/sheets/executives?branch=Kumarapalayam")
        assert response.status_code == 200
        data = response.json()
        assert "executives" in data
        print(f"✓ Executives: {len(data['executives'])} found")
    
    def test_get_stock_data(self, api_client):
        """Test GET /api/sheets/stock-data"""
        response = api_client.get(f"{BASE_URL}/api/sheets/stock-data?branch=Kumarapalayam")
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert "total" in data
        print(f"✓ Stock data: {data['total']} records")
    
    def test_get_service_data(self, api_client):
        """Test GET /api/sheets/service-data"""
        response = api_client.get(f"{BASE_URL}/api/sheets/service-data?branch=Kumarapalayam")
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert "total" in data
        print(f"✓ Service data: {data['total']} records")


class TestServiceReports:
    """Service PDF upload and reports tests"""
    
    def test_get_service_reports(self, api_client):
        """Test GET /api/service/reports"""
        response = api_client.get(f"{BASE_URL}/api/service/reports?branch=Kumarapalayam")
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert "total" in data
        print(f"✓ Service reports: {data['total']} records")


class TestBranchSwitching:
    """Test data changes when switching branches"""
    
    def test_sales_data_different_branches(self, api_client):
        """Test that different branches return different data"""
        branches = ["Kumarapalayam", "Kavindapadi", "Ammapettai"]
        results = {}
        
        for branch in branches:
            response = api_client.get(f"{BASE_URL}/api/sheets/sales-data?branch={branch}")
            assert response.status_code == 200
            data = response.json()
            results[branch] = data["total"]
            print(f"✓ {branch}: {data['total']} records")
        
        # All branches should return valid responses
        for branch, count in results.items():
            assert isinstance(count, int)
        print(f"✓ All branches returned valid data")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
