# OrderFlow

A voice-based order management app built for small wholesale businesses in India. The owner records a voice note ΓÇö something like *"Ramesh Trading ko 50 bucket aur 20 mug bhejne hain"* ΓÇö and the app figures out the customer, products, and quantities on its own. Staff can then see those orders on their phones and mark them as dispatched.

**Live app:** [YOUR_VERCEL_URL.vercel.app](https://YOUR_VERCEL_URL.vercel.app)

---

## The Problem It Solves

Most small factory owners in India still take orders over WhatsApp or on paper. There is no way to track what is pending, what got dispatched, or how much was sold in a month. OrderFlow gives them a proper system that works on any phone ΓÇö for free.

---

## What It Can Do

- Record a voice note and auto-extract the order using Gemini AI
- Add orders manually if voice is not an option
- Owner sees all pending and dispatched orders with timestamps
- Staff gets their own login and sees only what needs to be dispatched
- Monthly order export to CSV for billing
- Works offline and syncs when internet is back
- Can be installed on the phone like a regular app (PWA)
- All data goes to a Google Sheet ΓÇö no database costs

---

## Tech Used

| Part | Tool |
|---|---|
| Frontend | React 19 + Vite |
| Styling | Plain CSS |
| Routing | React Router v7 |
| Offline storage | IndexedDB (idb) |
| AI | Google Gemini API |
| Backend | Google Apps Script |
| Database | Google Sheets |
| Hosting | Vercel |

---

## How an Order Flows Through the App

```
Owner speaks
     |
     v
Gemini AI transcribes and extracts the order
     |
     v
Owner reviews and confirms
     |
     v
Order saved to Google Sheets
     |
     v
Staff opens their phone and sees the order
     |
     v
Staff dispatches it and marks it done
```

### What happens when there is no internet

The app saves the order locally first (IndexedDB). When the connection comes back, it syncs to Google Sheets automatically.

### AI extraction ΓÇö how it decides what to use

1. Tries the Google Apps Script backend first (most stable)
2. Falls back to calling Gemini directly from the browser
3. If both fail, uses a basic pattern-matching parser that works offline

---

## Login and Auth

This is an MVP, so authentication is kept simple on purpose.

- **Owner** logs in with a fixed PIN: `0000`
- **Staff** logs in with their phone number and a 4-digit PIN that the owner assigns from the Profile screen
- Opening the app in two separate browser tabs lets you use both roles at the same time

---

## Project Structure

```
orderflow/
Γö£ΓöÇΓöÇ google-apps-script/
Γöé   ΓööΓöÇΓöÇ Code.gs              # Backend running on Google Apps Script
Γö£ΓöÇΓöÇ public/
Γöé   Γö£ΓöÇΓöÇ manifest.json        # PWA config
Γöé   ΓööΓöÇΓöÇ sw.js                # Service Worker for offline support
Γö£ΓöÇΓöÇ src/
Γöé   Γö£ΓöÇΓöÇ components/          # Shared UI pieces
Γöé   Γö£ΓöÇΓöÇ config/
Γöé   Γöé   ΓööΓöÇΓöÇ constants.js     # Apps Script URL and API key config
Γöé   Γö£ΓöÇΓöÇ context/
Γöé   Γöé   Γö£ΓöÇΓöÇ AuthContext.jsx  # Login and session handling
Γöé   Γöé   ΓööΓöÇΓöÇ AppContext.jsx   # Orders, customers, products state
Γöé   Γö£ΓöÇΓöÇ pages/
Γöé   Γöé   Γö£ΓöÇΓöÇ owner/           # Owner screens
Γöé   Γöé   ΓööΓöÇΓöÇ staff/           # Staff screens
Γöé   Γö£ΓöÇΓöÇ services/
Γöé   Γöé   Γö£ΓöÇΓöÇ geminiService.js # AI order extraction
Γöé   Γöé   ΓööΓöÇΓöÇ sheetsService.js # Reads and writes to Google Sheets
Γöé   ΓööΓöÇΓöÇ utils/
Γö£ΓöÇΓöÇ vercel.json              # SPA routing config for Vercel
ΓööΓöÇΓöÇ vite.config.js
```

---

## Things Planned for Later

- Let the owner set their own PIN instead of using `0000`
- Push notifications for staff when a new order comes in
- OTP-based staff login
- Order search and date filters
- WhatsApp sharing for order summaries

---

## License

MIT ΓÇö [Raj Jaiswal](https://github.com/rajc6h6)
