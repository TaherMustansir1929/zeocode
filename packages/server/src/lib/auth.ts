import { createClerkClient } from "@clerk/backend";

if (!process.env.CLERK_SECRET_KEY) {
	throw new Error("CLERK_SECRET_KEY environment variable is required");
}

if (!process.env.CLERK_PUBLISHABLE_KEY) {
	throw new Error("CLERK_PUBLISHABLE_KEY environment variable is required");
}

const clerkClient = createClerkClient({
	secretKey: process.env.CLERK_SECRET_KEY,
	publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
});

/**
 * Authenticate an incoming HTTP request using Clerk OAuth tokens.
 *
 * Attempts to validate the request's OAuth token and, on success, returns the authenticated user's ID.
 *
 * @param request - The incoming Request to authenticate.
 * @returns `{ userId: string }` containing the authenticated user's ID if the request carries a valid OAuth token, `null` otherwise.
 */
export async function authenticateOAuthRequest(request: Request) {
	const requestState = await clerkClient.authenticateRequest(request, {
		acceptsToken: "oauth_token",
	});

	if (!requestState.isAuthenticated) {
		return null;
	}

	const auth = requestState.toAuth();
	if (auth.tokenType !== "oauth_token" || !auth.userId) {
		return null;
	}

	return { userId: auth.userId };
}
