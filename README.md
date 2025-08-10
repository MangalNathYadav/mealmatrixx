# MealMatrix - Food Tracking Made Simple https://hackatime-badge.hackclub.com/U059S5F9GG5/mealmatrixx

<div align="center">
  <a href="https://shipwrecked.hackclub.com/?t=ghrm" target="_blank">
    <img src="https://hc-cdn.hel1.your-objectstorage.com/s/v3/739361f1d440b17fc9e2f74e49fc185d86cbec14_badge.png" 
         alt="This project is part of Shipwrecked, the world's first hackathon on an island!" 
         style="width: 35%;">
  </a>
</div>

MealMatrix is a comprehensive web application designed to help users track their nutrition goals and meals effortlessly. The app provides an intuitive interface for monitoring daily calorie intake, macronutrient distribution, and overall nutrition progress.

![MealMatrix Logo](./assets/mealmatrixx_logo.png)

## Features

### 🍽️ Meal Tracking
- Add and log your daily meals with detailed nutritional information
- Track calories, protein, carbohydrates, and fat intake
- View your meal history and analyze patterns

### 🎯 Nutrition Goals
- Set personalized nutrition goals based on your needs
- Monitor daily progress toward your calorie and macronutrient targets
- Adjust goals based on your activity level and weight management objectives

### 📊 Dashboard Insights
- Get a comprehensive overview of your nutrition data 
- View visual representations of your progress
- Track trends over time with easy-to-understand graphs

### 💡 AI-Powered Features
- Receive personalized nutrition tips based on your eating habits
- Get suggestions for improving your diet quality
- Advanced AI features to enhance your nutrition journey

### 👤 User Profiles
- Create and manage your personal profile
- Set your preferences for a customized experience
- Track your fitness journey over time

## Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection

### Installation
1. The application is web-based and doesn't require installation
2. Simply visit the MealMatrix website to get started

### Local Development Setup
1. Clone the repository:
   ```
   git clone https://github.com/yourusername/mealmatrixx.git
   ```

2. Navigate to the project directory:
   ```
   cd mealmatrixx
   ```

3. Install dependencies (if applicable):
   ```
   npm install
   ```

4. Start a local development server:
   ```
   npm start
   ```
   or use any simple HTTP server:
   ```
   npx http-server
   ```

5. Open the application in your browser at `http://localhost:8080`

## Technology Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Firebase (Authentication, Realtime Database)
- **AI Features**: Integration with AI services for nutrition recommendations
- **Responsive Design**: Mobile-friendly interface for on-the-go tracking

## Firebase Configuration

The application utilizes Firebase for authentication and data storage. To set up your own Firebase instance:

1. Create a Firebase project in the [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication (Email/Password) and Realtime Database services
3. Update the Firebase configuration in `firebase-config.js` with your project credentials:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  databaseURL: "YOUR_DATABASE_URL",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

## Directory Structure

- `/assets`: Contains images, CSS, and JavaScript files
- `/assets/css`: Stylesheet files for different components
- `/assets/js`: JavaScript modules for application functionality
- `/assets/js/services`: Service modules for Firebase and AI integrations
- `/firebase-functions`: Backend functions for server-side processing

## Usage Guide

1. **Registration/Login**: Create an account or sign in to access your personalized dashboard
2. **Dashboard**: View your daily nutrition summary and progress
3. **Add Meal**: Record your meals with detailed nutritional information
4. **Nutrition Goals**: Set and manage your nutrition targets
5. **Profile**: Update your personal information and preferences

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add some amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the [MIT License](LICENSE).

## Acknowledgments

- Developers and contributors who helped build this application
- Firebase for providing authentication and database services
- Users who provided valuable feedback during development

## Application Flowchart

```
┌─────────────────────┐
│                     │
│    Landing Page     │
│    (index.html)     │
│                     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐     ┌─────────────────────┐
│                     │     │                     │
│  User Registration  │◄────┤    User Login       │
│  (register.html)    │     │    (login.html)     │
│                     │     │                     │
└──────────┬──────────┘     └─────────┬───────────┘
           │                          │
           │                          │
           └──────────────┬───────────┘
                          │
                          ▼
┌─────────────────────────────────────┐
│                                     │
│           Dashboard                 │
│        (dashboard.html)             │
│                                     │
└───┬─────────────┬───────────────┬───┘
    │             │               │
    ▼             ▼               ▼
┌─────────┐  ┌────────────┐  ┌────────────┐
│         │  │            │  │            │
│ Add Meal│  │ Nutrition  │  │  Profile   │
│         │  │   Goals    │  │            │
│         │  │            │  │            │
└────┬────┘  └─────┬──────┘  └─────┬──────┘
     │             │               │
     ▼             ▼               ▼
┌─────────┐  ┌────────────┐  ┌────────────┐
│         │  │            │  │            │
│ Log Food│  │ Set Calorie│  │  Update    │
│ Details │  │ & Macro    │  │  User Info │
│         │  │ Targets    │  │            │
└────┬────┘  └─────┬──────┘  └────────────┘
     │             │
     │             │
     └─────────────┘
            │
            ▼
┌─────────────────────────────────────────┐
│                                         │
│    AI-Powered Nutrition Analysis        │
│    & Personalized Recommendations       │
│                                         │
└─────────────────────────────────────────┘
```

---

Made with ❤️ by Mangal
