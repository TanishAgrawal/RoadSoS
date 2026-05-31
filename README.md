# ROADSoS

ROADSoS is a Progressive Web App for quickly locating nearby emergency services during road incidents. It combines browser geolocation, reverse geocoding, cached service data, and live map results to help users find hospitals, police, ambulance services, fire brigades, towing, tyre shops, and car showrooms.

## Introduction

The app is designed for fast use on mobile devices. It starts from the user’s current location or a manually entered area, fetches nearby emergency services, and presents them in a map and SOS-focused interface. The app also keeps a lightweight local cache so it can stay useful when the network is slow or temporarily unavailable.

## Techstack Used

- React 19
- Vite
- Tailwind CSS 4
- Leaflet and React Leaflet
- vite-plugin-pwa
- OpenStreetMap and Overpass-based data fetching

## APIs Used

- Browser Geolocation API for detecting the user’s location
- Nominatim for reverse geocoding and manual location search
- Overpass API for nearby emergency service data
- Google Maps links for directions

## Data

ROADSoS uses a mix of live and locally cached data.

- Emergency service data is fetched from public OSM/Overpass queries.
- Location data is obtained from the browser or from Nominatim search results.
- Nearby service results are cached in the browser so the app can reuse recent data.
- Emergency numbers are stored in a local country mapping for quick access.

## File Structure

- `src/App.jsx` - Main app shell and view switching
- `src/main.jsx` - React entry point
- `src/components/` - UI components such as the map, SOS button, search fallback, and forms
- `src/hooks/` - Custom hooks for geolocation and nearby service loading
- `src/services/` - Data fetching, caching, matching, and emergency number logic
- `src/utils/` - Shared utility functions
- `public/` - Static assets, including the app logo and PWA icons

## Installation Guide

1. Install dependencies:

	```bash
	npm install
	```

2. Start the development server:

	```bash
	npm run dev
	```

3. Build the production version:

	```bash
	npm run build
	```

4. Preview the production build locally:

	```bash
	npm run preview
	```

5. For mobile testing, open the deployed HTTPS site on your phone and use the browser install option to add ROADSoS to the home screen.
