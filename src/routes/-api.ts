import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

const routes = new Hono()
	.get("/health", (c) => {
		return c.json({
			status: "ok",
			timestamp: new Date().toISOString(),
			uptime: process.uptime(),
			environment: process.env.NODE_ENV || "development",
		});
	})
	.post(
		"/echo",
		zValidator(
			"json",
			z.object({
				message: z.string().min(1),
			})
		),
		(c) => {
			const { message } = c.req.valid("json");
			return c.json({
				echo: message,
				receivedAt: new Date().toISOString(),
			});
		}
	)
	.get(
		"/user-activity",
		zValidator(
			"query",
			z.object({
				user: z.string().min(1, "User parameter is required"),
			})
		),
		async (c) => {
			const { user } = c.req.valid("query");

			const baseUrl = process.env.DATA_API_BASEURL || process.env.POLYMARKET_DATA_API;

			if (!baseUrl) {
				return c.json({ error: "API base URL is not configured" }, 500);
			}

			try {
				const url = new URL("/activity", baseUrl);
				url.searchParams.set("user", user);
				url.searchParams.set("limit", "500");

				const response = await fetch(url.toString(), {
					method: "GET",
					headers: {
						"Content-Type": "application/json",
					},
				});

				if (!response.ok) {
					return c.json(
						{
							error: "Failed to fetch user activity",
							status: response.status,
						},
						500
					);
				}

				const data = await response.json();
				return c.json(data);
			} catch (error) {
				return c.json(
					{
						error: "Failed to fetch user activity",
						message: error instanceof Error ? error.message : "Unknown error",
					},
					500
				);
			}
		}
	)
	.all(
		"/polymarket/*",
		zValidator(
			"query",
			z.object({
				user: z.string().min(1, "User parameter is required"),
			})
		),
		async (c) => {
			const baseUrl = process.env.DATA_API_BASEURL || process.env.POLYMARKET_DATA_API;

			if (!baseUrl) {
				return c.json({ error: "API base URL is not configured" }, 500);
			}

			try {
				// Extract the path after /api/polymarket
				const path = c.req.path.replace("/api/polymarket", "") || "/";

				// Get all query parameters
				const queryParams = c.req.query();

				// Build the target URL
				const targetUrl = new URL(path, baseUrl);

				// Add all query parameters
				Object.entries(queryParams).forEach(([key, value]) => {
					if (value) {
						targetUrl.searchParams.set(key, value);
					}
				});

				// Get the request method
				const method = c.req.method;

				// Prepare fetch options
				const fetchOptions: RequestInit = {
					method,
					headers: {
						"Content-Type": "application/json",
						Accept: "application/json",
					},
				};

				// Add body for POST, PUT, PATCH requests
				if (["POST", "PUT", "PATCH"].includes(method)) {
					try {
						const body = await c.req.json();
						fetchOptions.body = JSON.stringify(body);
					} catch {
						// If body parsing fails, try to get raw body
						const body = await c.req.text();
						if (body) {
							fetchOptions.body = body;
						}
					}
				}

				// Forward the request to Polymarket API
				const response = await fetch(targetUrl.toString(), fetchOptions);

				// Get the response data
				const contentType = response.headers.get("content-type");
				let responseBody: string;
				let responseContentType = "application/json";

				if (contentType?.includes("application/json")) {
					const data = await response.json();
					responseBody = JSON.stringify(data);
				} else {
					responseBody = await response.text();
					responseContentType = contentType || "text/plain";
				}

				// Return the response with the same status code
				return new Response(responseBody, {
					status: response.status,
					headers: {
						"Content-Type": responseContentType,
					},
				});
			} catch (error) {
				return c.json(
					{
						error: "Failed to proxy request to Polymarket API",
						message: error instanceof Error ? error.message : "Unknown error",
					},
					500
				);
			}
		}
	);

export type ApiRoutes = typeof routes;
export const handler = routes;
