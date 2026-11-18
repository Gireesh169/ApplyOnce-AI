# ApplyOnce AI
### Universal AI-Powered Job Application Assistant – Chrome Extension
> *"Enter Once. Apply Everywhere."*

ApplyOnce AI is a production-grade, local-first Manifest V3 Chrome Extension that allows job seekers to enter their professional information once and automatically reuse it across company career portals (Greenhouse, Lever, Workday, and custom sites) with zero privacy risks.

---

## 🌟 Key Features & Modules

1. **Comprehensive Master Profile**:
   - Complete legal identity (First, Middle, Last, Legal Full Name, Preferred Name, Previous Names).
   - Residential address, contact numbers, LinkedIn, GitHub, and Portfolio URLs.
   - Multiple education records, work history & internships, categorized technical skills, and project highlights.
   - Work authorization, visa sponsorship, relocation preferences, and salary expectations.

2. **Adaptive Profile Intelligence & Strict Disambiguation**:
   - Dynamic custom-field system that organically expands your profile as new company questions are encountered.
   - Strict differentiation between **Legal Name** vs **Preferred Name**, and **Current Salary** vs **Expected Salary**.
   - Categories: *Personal, Legal, Contact, Education, Employment, Compensation, Work Authorization, Preferences, Additional Information*.

3. **Missing Information Detection & Permission Workflow**:
   - Automatically inspects input attributes, ARIA descriptions, and context to identify questions missing from your profile.
   - Presents a non-intrusive dialog allowing the user to provide values with four explicit choices:
     - **Save Permanently to Profile** (user consented dynamic expansion)
     - **Use Once Only** (for this company only)
     - **Skip**
     - **Not Applicable**
   - Strictly never invents or hallucinates candidate data.

4. **Universal Field Memory**:
   - Learns and remembers confirmed field selector-to-profile mappings per domain or universally.
   - Stores zero personal values in the mapping dictionary for complete security.

5. **Client-Side Resume Management**:
   - Built-in PDF.js parser extracts candidate name, contact, education, skills, and experience directly in your browser.
   - User-verified profile import with section-by-section approval checkboxes.
   - Stored safely in browser IndexedDB.

6. **Smart Autofill Engine**:
   - Dispatches native setter prototypes and synthetic React/Angular/Vue input events.
   - Supports text, email, tel, date, numbers, textareas, dropdowns, checkboxes, and radio button groups.
   - Powered by MutationObserver to handle dynamically rendered inputs and multi-step application wizards.
   - Highlights autofilled fields with a subtle blue ring indicator.
   - **Never auto-submits** applications, leaving you in complete control.

7. **Job Description Analyzer**:
   - 100% local rule-based keyword & requirement matching with zero external API costs.
   - Highlights matching vs missing technical skills and identifies relevant candidate projects.

8. **Job Application Tracker**:
   - Full Kanban / List tracking of submitted jobs: *Interested, Preparing, Applied, Assessment, Interview, Offer, Rejected, Withdrawn*.
   - Filter by status, search by company or title, and add private interview notes.

9. **Security & Privacy Architecture**:
   - **100% Local-First**: No personal data is transmitted to external servers.
   - Minimum Chrome permissions: `activeTab`, `storage`, `scripting`, `tabs`.
   - Strictly ignores password fields, OTP/2FA tokens, CAPTCHAs, and credit card / payment credentials.

---

## 🚀 How to Install and Run in Google Chrome

### Step 1: Build the Extension Bundle
Ensure you have Node.js installed, then run:
```bash
npm install
npm run build
```
This generates the standalone Manifest V3 extension bundle in the `dist/` directory.

### Step 2: Load Unpacked into Chrome
1. Open Google Chrome.
2. In the URL address bar, enter: `chrome://extensions/`
3. Toggle on **Developer mode** in the top-right corner.
4. Click the **Load unpacked** button in the top-left menu.
5. Select the `dist/` directory inside this project folder:
   `/Users/apple/Documents/3@year/projects/ApplyOnce AI/dist`
6. ApplyOnce AI is now installed! Pin it to your Chrome toolbar for easy access.

---

## 🧪 Testing with the Built-in Mock Career Portal

An interactive test application form (`test-portal.html`) is provided directly in `dist/`:
1. In Chrome, open `dist/test-portal.html` (or click "Open Mock Career Portal" from the extension popup or dashboard).
2. The page simulates real application forms with standard inputs, legal name distinctions, salary expectations, radio groups, and novel questions.
3. Click the **ApplyOnce AI** extension popup icon or use the in-page floating pill in the bottom-right corner.
4. Click **Autofill Application** to see matching in action.
5. Click **Review & Fill Missing Fields** to test the adaptive profile expansion and permission dialog!

---

## 🛠 Available NPM Scripts

- `npm run build`: Bundles the popup, full dashboard, content scripts, background worker, manifest, and assets into `dist/`.
- `npm test`: Runs the Vitest automated test suite (29 tests across 7 test suites).
- `npm run typecheck`: Runs strict TypeScript compiler check (`tsc --noEmit`).
- `npm run dev`: Starts the local Vite development preview server.

---

## 📂 Project Architecture

```
ApplyOnce AI/
├── public/
│   ├── manifest.json              # Chrome Extension MV3 Manifest
│   └── icons/                     # 16x16, 48x48, 128x128 PNG extension icons
├── src/
│   ├── popup/                     # Compact Extension Action Popup
│   │   ├── PopupApp.tsx
│   │   └── main.tsx
│   ├── dashboard/                 # Master Full Tab SaaS Dashboard
│   │   ├── DashboardApp.tsx
│   │   ├── main.tsx
│   │   └── views/                 # 12 Modular Views
│   ├── background/                # Background Service Worker
│   │   └── serviceWorker.ts
│   ├── content/                   # Content Script & Shadow DOM Floating Pill
│   │   └── contentScript.ts
│   ├── profile/                   # Profile CRUD & Completeness Engine
│   │   ├── ProfileService.ts
│   │   ├── completeness.ts
│   │   └── types.ts
│   ├── autofill/                  # Universal Form Matching & React Handler
│   │   ├── FormDetector.ts
│   │   ├── FieldMatcher.ts
│   │   ├── AutofillEngine.ts
│   │   └── reactInputHandler.ts
│   ├── adaptive/                  # Adaptive Profile Intelligence
│   │   ├── MissingFieldService.ts
│   │   └── types.ts
│   ├── memory/                    # Universal Field Memory
│   │   ├── FieldLearningService.ts
│   │   └── types.ts
│   ├── resume/                    # PDF.js Parser & Resume Management
│   │   ├── PDFExtractor.ts
│   │   ├── ResumeService.ts
│   │   └── types.ts
│   ├── analyzer/                  # Job Description Analyzer
│   │   └── JobAnalyzerService.ts
│   ├── applications/              # Application Tracker Service
│   │   ├── ApplicationTrackerService.ts
│   │   └── types.ts
│   ├── storage/                   # Local Storage & IndexedDB Layer
│   │   ├── StorageService.ts
│   │   └── indexedDb.ts
│   ├── components/                # Reusable UI & Missing Information Dialog
│   └── styles/                    # Global Tailwind CSS Styles
├── tests/                         # Vitest Test Suite (29 Automated Tests)
├── scripts/
│   └── build.js                   # Multi-target Vite / Rollup build script
├── popup.html
├── dashboard.html
├── test-portal.html
├── vite.config.ts
└── tsconfig.json
```

---

## 🔒 Security & Privacy Guarantees

- **No Remote Telemetry**: Zero external tracking or analytics.
- **Strict Security Blacklist**: Password fields, 2FA/OTP inputs, CAPTCHA, credit cards, CVVs, and payment fields are completely excluded from the DOM inspector.
- **Explicit Consent**: Profile expansion only occurs when you select "Save Permanently to Profile".
- **Local Storage**: Profile data is kept strictly inside `chrome.storage.local` and IndexedDB.
# ApplyOnce-AI
