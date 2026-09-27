# CSI Event Companion

A simple JavaScript Expo app for the CSI AITR Student Chapter. Browse upcoming events, search, view details, save events, and register using a local demo form.

## Run the app

```sh
npm install
npm start
```

Scan the QR code with Expo Go, or press `a` / `i` in the Expo terminal to open an Android or iOS simulator.

## Features

- Home screen with the CSI AITR chapter branding and featured event
- Searchable list of eight upcoming demo events
- Event details and registration form with required-field, email, and phone validation
- Saved events and registrations stored on the device with AsyncStorage
- Duplicate registrations are prevented
- Bottom navigation between Home, Events, Saved, and Registrations

## Project files

- `App.js` — screens, navigation, form, and local state
- `events.js` — local demo events
- `assets/csi-logo.png` and `assets/aitr-logo.png` — CSI and institute logos

This is a student-level frontend demo. It does not use a backend, account system, or API.
