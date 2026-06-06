# OrderFlow — Setup Guide / सेटअप गाइड

## Step 1: Create Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com)
2. Create a new blank spreadsheet
3. Name it **"OrderFlow Database"**
4. Note the **Spreadsheet ID** from the URL:
   ```
   https://docs.google.com/spreadsheets/d/THIS_IS_YOUR_SPREADSHEET_ID/edit
   ```

## Step 2: Add the Apps Script Backend

1. In your Google Sheet, go to **Extensions → Apps Script**
2. Delete any existing code in the editor
3. Copy the ENTIRE contents of `google-apps-script/Code.gs` and paste it
4. Click **Save** (💾 icon or Ctrl+S)
5. Name the project **"OrderFlow Backend"**

## Step 3: Set Script Properties

1. In Apps Script editor, click the **⚙️ gear icon** (Project Settings)
2. Scroll down to **Script Properties**
3. Click **Add Script Property** and add:

   | Property | Value |
   |---|---|
   | `SPREADSHEET_ID` | Your spreadsheet ID from Step 1 |
   | `GEMINI_API_KEY` | Your free API key from [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |

4. Click **Save**

## Step 4: Initialize the Spreadsheet

1. In the Apps Script editor, select `initializeSpreadsheet` from the function dropdown
2. Click **Run** (▶️ button)
3. **First time**: Google will ask you to authorize — click "Review Permissions" → Choose your Google account → Click "Advanced" → "Go to OrderFlow Backend" → Allow
4. Check your Google Sheet — you should now see 3 tabs: Orders, Customers, Products
5. Products tab should have: Bucket, Mug, Soap Box, Comb
6. Customers tab should have: 8 pre-filled wholesalers

## Step 5: Deploy as Web App

1. In Apps Script editor, click **Deploy → New deployment**
2. Click the ⚙️ gear next to "Select type" → choose **Web app**
3. Settings:
   - **Description**: OrderFlow API
   - **Execute as**: Me
   - **Who has access**: Anyone
4. Click **Deploy**
5. **Copy the Web App URL** — it looks like:
   ```
   https://script.google.com/macros/s/XXXXXXXXX/exec
   ```
6. **SAVE THIS URL** — you need it for the app configuration

## Step 6: Get Gemini API Key (Free)

1. Go to [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Sign in with your Google account
3. Click **Create API Key**
4. Copy the key
5. Add it to Script Properties (Step 3) as `GEMINI_API_KEY`

**Cost: ₹0** — Gemini free tier allows 1500 requests/day

## Step 7: Configure the App

1. Open `src/config/constants.js`
2. Replace the placeholder URL with your Apps Script Web App URL:
   ```javascript
   export const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/YOUR_URL/exec';
   ```

## Step 8: Run the App

```bash
cd c:\Users\raj\Hackathons\okcredit
npm run dev
```

Open http://localhost:5173 in Chrome.

---

## Updating the Apps Script

If you make changes to `Code.gs`:
1. Paste the updated code in Apps Script editor
2. Save
3. Go to **Deploy → Manage deployments**
4. Click ✏️ edit on your deployment
5. Change **Version** to "New version"
6. Click **Deploy**

## Troubleshooting

| Issue | Fix |
|---|---|
| "You do not have permission" | Re-deploy with "Anyone" access |
| Orders not saving | Check SPREADSHEET_ID in Script Properties |
| Gemini not working | Check GEMINI_API_KEY in Script Properties |
| CORS errors | Make sure you deployed as Web App with "Anyone" access |
| Sheet tabs missing | Run `initializeSpreadsheet` again |
