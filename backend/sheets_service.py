import os
import csv
from typing import List, Dict, Any, Optional
import logging
import httpx
import io

logger = logging.getLogger(__name__)

class SheetsService:
    def __init__(self):
        self.sheet_id = os.getenv("GOOGLE_SHEETS_ID")
        self.connected = False
        self.base_url = f"https://docs.google.com/spreadsheets/d/{self.sheet_id}/export"
    
    async def connect(self):
        """Test connection to Google Sheets using public export"""
        try:
            async with httpx.AsyncClient(follow_redirects=True) as client:
                url = f"{self.base_url}?format=csv&gid=0"
                response = await client.get(url, timeout=10.0)
                
                if response.status_code == 200 and len(response.text) > 0:
                    logger.info(f"✓ Connected to Google Sheets (public export method)")
                    self.connected = True
                    return True
                else:
                    logger.warning(f"⚠ Sheet access denied. Make sure the sheet is set to 'Anyone with the link can view'.")
                    self.connected = False
                    return False
        except Exception as e:
            logger.warning(f"⚠ Google Sheets connection failed: {e}. Using demo data.")
            self.connected = False
            return False
    
    # Sheet name to GID mapping (you may need to adjust these)
    SHEET_GIDS = {
        "Sales Master": 0,
        "Leads": 1,
        "Finance Cases": 2,
        "Discounts & DC": 3,
        "Service Job Cards": 4,
        "Technicians": 5,
        "Inventory": 6,
        "Payments": 7,
        "Daily Commitments (Sales)": 8,
        "Daily Commitments (Service)": 9,
        "Day Plan": 10,
        "Week Plan": 11,
        "Month Plan": 12
    }
    
    async def get_worksheet(self, sheet_name: str):
        """Get sheet GID"""
        if not self.connected:
            return None
        return self.SHEET_GIDS.get(sheet_name, 0)
    
    async def read_sheet(self, sheet_name: str, gid: int = None) -> List[Dict[str, Any]]:
        """Read all data from a sheet and return as list of dicts"""
        try:
            if not self.connected:
                return []
            
            # Use provided GID or lookup from sheet name
            sheet_gid = gid if gid is not None else self.SHEET_GIDS.get(sheet_name, 0)
            
            # Use Google Sheets CSV export
            async with httpx.AsyncClient(follow_redirects=True) as client:
                url = f"{self.base_url}?format=csv&gid={sheet_gid}"
                response = await client.get(url, timeout=10.0)
                
                if response.status_code == 200:
                    # Parse CSV
                    csv_data = response.text
                    reader = csv.DictReader(io.StringIO(csv_data))
                    result = [row for row in reader]
                    
                    logger.info(f"✓ Read {len(result)} rows from sheet '{sheet_name}' (gid={sheet_gid})")
                    return result
                else:
                    logger.error(f"Failed to read sheet {sheet_name}: HTTP {response.status_code}")
                    return []
        except Exception as e:
            logger.error(f"Failed to read sheet {sheet_name}: {e}")
            return []
    
    async def write_sheet(self, sheet_name: str, data: List[List[Any]], range_name: str = None):
        """Write data to a sheet"""
        try:
            if not self.connected:
                return False
            
            async with httpx.AsyncClient() as client:
                range_spec = f"{sheet_name}!{range_name}" if range_name else f"{sheet_name}!A1"
                url = f"https://sheets.googleapis.com/v4/spreadsheets/{self.sheet_id}/values/{range_spec}:append"
                params = {
                    "key": self.api_key,
                    "valueInputOption": "RAW"
                }
                body = {"values": data}
                
                response = await client.post(url, params=params, json=body, timeout=10.0)
                
                if response.status_code in [200, 201]:
                    logger.info(f"✓ Wrote data to sheet '{sheet_name}'")
                    return True
                else:
                    logger.error(f"Failed to write to sheet {sheet_name}: HTTP {response.status_code}")
                    return False
        except Exception as e:
            logger.error(f"Failed to write to sheet {sheet_name}: {e}")
            return False
    
    async def get_sales_data(self) -> List[Dict[str, Any]]:
        """Get sales master data"""
        return await self.read_sheet("Sales Master")
    
    async def get_leads_data(self) -> List[Dict[str, Any]]:
        """Get leads data"""
        return await self.read_sheet("Leads")
    
    async def get_service_data(self) -> List[Dict[str, Any]]:
        """Get service job cards data"""
        return await self.read_sheet("Service Job Cards")
    
    async def get_finance_cases(self) -> List[Dict[str, Any]]:
        """Get finance cases data"""
        return await self.read_sheet("Finance Cases")
    
    async def get_discounts(self) -> List[Dict[str, Any]]:
        """Get discounts and DC data"""
        return await self.read_sheet("Discounts & DC")
    
    async def get_technicians(self) -> List[Dict[str, Any]]:
        """Get technicians data"""
        return await self.read_sheet("Technicians")
    
    async def get_inventory(self) -> List[Dict[str, Any]]:
        """Get inventory/spares data"""
        return await self.read_sheet("Inventory")
    
    async def get_daily_commitments_sales(self) -> List[Dict[str, Any]]:
        """Get daily commitments for sales"""
        return await self.read_sheet("Daily Commitments (Sales)")
    
    async def get_daily_commitments_service(self) -> List[Dict[str, Any]]:
        """Get daily commitments for service"""
        return await self.read_sheet("Daily Commitments (Service)")
    
    async def get_day_plan(self) -> List[Dict[str, Any]]:
        """Get day plan data"""
        return await self.read_sheet("Day Plan")
    
    async def get_week_plan(self) -> List[Dict[str, Any]]:
        """Get week plan data"""
        return await self.read_sheet("Week Plan")
    
    async def get_month_plan(self) -> List[Dict[str, Any]]:
        """Get month plan data"""
        return await self.read_sheet("Month Plan")

# Global instance
sheets_service = SheetsService()