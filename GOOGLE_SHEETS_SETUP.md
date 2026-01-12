# Google Sheets Setup Guide

## Quick Setup (5 minutes)

### Step 1: Make Your Sheet Public
1. Open your Google Sheet: https://docs.google.com/spreadsheets/d/1t5hYEDM6kJoamlsz5Rh_tBDPVAnvTcAhqkOcJryDUZk/edit
2. Click **"Share"** button (top right)
3. Click **"Change to anyone with the link"**
4. Set to **"Viewer"** permission
5. Click **"Done"**

### Step 2: Create Required Sheets
Your spreadsheet needs these sheets (tabs):

#### 1. Sales Master
Columns: `branch_id`, `branch_name`, `executive_id`, `executive_name`, `status`, `amount`, `date`

Example data:
```
branch_id | branch_name | executive_id | executive_name | status    | amount  | date
1         | Branch 1    | E001         | Rajesh Kumar   | booked    | 85000   | 2025-01-15
1         | Branch 1    | E001         | Rajesh Kumar   | delivered | 85000   | 2025-01-16
2         | Branch 2    | E002         | Priya Sharma   | booked    | 92000   | 2025-01-15
```

#### 2. Leads
Columns: `lead_id`, `customer_name`, `phone`, `branch_id`, `executive_id`, `status`, `date`

#### 3. Finance Cases
Columns: `case_id`, `customer_name`, `branch_id`, `status`, `applied_date`, `amount`

Example data:
```
case_id | customer_name | branch_id | status   | applied_date | amount
FC001   | John Doe      | 1         | approved | 2025-01-10   | 85000
FC002   | Jane Smith    | 2         | pending  | 2025-01-12   | 92000
```

#### 4. Discounts & DC
Columns: `executive_id`, `model`, `discount_amount`, `branch_id`, `date`

#### 5. Service Job Cards
Columns: `job_id`, `technician_id`, `technician_name`, `branch_id`, `branch_name`, `status`, `date`

Example data:
```
job_id | technician_id | technician_name | branch_id | branch_name | status    | date
SJ001  | T001          | Kumar S         | 1         | Branch 1    | completed | 2025-01-15
SJ002  | T002          | Vijay R         | 2         | Branch 2    | pending   | 2025-01-16
```

#### 6. Technicians
Columns: `technician_id`, `name`, `branch_id`, `branch_name`, `phone`

#### 7. Inventory
Columns: `item_id`, `item_name`, `quantity`, `branch_id`, `min_stock`

#### 8. Payments
Columns: `payment_id`, `customer_name`, `amount`, `branch_id`, `date`, `status`

#### 9. Daily Commitments (Sales)
Columns: `date`, `executive_id`, `executive_name`, `branch_id`, `bookings_planned`, `deliveries_planned`, `follow_ups_planned`, `bookings_actual`, `deliveries_actual`, `follow_ups_actual`

#### 10. Daily Commitments (Service)
Columns: `date`, `technician_id`, `technician_name`, `branch_id`, `jobs_planned`, `jobs_actual`

#### 11. Day Plan
Columns: `date`, `branch_id`, `planned`, `achieved`, `notes`

#### 12. Week Plan
Columns: `week`, `branch_id`, `planned`, `achieved`, `notes`

#### 13. Month Plan
Columns: `month`, `branch_id`, `planned`, `achieved`, `notes`

## Sample Data Template

### For Quick Testing:
Use this minimal data to test the system:

**Sales Master** (at least 10-15 rows):
- Mix of "booked" and "delivered" status
- Spread across 5 branches
- 3-4 different executives per branch

**Service Job Cards** (at least 10-15 rows):
- Mix of "completed" and "pending" status
- 2-3 technicians per branch

**Finance Cases** (at least 5-10 rows):
- Mix of "approved", "pending", "rejected" status

## After Setup

1. Wait 1-2 minutes for the system to sync
2. Refresh your dashboard
3. You should see live data instead of demo data
4. The yellow "Demo Mode" banner should disappear

## Troubleshooting

### Dashboard still shows empty/demo data?

**Check 1**: Sheet is public
- Open sheet URL in incognito window
- You should be able to view it without logging in

**Check 2**: Sheet names match exactly
- Sheet tab names must match exactly (case-sensitive)
- "Sales Master" not "sales master" or "Sales_Master"

**Check 3**: Restart backend
```bash
sudo supervisorctl restart backend
```

**Check 4**: Check backend logs
```bash
tail -f /var/log/supervisor/backend.err.log
```
Look for: "✓ Connected to Google Sheets" message

### Common Issues:

**Error: "Permission denied"**
- Solution: Make sheet public with "Anyone with link can view"

**Error: "Sheet not found"**
- Solution: Verify Sheet ID in backend/.env matches your sheet URL

**Error: "Worksheet not found"**
- Solution: Create all required sheet tabs with exact names

## Advanced: Use Service Account (More Secure)

If you don't want to make sheet public:

1. **Create Service Account**:
   - Go to Google Cloud Console
   - Create new service account
   - Download JSON key file

2. **Share Sheet**:
   - Share your Google Sheet with service account email
   - Give "Editor" permission

3. **Update Backend**:
   - Copy JSON key to `/app/backend/service-account.json`
   - Update `sheets_service.py` to use service account

4. **Restart**:
   ```bash
   sudo supervisorctl restart backend
   ```

## Need Help?

1. Check logs: `tail -f /var/log/supervisor/backend.err.log`
2. Test with demo data first
3. Add data gradually - start with Sales Master and Service Job Cards
4. Verify data appears in dashboard before adding more sheets

---

**Status**: Currently using demo data
**Next Step**: Make sheet public or add service account credentials
