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
				return c.json(
					{ error: "API base URL is not configured" },
					500
				);
			}

			try {
				const url = new URL("/activity", baseUrl);
				url.searchParams.set("user", user);

				console.log(url.toString(), user);

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
						message:
							error instanceof Error ? error.message : "Unknown error",
					},
					500
				);
			}
		}
	);

export type ApiRoutes = typeof routes;
export const handler = routes;
