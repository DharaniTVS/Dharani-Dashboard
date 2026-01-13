import os
import csv
from typing import List, Dict, Any, Optional
import logging
import io

logger = logging.getLogger(__name__)

class SheetsService:
    def __init__(self):
        self.connected = False
        
        # Multi-branch Google Sheets configuration
        self.BRANCH_SHEETS = {
            'Kumarapalayam': '1sVI5CrCVXqT4ZgiEHz-j2LSA-sLHTIE_DcqoRk8UvCM',
            'Kavindapadi': '15W3aqY11b5HdB3KGcurs0MYO_h9r3qtQgQIQSKDjzqo',
            'Ammapettai': '1dsV2gPw1eP-vaWv9fd25D5qJ9z5uXSd_bKLNvxmLp0I',
            'Anthiyur': '1dsV2gPw1eP-vaWv9fd25D5qJ9z5uXSd_bKLNvxmLp0I',
            'Bhavani': '1dsV2gPw1eP-vaWv9fd25D5qJ9z5uXSd_bKLNvxmLp0I'
        }
        
        # Sheet GIDs for different data types within each branch sheet
        self.SHEET_GIDS = {
            "Sales": 0,
            "Stock": 1,  # For Inventory
            "Service": 2,
            "Leads": 3
        }
    
    def get_sheet_url(self, sheet_id: str, gid: int = 0) -> str:
        """Generate CSV export URL for a Google Sheet"""
        return f"https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=csv&gid={gid}"
    
    async def connect(self):
        """Test connection to Google Sheets"""
        import asyncio
        
        def sync_connect():
            try:
                import requests
                # Test connection with first branch
                first_branch = list(self.BRANCH_SHEETS.values())[0]
                url = self.get_sheet_url(first_branch, 0)
                logger.info(f"Testing connection to: {url}")
                response = requests.get(url, timeout=15, allow_redirects=True)
                
                if response.status_code == 200 and len(response.text) > 100:
                    lines = response.text.strip().split('\n')
                    if len(lines) > 1:
                        return True, len(lines) - 1
                return False, response.status_code
            except Exception as e:
                logger.error(f"Exception during connect: {e}")
                return False, str(e)
        
        result = await asyncio.to_thread(sync_connect)
        if result[0]:
            logger.info(f"✓ Connected to Google Sheets: {result[1]} data rows")
            self.connected = True
            return True
        else:
            logger.error(f"Sheet connection failed: {result[1]}")
            self.connected = False
            return False
    
    async def read_sheet(self, sheet_id: str, gid: int = 0) -> List[Dict[str, Any]]:
        """Read data from a specific sheet"""
        import asyncio
        
        def sync_read():
            try:
                import requests
                url = self.get_sheet_url(sheet_id, gid)
                response = requests.get(url, timeout=15, allow_redirects=True)
                
                if response.status_code == 200:
                    reader = csv.DictReader(io.StringIO(response.text))
                    result = [row for row in reader]
                    logger.info(f"✓ Read {len(result)} rows from sheet {sheet_id} (gid={gid})")
                    return result
                else:
                    logger.error(f"Failed to read sheet: HTTP {response.status_code}")
                    return []
            except Exception as e:
                logger.error(f"Failed to read sheet: {e}")
                return []
        
        return await asyncio.to_thread(sync_read)
    
    async def get_sales_data(self, branch: str = None) -> List[Dict[str, Any]]:
        """Get sales data - optionally filtered by branch"""
        if not self.connected:
            await self.connect()
        
        all_data = []
        
        if branch and branch in self.BRANCH_SHEETS:
            # Get data from specific branch
            sheet_id = self.BRANCH_SHEETS[branch]
            data = await self.read_sheet(sheet_id, self.SHEET_GIDS.get("Sales", 0))
            # Add branch name to each record for reference
            for record in data:
                record['Branch'] = branch
            all_data.extend(data)
        else:
            # Get data from all branches
            for branch_name, sheet_id in self.BRANCH_SHEETS.items():
                data = await self.read_sheet(sheet_id, self.SHEET_GIDS.get("Sales", 0))
                for record in data:
                    record['Branch'] = branch_name
                all_data.extend(data)
        
        return all_data
    
    async def get_stock_data(self, branch: str = None) -> List[Dict[str, Any]]:
        """Get inventory/stock data - optionally filtered by branch"""
        if not self.connected:
            await self.connect()
        
        all_data = []
        
        if branch and branch in self.BRANCH_SHEETS:
            sheet_id = self.BRANCH_SHEETS[branch]
            data = await self.read_sheet(sheet_id, self.SHEET_GIDS.get("Stock", 1))
            for record in data:
                record['Branch'] = branch
            all_data.extend(data)
        else:
            for branch_name, sheet_id in self.BRANCH_SHEETS.items():
                data = await self.read_sheet(sheet_id, self.SHEET_GIDS.get("Stock", 1))
                for record in data:
                    record['Branch'] = branch_name
                all_data.extend(data)
        
        return all_data
    
    async def get_service_data(self, branch: str = None) -> List[Dict[str, Any]]:
        """Get service data - optionally filtered by branch"""
        if not self.connected:
            await self.connect()
        
        all_data = []
        
        if branch and branch in self.BRANCH_SHEETS:
            sheet_id = self.BRANCH_SHEETS[branch]
            data = await self.read_sheet(sheet_id, self.SHEET_GIDS.get("Service", 2))
            for record in data:
                record['Branch'] = branch
            all_data.extend(data)
        else:
            for branch_name, sheet_id in self.BRANCH_SHEETS.items():
                data = await self.read_sheet(sheet_id, self.SHEET_GIDS.get("Service", 2))
                for record in data:
                    record['Branch'] = branch_name
                all_data.extend(data)
        
        return all_data
    
    def get_branches(self) -> List[str]:
        """Get list of all branches"""
        return list(self.BRANCH_SHEETS.keys())

# Global instance
sheets_service = SheetsService()
