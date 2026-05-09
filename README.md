# Weather

A premium weather experience built with React, Vite, Tailwind CSS, Framer Motion, Zustand, and Capacitor.

This project ships as both:
- a responsive web app
- an Android APK built from the same codebase

It uses the Open-Meteo ecosystem for weather, geocoding, and air quality data, with no API key required.

## Live Experience

The app is designed as a hero-first weather dashboard with fast search, smooth motion, and a mobile-friendly layout. It focuses on one task: quickly finding a city and seeing the full weather picture at a glance.

## APK Download

Download the current Android debug APK here:

[Download APK](android/app/build/outputs/apk/debug/app-debug.apk)

APK details:
- Format: Android debug APK
- App ID: `com.arun.weather`
- Built with Capacitor
- Same UI and features as the web app

## Web App Features

### Search and City Lookup
- Open-Meteo Geocoding search with no API key
- Debounced autocomplete search
- Request cancellation with AbortController
- Recent searches saved in localStorage
- Keyboard navigation with Arrow Up, Arrow Down, Enter, and Escape
- Browser autofill disabled so only app suggestions appear
- Dropdown positioning fixed to stay above cards and avoid clipping
- Smooth click selection without premature blur

### Weather Dashboard
- Current conditions hero card
- Temperature, feels-like temperature, humidity, wind, UV, visibility, and pressure
- Hourly forecast
- 7-day forecast
- Weather alerts panel
- AQI and air quality breakdown
- Lifestyle and insight recommendations
- Dynamic weather background and particle effects
- Day/night theming based on local time

### Saved Cities and State
- Saved city cards for quick switching
- Active city tracking
- Atomic updates when a city is selected
- Coordinates, weather, forecast, AQI, suggestions, and timestamps all refresh together
- Clean state management with Zustand

### UX and Accessibility
- Mobile-first responsive layout
- Sticky search bar for fast access
- Premium glass-style surfaces and motion transitions
- Accessible combobox/listbox structure
- Conditional ARIA attributes to avoid invalid states
- Strong contrast and keyboard support

### Offline and Error Handling
- Offline state handling
- GPS/location error handling
- Search error states
- Empty result states
- Graceful loading skeletons

## APK Features

The Android APK includes the same core weather experience as the web app, plus Android-specific behavior:
- Capacitor integration for native Android packaging
- Status bar styling
- Splash screen handling
- Android back-button handling
- Native geolocation support
- Same search, forecast, AQI, and saved city experience as the web app

## Tech Stack

- React 19
- Vite 8
- Tailwind CSS 3
- Framer Motion
- Zustand
- Axios
- Capacitor
- Open-Meteo APIs
- Big Data Cloud reverse geocoding

## APIs Used

### Open-Meteo Geocoding
Used for city search and autocomplete.

Endpoint:
`https://geocoding-api.open-meteo.com/v1/search`

Example query:
`?q=surat&count=8&language=en&format=json`

### Open-Meteo Weather
Used for current weather, hourly forecast, and daily forecast.

### Open-Meteo Air Quality
Used for AQI and pollution metrics.

### Big Data Cloud Reverse Geocoding
Used to convert coordinates into a readable location label.

## Project Structure

- `src/App.jsx` - main application shell and state orchestration
- `src/components/SearchBar.jsx` - production autocomplete search UI
- `src/hooks/useSearchAutocomplete.js` - debounced search, cancellation, recent searches
- `src/hooks/useWeather.js` - weather data fetching and refresh logic
- `src/api/weather.js` - Open-Meteo and geocoding API layer
- `android/` - Capacitor Android project

## Getting Started

### Install dependencies

```bash
npm install
```

### Run the web app

```bash
npm run dev
```

### Build the web app

```bash
npm run build
```

### Preview the production build

```bash
npm run preview
```

## Build the Android APK

If you want to rebuild the APK locally:

```bash
cd android
.\gradlew.bat assembleDebug
```

The APK output is generated at:

`android/app/build/outputs/apk/debug/app-debug.apk`

If you want a release build instead:

```bash
cd android
.\gradlew.bat assembleRelease
```

## Notes

- The current APK link points to the generated debug artifact in this repository workspace.
- Open-Meteo does not require an API key.
- The search system is optimized to avoid browser autofill and stale weather updates.

## Validation

The app has been validated with:
- production build success
- test suite success
- accessibility checks
- Android APK build success

## License

No license has been declared yet.
