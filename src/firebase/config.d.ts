import type { Auth } from "firebase/auth";
import type { Database } from "firebase/database";

export const auth: Auth;
export const database: Database;

declare const app: unknown;
export default app;
