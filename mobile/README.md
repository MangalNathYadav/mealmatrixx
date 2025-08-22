# MealMatrix Mobile

This is the mobile version of the MealMatrix web application, with a mobile-first design, bottom navigation, and the same core features optimized for smaller screens.

## Features

- **Responsive Mobile Design**: Optimized for mobile devices with touch-friendly controls
- **Bottom Navigation**: Easy access to all main features
- **Dashboard**: View daily nutrition summary and recent meals
- **Add Meals**: Quickly log your meals with calorie and macro information
- **Nutrition Goals**: Set and track your daily calorie and macro targets
- **AI Features**: Get meal analysis and personalized nutrition tips
- **User Profile**: Manage your personal information and settings

## How to Use

1. Open the mobile version by navigating to the `/mobile` directory from your web browser
2. Register or log in to your account
3. Use the bottom navigation to switch between different sections of the app:
   - Dashboard: Overview of today's nutrition and recent meals
   - Add Meal: Log your meals with nutritional information
   - Goals: Set and manage your nutrition targets
   - AI Tools: Use AI to analyze meals and get personalized tips
   - Profile: Manage your account settings and personal information

## Implementation Details

The mobile version follows a single-page application (SPA) approach, where content is dynamically loaded based on the selected navigation item without full page reloads. This creates a more app-like experience with smooth transitions between sections.

### Key Components

- **Bottom Navigation**: Fixed at the bottom of the screen for easy thumb access
- **Template System**: Each page content is defined as a template that gets loaded into the main content area
- **Client-side Routing**: Uses hash-based routing for navigation without page reloads
- **Responsive Design**: Mobile-first approach with touch-optimized UI elements
- **Firebase Integration**: Maintains the same backend functionality as the desktop version

### Files Structure

```
mobile/
├── index.html           # Main entry point with templates for all pages
├── assets/
│   ├── css/
│   │   └── mobile-styles.css   # Mobile-specific styles
│   └── js/
│       ├── app.js             # Core app functionality and navigation
│       ├── auth.js            # Authentication module
│       ├── dashboard.js       # Dashboard functionality
│       ├── addMeal.js         # Meal logging functionality
│       ├── goals.js           # Nutrition goals management
│       ├── advanced-features.js # AI features and tools
│       ├── profile.js         # User profile management
│       ├── services/          # Firebase and API services
│       └── utils/             # Utility functions
```

## Development Notes

- All Firebase functionality is shared with the main app
- Bottom navigation dynamically updates active state based on the current page
- Pages are loaded asynchronously as modules to improve performance
- The app maintains authentication state across page transitions
