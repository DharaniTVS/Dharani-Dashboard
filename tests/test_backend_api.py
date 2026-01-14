"""
Backend API Tests for Dharani TVS Business AI Manager
Tests: Auth, Settings, Sheets Data (Sales, Enquiry, Bookings, Stock), Service PDF Upload
Updated: Testing with correct GIDs for all 5 branches
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://tvs-command-hub.preview.emergentagent.com')
SESSION_TOKEN = "test_session_5dcd5469df974cdd99a0d938e4b6b3f5"

@pytest.fixture
def api_client():
    """Shared requests session with auth via Cookie"""
    session = requests.Session()
    session.headers.update({
        "Content-Type": "application/json",
        "Cookie": f"session_token={SESSION_TOKEN}"
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
        print(f"✓ Auth me: {data}")
    
    def test_auth_me_without_token(self):
        """Test /api/auth/me without session token - should fail"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401
        print(f"✓ Auth me without token returns 401")


class TestBranches:
    """Branch listing tests"""
    
    def test_get_branches(self, api_client):
        """Test GET /api/sheets/branches - verify all 5 branches"""
        response = api_client.get(f"{BASE_URL}/api/sheets/branches")
        assert response.status_code == 200
        data = response.json()
        assert "branches" in data
        branches = data["branches"]
        expected_branches = ["Bhavani", "Kumarapalayam", "Anthiyur", "Kavindapadi", "Ammapettai"]
        for branch in expected_branches:
            assert branch in branches, f"Missing branch: {branch}"
        print(f"✓ All 5 branches present: {branches}")


class TestStockData:
    """Stock/Inventory data endpoint tests - verify correct GIDs"""
    
    def test_stock_data_bhavani(self, api_client):
        """Test GET /api/sheets/stock-data for Bhavani (GID=471760422)"""
        response = api_client.get(f"{BASE_URL}/api/sheets/stock-data?branch=Bhavani")
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert "total" in data
        print(f"✓ Bhavani Stock: {data['total']} records")
        if data["data"]:
            record = data["data"][0]
            assert record.get("Branch") == "Bhavani"
            # Check for expected stock columns
            print(f"  Sample columns: {list(record.keys())[:5]}")
    
    def test_stock_data_kumarapalayam(self, api_client):
        """Test GET /api/sheets/stock-data for Kumarapalayam (GID=2505719)"""
        response = api_client.get(f"{BASE_URL}/api/sheets/stock-data?branch=Kumarapalayam")
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        print(f"✓ Kumarapalayam Stock: {data['total']} records")
        if data["data"]:
            assert data["data"][0].get("Branch") == "Kumarapalayam"
    
    def test_stock_data_anthiyur(self, api_client):
        """Test GET /api/sheets/stock-data for Anthiyur (GID=1670776756)"""
        response = api_client.get(f"{BASE_URL}/api/sheets/stock-data?branch=Anthiyur")
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        print(f"✓ Anthiyur Stock: {data['total']} records")
        if data["data"]:
            assert data["data"][0].get("Branch") == "Anthiyur"
    
    def test_stock_data_kavindapadi(self, api_client):
        """Test GET /api/sheets/stock-data for Kavindapadi (GID=522931946)"""
        response = api_client.get(f"{BASE_URL}/api/sheets/stock-data?branch=Kavindapadi")
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        print(f"✓ Kavindapadi Stock: {data['total']} records")
        if data["data"]:
            assert data["data"][0].get("Branch") == "Kavindapadi"
    
    def test_stock_data_ammapettai(self, api_client):
        """Test GET /api/sheets/stock-data for Ammapettai (GID=674010899)"""
        response = api_client.get(f"{BASE_URL}/api/sheets/stock-data?branch=Ammapettai")
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        print(f"✓ Ammapettai Stock: {data['total']} records")
        if data["data"]:
            assert data["data"][0].get("Branch") == "Ammapettai"


class TestEnquiryData:
    """Enquiry data endpoint tests"""
    
    def test_enquiry_data_bhavani(self, api_client):
        """Test GET /api/sheets/enquiry-data for Bhavani"""
        response = api_client.get(f"{BASE_URL}/api/sheets/enquiry-data?branch=Bhavani")
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert "total" in data
        print(f"✓ Bhavani Enquiry: {data['total']} records")
    
    def test_enquiry_data_kumarapalayam(self, api_client):
        """Test GET /api/sheets/enquiry-data for Kumarapalayam"""
        response = api_client.get(f"{BASE_URL}/api/sheets/enquiry-data?branch=Kumarapalayam")
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        print(f"✓ Kumarapalayam Enquiry: {data['total']} records")


class TestBookingsData:
    """Bookings data endpoint tests"""
    
    def test_bookings_data_bhavani(self, api_client):
        """Test GET /api/sheets/bookings-data for Bhavani"""
        response = api_client.get(f"{BASE_URL}/api/sheets/bookings-data?branch=Bhavani")
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert "total" in data
        print(f"✓ Bhavani Bookings: {data['total']} records")
    
    def test_bookings_data_kumarapalayam(self, api_client):
        """Test GET /api/sheets/bookings-data for Kumarapalayam"""
        response = api_client.get(f"{BASE_URL}/api/sheets/bookings-data?branch=Kumarapalayam")
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        print(f"✓ Kumarapalayam Bookings: {data['total']} records")


class TestSalesData:
    """Sales (Sold) data endpoint tests"""
    
    def test_sales_data_bhavani(self, api_client):
        """Test GET /api/sheets/sales-data for Bhavani"""
        response = api_client.get(f"{BASE_URL}/api/sheets/sales-data?branch=Bhavani")
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert "total" in data
        print(f"✓ Bhavani Sales: {data['total']} records")
    
    def test_sales_data_kumarapalayam(self, api_client):
        """Test GET /api/sheets/sales-data for Kumarapalayam"""
        response = api_client.get(f"{BASE_URL}/api/sheets/sales-data?branch=Kumarapalayam")
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        print(f"✓ Kumarapalayam Sales: {data['total']} records")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
