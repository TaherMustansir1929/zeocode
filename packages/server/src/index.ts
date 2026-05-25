import * as Sentry from "@sentry/hono/bun";
import { sentry } from "@sentry/hono/bun";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

import chat from "./routes/chat";
import sessions from "./routes/sessions";

const app = new Hono();

app.use(
	sentry(app, {
		dsn: "https://c80789964f789fae437055f4a277ed08@o4511444675985408.ingest.de.sentry.io/4511444682997840",
		tracesSampleRate: 1.0,
		enableLogs: true,
		sendDefaultPii: true,
	}),
);

app.get("/debug-sentry", () => {
	// Send a log before throwing the error
	Sentry.logger.info("User triggered test error", {
		action: "test_error_endpoint",
	});
	// Send a test metric before throwing the error
	Sentry.metrics.count("test_counter", 1);
	throw new Error("My first Sentry error!");
});

app.onError((err, c) => {
	if (err instanceof HTTPException) {
		Sentry.logger.warn("Handled HTTP error", {
			status: err.status,
			message: err.message || "Request failed",
			path: c.req.path,
			method: c.req.method,
		});

		return c.json({ error: err.message || "Request failed" }, err.status);
	}

	Sentry.logger.error("Unhandled error", {
		path: c.req.path,
		method: c.req.method,
		message: err instanceof Error ? err.message : "Unknown error",
	});

	return c.json({ error: "Internal Server Error" }, 500);
});

const routes = app.route("/sessions", sessions).route("/chat", chat);

export type AppType = typeof routes;

// idleTimeout must be high, otherwise LLM tool calls might not complete
export default { port: 3000, fetch: app.fetch, idleTimeout: 255 };
