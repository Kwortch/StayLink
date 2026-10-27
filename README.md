# StayLink Mobile

StayLink is a mobile hotel reservation application for discovering rooms, planning stays, and managing reservations across popular Philippine destinations.

The app is built with Expo and React Native, uses Expo Router for file-based navigation, and connects to Firebase Authentication and Realtime Database for user accounts, room data, inventory, and reservations.

## Features

### Discover and search

- Browse featured rooms and hotel experiences.
- Search by destination, including Manila, Cebu, Boracay, Palawan, Davao, Baguio, Batangas, Tagaytay, Bohol, Siargao, and Iloilo.
- View room photos, room categories, amenities, prices, ratings, availability, and destinations.
- Explore the interactive StayLink Promise section:
  - Concierge
  - Fine Dining
  - Wellness Spa
  - Valet

### Reservations

- Select check-in and check-out dates with a calendar picker.
- Choose a check-in time.
- Enter the lead guest and contact number.
- Review room pricing, extras, taxes, and total cost before confirming.
- Reserve rooms using inventory-aware Firebase transactions.
- Prevent reservations when the selected room is unavailable.

### My Stays

- View upcoming and past reservations.
- See reservation images, dates, guests, room details, and status.
- Open a check-in details view with the reservation ID, lead guest, dates, times, and included extras.
- Cancel eligible reservations through a guided cancellation flow.
- Review the cancellation policy and provide a cancellation reason.
- Restore room inventory when a reservation is cancelled.

### Loyalty and vouchers

- Earn points from the final booking amount after the stay has ended.
- Automatically lock eligible reservations after checkout; locked reservations cannot be cancelled.
- Use the requested membership tiers:
  - Bronze: 0–4,999 points, 1 point per ₱100 spent.
  - Silver: 5,000–14,999 points, 1.5 points per ₱100 spent and a 5% discount.
  - Gold: 15,000–29,999 points, 2 points per ₱100 spent and a 10% discount.
  - Platinum/Diamond: 30,000+ points, 3 points per ₱100 spent and a 15% discount.
- Browse tier benefits in the dedicated Rewards tab.
- Redeem available food, welcome drink, breakfast, and airport transfer vouchers with points.
- Keep redeemed vouchers in the user profile for later use.

### Profile and preferences

- Manage account details, address, and contact number.
- Select preferred room type, bed preference, smoking preference, and language.
- Enable or disable Email, SMS, and Push notifications independently.
- Use PHP as the fixed app currency.

### Account creation

- Register with an email address and password.
- Provide an address and contact number.
- Use Philippine location suggestions while entering an address.

## Technology

- [Expo](https://expo.dev/) SDK 58
- [React Native](https://reactnative.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [TypeScript](https://www.typescriptlang.org/)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Firebase Realtime Database](https://firebase.google.com/docs/database)
- `@react-native-community/datetimepicker`
- Expo Google Fonts: Outfit and Playfair Display

## Getting started

### Requirements

- Node.js LTS
- npm
- Android Studio and an Android emulator, or
- Expo Go on a physical Android or iOS device

### Installation

Clone the repository, enter the project directory, and install dependencies:

```bash
git clone https://github.com/Kwortch/StayLink.git
cd StayLinkMobile
npm install
```

### Run the app

Start the Expo development server:

```bash
npx expo start
```

Then choose one of the available targets:

```bash
npm run android
npm run ios
npm run web
```

The Firebase project configuration is located in `src/firebase/config.js`. Keep credentials and environment-specific configuration out of commits when adapting the app for another Firebase project.

## Project structure

```text
src/
├── app/                 # Expo Router screens and tab navigation
├── components/          # Shared UI components
├── constants/           # Theme and shared design values
├── data/                # Local room catalog and destination data
├── firebase/            # Firebase initialization
└── lib/                 # Firebase types and reservation helpers
```

Important screens include:

- `src/app/(tabs)/discover.tsx` — destination search, featured rooms, and StayLink Promise
- `src/app/(tabs)/my-stays.tsx` — reservation history, details, and cancellation
- `src/app/(tabs)/profile.tsx` — profile and preference management
- `src/app/room/[id].tsx` — room details and reservation review
- `src/app/register.tsx` — account registration

## Development checks

Run the TypeScript compiler without emitting files:

```bash
npx tsc --noEmit
```

Run the configured lint command:

```bash
npm run lint
```

## Data and availability

The app includes a local catalog of rooms for the main discovery experience and can also read hotel and reservation data from Firebase. Room inventory is tracked by room ID in Firebase Realtime Database. Reservation creation and cancellation update inventory transactionally to help prevent overbooking.

## License

This project is maintained as a school and portfolio application. Add a formal license before distributing or reusing the code outside the project.
