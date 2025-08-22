# MealMatrix Mobile

## 📱 What is MealMatrix Mobile?
MealMatrix Mobile is the mobile-first version of the MealMatrix nutrition tracking platform. It is designed to help users log meals, analyze nutrition, set goals, and receive AI-powered insights—all optimized for smartphones and tablets. The app leverages Google Gemini AI for smart meal analysis and planning, and Firebase for secure authentication and data storage.

---

## 🏁 Background & Motivation
Tracking nutrition is essential for health, fitness, and wellness. Most apps are either too complex or not optimized for mobile. MealMatrix Mobile solves this by providing:
- A clean, fast, and intuitive mobile experience
- AI-powered features for instant feedback
- Seamless device redirection for best user experience

---

## 🌟 Key Features
### Core Nutrition Tracking
- Add meals manually or via AI analysis
- Track calories, protein, carbs, fat
- View meal history and progress

### AI-Powered Tools
- **Meal Analyzer:** Enter a meal description, get instant nutrition breakdown using Gemini AI
- **Personalized Nutrition Tips:** AI generates actionable tips based on your goals and history
- **Meal Planning Assistant:** AI creates a 3-day meal plan tailored to your preferences

### User Experience
- Modern popup UI for all AI results
- Loading spinners and disabled states for all AI buttons
- Responsive design for all screen sizes
- Device redirection for seamless navigation

### Security & Data
- Firebase authentication (email/password)
- Firebase real-time database for meal storage
- No sensitive data stored on device

---

## 🧑‍💻 Technical Stack
- **Frontend:** HTML5, CSS3, Vanilla JavaScript (ES6 modules)
- **AI:** Google Gemini API (v2.0-flash)
- **Backend:** Firebase (Auth + Realtime Database)
- **Icons:** FontAwesome
- **Device Detection:** User agent + screen width

---

## 🔄 Device Redirection Logic
- **Desktop users** visiting `index.html` are redirected to `mobile/index.html` if on a mobile device
- **Mobile users** visiting `mobile/index.html` are redirected to `../index.html` if on a desktop device
- Detection uses both user agent and screen width for accuracy
- Prevents redirect loops by checking URL path

---

## 🤖 AI Workflow
1. **User enters meal description**
2. **GeminiClient** sends prompt to Gemini API
3. **Gemini API** returns nutrition data (sometimes wrapped in markdown)
4. **safeParseJSON** extracts and parses JSON, even if wrapped in code blocks
5. **UI** displays results in animated popup
6. **Error Handling:** If parsing fails, user sees a helpful error message and raw response

---

## 🛠️ Setup & Usage
### 1. Clone the repository
```bash
git clone https://github.com/MangalNathYadav/mealmatrixx.git
```
### 2. Open the app
- On mobile: open `mobile/index.html`
- On desktop: open `index.html`
- Device redirection will route you automatically
### 3. Register or Login
- Use Firebase authentication
### 4. Use Features
- Add meals, analyze with AI, get tips, plan meals

---

## 🗂️ Project Structure
```
mealmatrixx/
├── index.html                # Desktop landing page
├── mobile/
│   ├── index.html            # Mobile landing page
│   ├── assets/
│   │   ├── css/
│   │   └── js/
│   ├── advanced-features.html
│   ├── ...                   # Other mobile pages
│   └── README.md             # This file
├── assets/
│   ├── mealmatrixx_logo.png
│   └── ...
├── firebase-config.js
├── firebase.json
└── ...
```

---

## ⚙️ Customization
- **Gemini API Key:** For local development, the key is hardcoded in `gemini-client.mobile.js`. For production, use secure environment variables or serverless functions.
- **Styling:** Customize CSS in `assets/css/mobile-styles.css` for mobile and `assets/css/styles.css` for desktop.
- **Popup UI:** Modify popup styles in `advanced-features.js` for custom look and feel.

---

## 🔒 Security Notes
- Never commit production API keys to the repository
- Use HTTPS for all deployments
- Firebase rules should restrict access to authenticated users only

---

## 🧩 Troubleshooting & FAQ
**Q: Why do I see a blank popup in AI features?**
A: Gemini sometimes returns markdown-wrapped JSON. The app now parses this, but if parsing fails, you’ll see the raw response for debugging.

**Q: Why am I not redirected to the correct version?**
A: Device detection uses user agent and screen width. Try resizing your browser or using a different device.

**Q: Why is the "Analyze Meal" button not working?**
A: Ensure JavaScript is enabled and all scripts are loaded. Check the console for errors.

**Q: How do I change the logo or branding?**
A: Replace `mealmatrixx_logo.png` in the `assets/` folder and update references in HTML files.

---

## 👥 Contributing
1. Fork the repository
2. Create a new branch (`git checkout -b feature-xyz`)
3. Make your changes
4. Submit a pull request with a clear description

---

## 📚 Credits
- **Design & Development:** Mangal Nath Yadav
- **AI Integration:** Google Gemini API
- **Icons:** FontAwesome
- **Frontend:** Vanilla JS, HTML, CSS
- **Backend:** Firebase

---

## 📄 License
See [../LICENSE](../LICENSE) for details.
==========================================================================================================================
==========================================================================================================================
==========================================project done ===================================================================
=========================================mghacker- mangal nath yadav=====================================================
==========================================================================================================================
==========================================================================================================================
==========================================================================================================================
==========================================
