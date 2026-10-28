import type { Auth } from "firebase/auth";
import type { FirebaseApp } from "firebase/app";
import type { Database } from "firebase/database";

export const auth: Auth;
export const database: Database;

declare const app: FirebaseApp;
export default app;
