import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
const firebaseConfig = {
  apiKey: "AIzaSyAU7ytKyY37LeGTYvRi48fkmTTiPVdgCCI",
  authDomain: "staylink-hotel-reservation.firebaseapp.com",
  databaseURL: "https://staylink-hotel-reservation-default-rtdb.firebaseio.com",
  projectId: "staylink-hotel-reservation",
  storageBucket: "staylink-hotel-reservation.firebasestorage.app",
  messagingSenderId: "1058528170148",
  appId: "1:1058528170148:web:12c044a7c1ef9212b61631",
};
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);
export default app;
