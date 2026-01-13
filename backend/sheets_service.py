import os
import csv
from typing import List, Dict, Any, Optional
import logging
import httpx
import io

logger = logging.getLogger(__name__)

class SheetsService:
    def __init__(self):
        self.connected = False
        self._sheet_id = None
        self._base_url = None
    
    @property
    def sheet_id(self):
        if self._sheet_id is None:
            self._sheet_id = os.getenv("GOOGLE_SHEETS_ID")
        return self._sheet_id
    
    @property
    def base_url(self):
        if self._base_url is None:
            self._base_url = f"https://docs.google.com/spreadsheets/d/{self.sheet_id}/export"
        return self._base_url
    
    async def connect(self):
        """Test connection to Google Sheets using public export"""
        import asyncio
        
        def sync_connect():
            try:
                import requests
                url = f"{self.base_url}?format=csv&gid=0"
                logger.info(f"Attempting to connect to: {url}")
                response = requests.get(url, timeout=15, allow_redirects=True)
                logger.info(f"Response: status={response.status_code}, length={len(response.text)}")
                
                if response.status_code == 200 and len(response.text) > 100:
                    lines = response.text.strip().split('\n')
                    if len(lines) > 1:
                        return True, len(lines) - 1
                return False, response.status_code
            except Exception as e:
                logger.error(f"Exception during connect: {e}")
                return False, str(e)
        
        # Run sync function in thread pool
        result = await asyncio.to_thread(sync_connect)
        if result[0]:
            logger.info(f"✓ Connected to Google Sheets: {result[1]} data rows")
            self.connected = True
            return True
        else:
            logger.error(f"Sheet connection failed: {result[1]}")
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
        import asyncio
        
        def sync_read():
            try:
                sheet_gid = gid if gid is not None else self.SHEET_GIDS.get(sheet_name, 0)
                
                import requests
                url = f"{self.base_url}?format=csv&gid={sheet_gid}"
                response = requests.get(url, timeout=15, allow_redirects=True)
                
                if response.status_code == 200:
                    reader = csv.DictReader(io.StringIO(response.text))
                    result = [row for row in reader]
                    logger.info(f"✓ Read {len(result)} rows from '{sheet_name}' (gid={sheet_gid})")
                    return result
                else:
                    logger.error(f"Failed to read '{sheet_name}': HTTP {response.status_code}")
                    return []
            except Exception as e:
                logger.error(f"Failed to read '{sheet_name}': {e}")
                return []
        
        return await asyncio.to_thread(sync_read)
    
    async def write_sheet(self, sheet_name: str, data: List[List[Any]], range_name: str = None):
        """Write data to a sheet - Note: This requires write permissions"""
        logger.warning(f"Write operations not supported with CSV export method for sheet {sheet_name}")
        return False
    
    async def get_sales_data(self) -> List[Dict[str, Any]]:
        """Get sales master data - using first sheet (gid=0)"""
        # Try to connect if not connected
        if not self.connected:
            await self.connect()
        
        # If still not connected, try to read anyway
        return await self.read_sheet("Sales Master", gid=0)
    
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