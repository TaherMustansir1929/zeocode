import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import sessions from "./routes/sessions";

const app = new Hono();

app.onError((err, c) => {
	if (err instanceof HTTPException) {
		return c.json({ error: err.message || "Request failed" }, err.status);
	}

	console.error("Unhandled server error", err);
	return c.json({ error: "Internal Server Error" }, 500);
});

const routes = app.route("/sessions", sessions);

export type AppType = typeof routes;

// idleTimeout must be high, otherwise LLM tool calls might not complete
export default { port: 3000, fetch: app.fetch, idleTimeout: 255 };
