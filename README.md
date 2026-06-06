# OrderFlow

A voice-based order management app built for small wholesale businesses in India. The owner records a voice note — something like *"Ramesh Trading ko 50 bucket aur 20 mug bhejne hain"* — and the app figures out the customer, products, and quantities on its own. Staff can then see those orders on their phones and mark them as dispatched.

**Live app:** https://orderflow-bice.vercel.app/

---

## The Problem It Solves

Most small factory owners in India still take orders over WhatsApp or on paper. There is no way to track what is pending, what got dispatched, or how much was sold in a month. OrderFlow gives them a proper system that works on any phone — for free.

---

## What It Can Do

- Record a voice note and auto-extract the order using Gemini AI
- Add orders manually if voice is not an option
- Owner sees all pending and dispatched orders with timestamps
- Staff gets their own login and sees only what needs to be dispatched
- Monthly order export to CSV for billing
- Works offline and syncs when internet is back
- Can be installed on the phone like a regular app (PWA)
- All data goes to a Google Sheet — no database costs

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

### AI extraction — how it decides what to use

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
├── google-apps-script/
│   └── Code.gs              # Backend running on Google Apps Script
├── public/
│   ├── manifest.json        # PWA config
│   └── sw.js                # Service Worker for offline support
├── src/
│   ├── components/          # Shared UI pieces
│   ├── config/
│   │   └── constants.js     # Apps Script URL and API key config
│   ├── context/
│   │   ├── AuthContext.jsx  # Login and session handling
│   │   └── AppContext.jsx   # Orders, customers, products state
│   ├── pages/
│   │   ├── owner/           # Owner screens
│   │   └── staff/           # Staff screens
│   ├── services/
│   │   ├── geminiService.js # AI order extraction
│   │   └── sheetsService.js # Reads and writes to Google Sheets
│   └── utils/
├── vercel.json              # SPA routing config for Vercel
└── vite.config.js
```

---

## Things Planned for Later

- Let the owner set their own PIN instead of using `0000`
- Push notifications for staff when a new order comes in
- OTP-based staff login
- Order search and date filters
- WhatsApp sharing for order summaries

---
