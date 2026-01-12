import os
import gspread
from google.oauth2.service_account import Credentials
from typing import List, Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

class SheetsService:
    def __init__(self):
        self.api_key = os.getenv("GOOGLE_SHEETS_API_KEY")
        self.sheet_id = os.getenv("GOOGLE_SHEETS_ID")
        self.gc = None
        self.spreadsheet = None
    
    async def connect(self):
        """Connect to Google Sheets using API key (read-only access for public sheets)"""
        try:
            # For public sheets with API key
            from google.auth.transport.requests import Request
            from google.oauth2 import service_account
            import gspread
            
            # Use gspread with API key for public sheets
            # Note: This requires the sheet to be publicly accessible
            self.gc = gspread.api_key(self.api_key)
            self.spreadsheet = self.gc.open_by_key(self.sheet_id)
            logger.info(f"Connected to Google Sheets: {self.sheet_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to connect to Google Sheets: {e}")
            return False
    
    async def get_worksheet(self, sheet_name: str):
        """Get a specific worksheet by name"""
        try:
            if not self.spreadsheet:
                await self.connect()
            return self.spreadsheet.worksheet(sheet_name)
        except Exception as e:
            logger.error(f"Failed to get worksheet {sheet_name}: {e}")
            return None
    
    async def read_sheet(self, sheet_name: str) -> List[Dict[str, Any]]:
        """Read all data from a sheet and return as list of dicts"""
        try:
            worksheet = await self.get_worksheet(sheet_name)
            if not worksheet:
                return []
            
            # Get all values
            data = worksheet.get_all_records()
            return data
        except Exception as e:
            logger.error(f"Failed to read sheet {sheet_name}: {e}")
            return []
    
    async def write_sheet(self, sheet_name: str, data: List[List[Any]], range_name: str = None):
        """Write data to a sheet"""
        try:
            worksheet = await self.get_worksheet(sheet_name)
            if not worksheet:
                return False
            
            if range_name:
                worksheet.update(range_name, data)
            else:
                worksheet.append_rows(data)
            
            return True
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