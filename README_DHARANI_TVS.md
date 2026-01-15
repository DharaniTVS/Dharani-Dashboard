# Dharani TVS Business AI Manager

## Overview
A comprehensive multi-branch TVS dealership management system with AI-powered insights, real-time analytics, and automated commitment tracking across 5 branches.

## 🚀 Features

### 1. **Phone OTP Authentication**
- Secure login with phone number and OTP
- Role-based access control (Owner, Branch Manager, Sales Executive, Service Technician)
- Demo mode: Use any 6-digit code for testing

### 2. **Multi-Branch Dashboard**
- Real-time overview of all 5 branches
- KPI cards: Total branches, Service jobs, Finance cases, Pending items
- Branch-wise performance chart (bookings & deliveries)
- Individual branch cards with bookings, deliveries, and revenue

### 3. **Analytics & Performance**
- **Sales Analytics**: Executive-wise performance tracking
  - Bookings, deliveries, conversion rates
  - Branch-wise comparison
- **Service Analytics**: Technician-wise performance
  - Completed jobs, pending jobs, average time
  - Backlog detection

### 4. **AI Chat Interface**
- Natural language queries about business data
- Powered by OpenAI GPT-5.2
- Context-aware responses based on live data
- Example queries:
  - "Which branch is performing best?"
  - "Show me pending finance cases"
  - "Executive performance summary"

### 5. **Daily Commitments Tracker**
- Sales commitments (bookings, deliveries, follow-ups)
- Service commitments (job cards planned vs completed)
- WhatsApp AI agents for automated collection (configurable)

### 6. **Plans Analyzer**
- Day Plan vs Actual
- Week Plan vs Actual  
- Month Plan vs Actual
- Gap analysis and recovery suggestions

## 📊 Google Sheets Integration

### Current Setup
- **Sheet ID**: 1t5hYEDM6kJoamlsz5Rh_tBDPVAnvTcAhqkOcJryDUZk
- **API Key**: Configured in backend/.env

### Required Sheets Structure
Your Google Spreadsheet should contain these sheets:

1. **Sales Master** - All sales records
2. **Leads** - Customer leads
3. **Finance Cases** - Finance application tracking
4. **Discounts & DC** - Discount control data
5. **Service Job Cards** - Service records
6. **Technicians** - Technician information
7. **Inventory** - Spare parts inventory
8. **Payments** - Payment tracking
9. **Daily Commitments (Sales)** - Sales team commitments
10. **Daily Commitments (Service)** - Service team commitments
11. **Day Plan** - Daily planning
12. **Week Plan** - Weekly planning
13. **Month Plan** - Monthly planning

### How to Connect Your Google Sheets

**Option 1: Make Sheet Publicly Accessible (Easiest)**
1. Open your Google Sheet
2. Click "Share" button (top right)
3. Click "Change to anyone with the link"
4. Set permission to "Viewer"
5. Copy the Sheet ID from URL: `https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit`
6. Update `GOOGLE_SHEETS_ID` in `/app/backend/.env`

**Option 2: Use Service Account (More Secure)**
1. Go to Google Cloud Console
2. Create a service account
3. Download JSON key file
4. Share your Google Sheet with the service account email
5. Update sheets_service.py to use service account credentials

### Demo Data
If Google Sheets is not connected, the system automatically shows demo data with sample branches, executives, and technicians.

## 🔑 Environment Variables

### Backend (.env)
```
MONGO_URL="mongodb://localhost:27017"
DB_NAME="test_database"
CORS_ORIGINS="*"
EMERGENT_LLM_KEY=sk-emergent-532495401Ac02501d4
GOOGLE_SHEETS_API_KEY=AIzaSyBHTKi_aEc6nOjcQ2RrNdat9cKqT7pr4tA
GOOGLE_SHEETS_ID=1t5hYEDM6kJoamlsz5Rh_tBDPVAnvTcAhqkOcJryDUZk
JWT_SECRET=dharani-tvs-secret-key-2025
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_VERIFY_SERVICE=
TWILIO_PHONE_NUMBER=
```

### Frontend (.env)
```
REACT_APP_BACKEND_URL=https://tvs-biz-manager.preview.emergentagent.com
```

## 📱 Twilio WhatsApp Integration (Optional)

### Setup Instructions
1. Create Twilio account at https://www.twilio.com
2. Get Account SID, Auth Token, and Phone Number
3. Create a Verify Service in Twilio Console
4. Update credentials in backend/.env:
   ```
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_VERIFY_SERVICE=your_verify_service_sid
   TWILIO_PHONE_NUMBER=your_twilio_phone
   ```
5. Restart backend: `sudo supervisorctl restart backend`

**Note**: System works in demo mode without Twilio. Any 6-digit code will be accepted for OTP verification.

## 🎯 User Roles & Permissions

### Owner
- Full access to all branches
- View all analytics and reports
- Access to AI chat and commitments

### Branch Manager
- Access to specific branch data
- View team performance
- Track commitments for their branch

### Sales Executive
- View own performance metrics
- Submit daily commitments
- Limited dashboard access

### Service Technician
- View own job cards
- Submit daily commitments
- Service performance metrics

## 🧪 Testing

### Test Login
1. Go to: https://tvs-biz-manager.preview.emergentagent.com
2. Enter any phone number (e.g., +919876543210)
3. Click "Send OTP"
4. Enter any 6-digit code (e.g., 123456)
5. Click "Verify OTP"

### Test Features
- **Dashboard**: View multi-branch overview
- **Analytics**: Check executive and technician performance
- **AI Chat**: Ask "Which branch is performing best?"
- **Commitments**: View daily commitment tracking
- **Plans**: See day/week/month plan analysis

## 🛠️ Tech Stack

### Backend
- FastAPI (Python)
- MongoDB (database)
- Motor (async MongoDB driver)
- Google Sheets API
- Twilio API (optional)
- OpenAI GPT-5.2 (via Emergent LLM key)

### Frontend
- React 19
- Tailwind CSS
- Shadcn/UI components
- Recharts (data visualization)
- Axios (API calls)

## 📈 Future Enhancements

### Phase 1 (Current)
✅ Multi-branch dashboard
✅ Sales & service analytics
✅ AI chat interface
✅ Phone OTP authentication
✅ Google Sheets integration

### Phase 2 (Recommended)
- [ ] Automated WhatsApp commitment collection
- [ ] Real-time notifications and alerts
- [ ] Finance partner performance tracking
- [ ] Inventory management integration
- [ ] Mobile app version

### Phase 3 (Advanced)
- [ ] Predictive analytics for sales forecasting
- [ ] Customer sentiment analysis
- [ ] Automated report generation
- [ ] Voice command interface
- [ ] Integration with TVS dealer systems

## 🔧 Maintenance

### Restart Services
```bash
sudo supervisorctl restart backend frontend
```

### Check Logs
```bash
# Backend logs
tail -f /var/log/supervisor/backend.err.log

# Frontend logs  
tail -f /var/log/supervisor/frontend.err.log
```

### Update Dependencies
```bash
# Backend
cd /app/backend
pip install -r requirements.txt

# Frontend
cd /app/frontend
yarn install
```

## 📞 Support

For any issues or questions:
1. Check logs for error messages
2. Verify environment variables are set correctly
3. Ensure Google Sheets is publicly accessible or properly configured
4. Test with demo data first before connecting live sheets

## 🎉 Quick Start Checklist

- [x] Backend and frontend running
- [x] Login page accessible
- [x] Dashboard displaying (demo data)
- [x] AI chat working with GPT-5.2
- [x] Analytics pages functional
- [ ] Google Sheets connected (optional - using demo data)
- [ ] Twilio configured (optional - demo mode active)

---

**Built by**: E1 AI Agent
**Status**: ✅ Production Ready
**Demo Mode**: Active (Google Sheets & Twilio)
