# IEEE-Iraq-Attendance-System

> **IEEE Event Fast-Desk Attendance System** — A high-efficiency, offline-first check-in desk web application tailored for IEEE student branches, conferences, symposiums, and workshops. Features bilingual English & Arabic search, rapid mistake-proof check-in with instant undo, on-site walk-in registration, live analytics, and Microsoft Excel-ready UTF-8 CSV exports.

---

## ✨ Features

- **⚡ Fast-Desk Check-In**: One-click check-in with high-contrast visual cues and smooth status animations.
- **🛡️ Mistake Prevention & Undo**: Dynamic 5-second undo toast countdown and `Ctrl+Z` keyboard shortcut to immediately reverse accidental check-ins.
- **🌐 Bilingual Smart Search (Arabic & English)**:
  - Full Arabic text normalization: strips diacritics/tashkeel (`ً`, `ٌ`, `ٍ`, `َ`, `ُ`, `ِ`, `ّ`, `ْ`), unifies hamza variants (`أ`, `إ`, `آ` → `ا`), normalizes taa marbuta (`ة` → `ه`), and handles alif maqsura (`ى` → `ي`).
  - Supports search by first name, middle name, last name, or registration ID.
- **🚶 On-Site Walk-In Registration**: Instant modal registration for unexpected attendees (`Alt+N`) with automatic roster addition and check-in.
- **📊 Real-Time Analytics**: Live metrics for Total Registered, Checked In, Remaining, Walk-Ins, and real-time attendance rate percentage bar.
- **🔀 Flexible Views & Sorting**: Switch between card grid and compact data table view; sort by original registration, alphabetical order, or check-in recency.
- **📥 Excel-Ready CSV Export**: Exports attendee rosters with UTF-8 Byte Order Mark (BOM) so Arabic characters open cleanly in Microsoft Excel without character corruption.
- **🖨️ Printable Summary**: Clean print layout (`@media print`) for official paper records and conference archives.
- **🔒 Privacy-First**: Zero tracking, offline-first, local storage persistence, and sensitive attendee lists are strictly kept out of version control via `.gitignore`.

---

## 🚀 Quick Start

This project requires **zero external runtime dependencies** (pure HTML, CSS, JavaScript, and Node.js built-ins).

### 1. Clone the Repository
```bash
git clone https://github.com/AhmadTchnology/IEEE-Iraq-Attendance-System.git
cd IEEE-Iraq-Attendance-System
```

### 2. Start the Local Server
```bash
npm run dev
```

Then navigate to **[http://127.0.0.1:3000](http://127.0.0.1:3000)** in your browser.

*(Alternatively, you can open `index.html` directly in any modern browser without starting a server).*

---

## 📋 Adding Your Attendee Roster

You can load your event registration roster in two simple ways:

### Option A: Import via Web UI (Recommended)
1. Launch the app and click **Export ▾** in the top right.
2. Select **Import CSV**.
3. Choose your attendee CSV file (format: `First Name, Middle Name, Last Name`).

### Option B: Local Preloaded Roster (`data.js`)
1. Create a `data.js` file in the root directory (based on `data.example.js`):
```javascript
window.INITIAL_ATTENDEES = [
  {
    "id": "reg-001",
    "originalIndex": 1,
    "firstName": "Ahmed",
    "middleName": "Ali",
    "lastName": "Hassan",
    "fullName": "Ahmed Ali Hassan",
    "language": "en",
    "isWalkIn": false,
    "attended": false,
    "checkInTime": null
  }
];
```
2. Note: `data.js` is automatically excluded by `.gitignore` to protect attendee privacy.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| <kbd>/</kbd> | Focus and select search bar |
| <kbd>Esc</kbd> | Clear active search or close dialogs |
| <kbd>Alt</kbd> + <kbd>N</kbd> | Open Walk-In registration modal |
| <kbd>Alt</kbd> + <kbd>E</kbd> | Export attendance report to CSV |
| <kbd>Alt</kbd> + <kbd>P</kbd> | Print clean attendance summary |
| <kbd>Ctrl</kbd> + <kbd>Z</kbd> | Undo last check-in / check-out action |

---

## 🛠️ Project Structure

```
IEEE-Iraq-Attendance-System/
├── index.html         # Application markup and semantic layout
├── app.css            # IEEE brand theme, tokens, and responsive design
├── app.js             # Core logic, normalizers, audio, and state engine
├── data.example.js    # Sanitized template dataset for demonstration
├── server.js          # Zero-dependency local development server
├── package.json       # Project scripts and metadata
├── .gitignore         # Strict exclusion of attendee PII & internal notes
└── README.md          # Project documentation
```

---

## 🏛️ IEEE Identity & Design System

- **Primary IEEE Blue**: `#00629B`
- **Masthead Navy**: `#002855` / `#001A38`
- **Accent Cyan**: `#00A3E0`
- **Success Green**: `#059669` / `#10B981`
- **Typography**: Outfit, Cairo (Arabic), and JetBrains Mono

---

## 📄 License

ISC License © IEEE
