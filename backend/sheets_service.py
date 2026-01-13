import os
import gspread
from google.oauth2.service_account import Credentials
from typing import List, Dict, Any, Optional
import logging
import httpx
import json

logger = logging.getLogger(__name__)

class SheetsService:
    def __init__(self):
        self.api_key = os.getenv("GOOGLE_SHEETS_API_KEY")
        self.sheet_id = os.getenv("GOOGLE_SHEETS_ID")
        self.gc = None
        self.spreadsheet = None
        self.connected = False
    
    async def connect(self):
        """Connect to Google Sheets using REST API"""
        try:
            # Try to fetch sheet metadata to verify connection
            async with httpx.AsyncClient() as client:
                url = f"https://sheets.googleapis.com/v4/spreadsheets/{self.sheet_id}"
                params = {"key": self.api_key}
                response = await client.get(url, params=params, timeout=10.0)
                
                if response.status_code == 200:
                    data = response.json()
                    logger.info(f"✓ Connected to Google Sheets: {data.get('properties', {}).get('title', 'Unknown')}")
                    self.connected = True
                    return True
                elif response.status_code == 403:
                    logger.warning(f"⚠ Sheet access denied. Please share the sheet with 'Anyone with the link can view' permission.")
                    self.connected = False
                    return False
                else:
                    logger.warning(f"⚠ Google Sheets connection failed: HTTP {response.status_code}. Using demo data.")
                    self.connected = False
                    return False
        except Exception as e:
            logger.warning(f"⚠ Google Sheets connection failed: {e}. Using demo data for now.")
            self.connected = False
            return False
    
    async def get_worksheet(self, sheet_name: str):
        """Get a specific worksheet by name"""
        if not self.connected:
            return None
        return sheet_name
    
    async def read_sheet(self, sheet_name: str) -> List[Dict[str, Any]]:
        """Read all data from a sheet and return as list of dicts"""
        try:
            if not self.connected:
                return []
            
            # Use Google Sheets API v4 to read data
            async with httpx.AsyncClient() as client:
                url = f"https://sheets.googleapis.com/v4/spreadsheets/{self.sheet_id}/values/{sheet_name}"
                params = {"key": self.api_key}
                response = await client.get(url, params=params, timeout=10.0)
                
                if response.status_code == 200:
                    data = response.json()
                    values = data.get("values", [])
                    
                    if len(values) < 2:
                        return []
                    
                    # First row is headers
                    headers = values[0]
                    rows = values[1:]
                    
                    # Convert to list of dicts
                    result = []
                    for row in rows:
                        # Pad row if it has fewer columns than headers
                        padded_row = row + [''] * (len(headers) - len(row))
                        result.append(dict(zip(headers, padded_row)))
                    
                    logger.info(f"✓ Read {len(result)} rows from sheet '{sheet_name}'")
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