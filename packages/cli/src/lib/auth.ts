import {
	existsSync,
	mkdirSync,
	readFileSync,
	unlinkSync,
	writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

type AuthData = {
	token: string;
};

const AUTH_DIR = join(homedir(), ".zeocode");
const AUTH_FILE = join(AUTH_DIR, "auth.json");

/**
 * Retrieve the stored authentication token from the user's auth file.
 *
 * @returns `AuthData` containing the stored token if the file exists and contains a valid token, `null` otherwise.
 */
export function getAuth(): AuthData | null {
	try {
		const data = readFileSync(AUTH_FILE, "utf-8");
		const parsed = JSON.parse(data) as Partial<AuthData>;
		return typeof parsed.token === "string" ? { token: parsed.token } : null;
	} catch {
		return null;
	}
}

/**
 * Persist the provided authentication data to the user's auth file and ensure the file is created with restrictive permissions.
 *
 * @param data - Auth data object containing the authentication token to save
 */
export function saveAuth(data: AuthData) {
	if (!existsSync(AUTH_DIR)) {
		// Owner-only permissions (rwx------) so other users on the machine can't read tokens
		mkdirSync(AUTH_DIR, { mode: 0o700 });
	}
	writeFileSync(AUTH_FILE, JSON.stringify(data), { mode: 0o600 });
}

/**
 * Removes the stored CLI authentication file from the user's auth directory.
 *
 * If the file does not exist or cannot be removed, the function silently returns without throwing.
 */
export function clearAuth() {
	try {
		unlinkSync(AUTH_FILE);
	} catch {
		// File doesn't exist
	}
}
