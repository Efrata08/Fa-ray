# ፍሬ (Fa-ray)

Offline-first inventory management for independent pharmacies in Ethiopia.

## About

Small pharmacies in Addis Ababa track stock on paper, leading to expired 
medication and stockouts. Most existing inventory software assumes reliable 
internet, which these pharmacies don't have. ፍሬ works fully offline.

## Features

- Record sales and track stock with no network connection
- FEFO (first-expired-first-out) batch tracking
- Expiry alerts
- Demand forecasting and analytics
- Bilingual English/Amharic with a 239-item medicine database

## Stack

- React Native (Expo)
- AsyncStorage — local-first persistence
- Supabase (PostgreSQL)

## Setup

```bash
npm install
npx expo start
```

## Status

Launching on Google Play. Sync layer in progress.

## Team

Built with Ferida Mohammed through the Haverford Innovation Incubator.
