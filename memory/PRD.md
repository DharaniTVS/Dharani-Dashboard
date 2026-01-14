# Dharani TVS AI Business Manager - Product Requirements Document

## Original Problem Statement
Build a "Dharani TVS AI Business Manager," a multi-branch digital command center for a 5-branch TVS dealership. The application should function as a SaaS analytics dashboard, converting data from Google Sheets into real-time insights.

## Project Overview
- **App Name**: Dharani TVS AI Business Manager
- **Tech Stack**: FastAPI (Python), React, MongoDB, Google Sheets
- **Purpose**: Multi-branch dealership analytics dashboard with AI assistance

## User Personas
1. **Dealership Owner/Manager**: Needs high-level KPIs and cross-branch comparison
2. **Branch Manager**: Needs branch-specific sales, service, and inventory data
3. **Sales Executive**: Needs enquiry and booking tracking

## Core Requirements

### 1. Dashboard Module ✅
- KPI cards with trend indicators (Total Revenue, AOV, Conversion Rate, Units Sold, Enquiries)
- Revenue Trend Area Chart (weekly performance)
- Sales by Category Donut Chart
- Executive Performance Bar Chart
- Top Selling Models list with progress bars

### 2. Sales Module ✅
- **Enquiries Page**: Data table with search, executive filter, date filter
- **Bookings Page**: Data table with search, executive filter, date filter
- **Sold Page**: Data table with search, executive filter, date filter
- CSV Export functionality on all pages

### 3. Service Module ✅
- PDF Upload (S601 Service Advisor/Technician Productivity Report)
- Auto-extract table data from PDF
- Display technician productivity metrics
- Date-based report viewing

### 4. Inventory Module ✅ (FIXED Jan 14, 2026)
- Read Stock sheet with branch-specific GIDs from each branch's Google Sheet
- Display inventory data in table format with all columns
- Search functionality
- Columns: MODEL, Colour, Frame No, Engine No, Quantity, TVS Invoice Date, Aging Stock (Days), Dealer Invoice Status, PDI Status

### 5. Settings Module ✅
- **AI Configuration**: API key input, provider selection (Gemini/OpenAI/Anthropic), model selection
- **Dark Mode**: Toggle for dark/light theme
- **Access Control**: Email whitelist for app access

### 6. AI Assistant ✅
- Floating chat button
- Integration with Gemini/OpenAI/Anthropic
- Configurable via Settings page
- Context-aware responses for dealership queries

### 7. Authentication ✅
- Google OAuth via Emergent Auth
- Session-based authentication
- Email whitelist for access control

## Data Sources

### Google Sheets (Per Branch) - UPDATED Jan 14, 2026
| Branch | Sheet ID | Stock GID |
|--------|----------|-----------|
| Bhavani | 1HYtgy4pLdQkCAInxucl3UT08B9afcJwuSrNtCvgDB7g | 471760422 |
| Kumarapalayam | 1sVI5CrCVXqT4ZgiEHz-j2LSA-sLHTIE_DcqoRk8UvCM | 2505719 |
| Anthiyur | 1MIf_sT6t4F9-2KeKwVylWH4VGKTUNAuxCLB2-COLXkA | 1670776756 |
| Kavindapadi | 15W3aqY11b5HdB3KGcurs0MYO_h9r3qtQgQIQSKDjzqo | 522931946 |
| Ammapettai | 1dsV2gPw1eP-vaWv9fd25D5qJ9z5uXSd_bKLNvxmLp0I | 674010899 |

### Sheet Structure (Per Branch)
- **Sold (gid=0)**: Customer Name, Mobile No, Vehicle Model, Category, Executive Name, Sales Date, Vehicle Cost
- **Enquiry (gid=1168200442)**: Date, Executive, Customer Name, Phone, Model, Source, Status
- **Bookings (gid=9828158)**: Booking Date, Customer Name, Executive, Phone No, Model, Booking Amount, Payment Mode
- **Stock (branch-specific GID)**: MODEL, Colour, Frame No, Engine No, Quantity, TVS Invoice Date, Aging Stock (Days), Dealer Invoice Status, PDI Status

## What's Been Implemented

### January 14, 2026

#### New Features Added
- ✅ **Global Dashboard** - All branches comparison with:
  - Total Revenue, Units Sold, AOV across all 5 branches
  - Revenue by Branch bar chart
  - Units Sold by Branch horizontal bar chart  
  - Category Distribution donut chart
  - Top Executives across all branches
- ✅ **Auto-sync every 30 seconds** - Live data refresh with indicator
- ✅ **Date filters** on Global Dashboard with date range picker
- ✅ **PDF Export** - jsPDF integration with auto-table
- ✅ **CSV Export** - On all pages
- ✅ **Dark Mode CSS** - Full dark theme support with proper variables
- ✅ **Text selection fix** - Proper selection highlight color
- ✅ **AI Markdown rendering** - ReactMarkdown with proper formatting

### December 2025 - January 2026

#### Backend (FastAPI)
- ✅ Multi-branch Google Sheets integration
- ✅ Google OAuth authentication (Emergent Auth)
- ✅ Settings API (dark mode, email whitelist, AI config)
- ✅ AI Chat endpoint with Gemini/OpenAI/Anthropic support
- ✅ Service PDF upload and extraction
- ✅ Sales, Stock, Service data endpoints

#### Frontend (React)
- ✅ Modern dashboard with KPI cards and trend indicators
- ✅ Revenue Trend Area Chart
- ✅ Sales by Category Donut Chart
- ✅ Executive Performance Bar Chart
- ✅ Top Selling Models list
- ✅ Enquiries page with date filters
- ✅ Bookings page with date filters
- ✅ Sold page with filters
- ✅ Service page with PDF upload
- ✅ Inventory page
- ✅ Settings page with AI configuration
- ✅ Google Auth login
- ✅ Branch selector in sidebar
- ✅ "AI Business Manager" branding

## Prioritized Backlog

### P0 (Critical) ✅ COMPLETED
- ✅ Multi-branch data support (all 5 branches with correct GIDs)
- ✅ Dashboard with modern charts
- ✅ Date filters on Enquiries/Bookings
- ✅ AI Chat integration
- ✅ Settings for AI API key
- ✅ Inventory/Stock sync with branch-specific GIDs (Fixed Jan 14, 2026)

### P1 (High Priority)
- [ ] Service PDF upload - needs end-to-end testing
- [x] Chart drill-down - click chart to see detailed data (UI exists, logic needed)
- [ ] PDF Export to Sales pages (Enquiries, Bookings, Sold)

### P2 (Medium Priority)
- [ ] Role-Based Access Control (RBAC)
- [ ] WhatsApp/Twilio integration for staff prompts
- [ ] Dark mode improvements (some edge cases)
- [ ] AI Assistant enhancements (pass real data context)

### P3 (Low Priority)
- [ ] Mobile-responsive optimization
- [ ] Push notifications
- [ ] Data caching for performance

## API Endpoints

### Authentication
- `POST /api/auth/session` - Exchange session_id for session_token
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Settings
- `GET /api/settings` - Get app settings
- `PUT /api/settings` - Update settings
- `PUT /api/settings/ai` - Update AI configuration
- `POST /api/settings/add-email` - Add to whitelist
- `DELETE /api/settings/remove-email` - Remove from whitelist

### Data
- `GET /api/sheets/sales-data` - Get sales/sold data (with filters)
- `GET /api/sheets/enquiry-data` - Get enquiry data (NEW)
- `GET /api/sheets/bookings-data` - Get bookings data (NEW)
- `GET /api/sheets/stock-data` - Get inventory data (FIXED - branch-specific GIDs)
- `GET /api/sheets/branches` - Get list of branches
- `GET /api/sheets/executives` - Get executives list

### Service
- `POST /api/service/upload-pdf` - Upload S601 PDF
- `GET /api/service/reports` - Get service reports

### AI
- `POST /api/ai/chat` - AI chat endpoint

## File Structure
```
/app
├── backend/
│   ├── server.py           # FastAPI routes
│   ├── sheets_service.py   # Google Sheets integration
│   ├── requirements.txt
│   └── .env
└── frontend/
    └── src/
        ├── App.js
        └── components/
            ├── Dashboard.js
            ├── Sales.js
            ├── Enquiries.js
            ├── Bookings.js
            ├── Service.js
            ├── Inventory.js
            ├── Settings.js
            ├── Sidebar.js
            ├── Login.js
            └── FloatingAI.js
```

## Testing Credentials
- **Session Token**: `ui_test_session_2024`
- **Test Email**: `test@dharanitvs.com`
- **Preview URL**: https://tvs-command-hub.preview.emergentagent.com
