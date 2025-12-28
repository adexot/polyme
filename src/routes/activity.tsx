import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import type { Activity } from "@/types/polymarket";
import { convertTimestampToDate } from "@/lib/utils";

export const Route = createFileRoute("/activity")({
	component: RouteComponent,
});

function RouteComponent() {
	const [userInput, setUserInput] = useState(import.meta.env.VITE_TEST_USER || "");
	const [activityData, setActivityData] = useState<Activity[] | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const debouncedUser = useDebounce(userInput, 500);

	const fetchUserActivity = async (user: string) => {
		if (!user.trim()) {
			setActivityData(null);
			return;
		}

		setLoading(true);
		setError(null);

		try {
			const url = new URL("/api/user-activity", window.location.origin);
			url.searchParams.set("user", user);

			const response = await fetch(url.toString(), {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
				},
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(
					errorData.error || "Failed to fetch user activity"
				);
			}

			const data = await response.json();
			// Handle both array and object responses
			const activities = Array.isArray(data) ? data : data.data || [];
			setActivityData(activities);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "An unknown error occurred"
			);
			setActivityData(null);
		} finally {
			setLoading(false);
		}
	};

	// Fetch when debounced user changes
	useEffect(() => {
		if (debouncedUser.trim()) {
			fetchUserActivity(debouncedUser);
		} else {
			setActivityData(null);
			setError(null);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [debouncedUser]);

	return (
		<main className="min-h-[calc(100vh-64px)] bg-[var(--color-void)] relative overflow-hidden">
			<div className="noise-overlay" />

			{/* Ambient gradient */}
			<div className="absolute inset-0 bg-gradient-to-b from-[var(--color-coral)]/5 via-transparent to-[var(--color-cyan)]/5" />

			<div className="relative z-10 min-h-[calc(100vh-64px)] px-6 py-12">
				<div className="w-full max-w-7xl mx-auto">
					{/* Header */}
					<div className="mb-8">
						<h1 className="text-4xl font-bold text-[var(--color-bone)] mb-2">
							User Activity
						</h1>
						<p className="text-[var(--color-ash)]">
							Search for a user's activity on Polymarket
						</p>
					</div>

					{/* Search Input */}
					<div className="mb-8">
						<div className="relative">
							<input
								type="text"
								value={userInput}
								onChange={(e) => setUserInput(e.target.value)}
								placeholder="Enter user address (e.g., 0x56687bf447db6ffa42ffe2204a05edaa20f55839)"
								className="w-full px-4 py-3 bg-[var(--color-slate)] border border-[var(--color-mist)] rounded-lg text-[var(--color-bone)] placeholder:text-[var(--color-ash)] focus:outline-none focus:ring-2 focus:ring-[var(--color-cyan)] focus:border-transparent transition-all duration-300 font-mono text-sm"
							/>
							{loading && (
								<div className="absolute right-4 top-1/2 -translate-y-1/2">
									<div className="w-5 h-5 border-2 border-[var(--color-cyan)] border-t-transparent rounded-full animate-spin" />
								</div>
							)}
						</div>
						{error && (
							<div className="mt-3 px-4 py-2 bg-[var(--color-coral)]/10 border border-[var(--color-coral)]/30 rounded-lg text-[var(--color-coral)] text-sm">
								{error}
							</div>
						)}
					</div>

					{/* Loading */}
					{!userInput && !loading && (
						<div className="text-center py-12 text-[var(--color-ash)]">
							<p>Enter a user address to search for activity.</p>
						</div>
					)}

					{/* No data */}
					{activityData && activityData.length === 0 && (
						<div className="text-center py-12 text-[var(--color-ash)]">
							<p>No activity found for this user.</p>
						</div>
					)}

					{/* Activity Table */}
					{activityData && activityData.length > 0 && (
						<div className="bg-[var(--color-slate)] border border-[var(--color-mist)] rounded-lg overflow-hidden">
							<div className="overflow-x-auto">
								<table className="w-full">
									<thead className="bg-[var(--color-charcoal)] border-b border-[var(--color-mist)]">
										<tr>
											<th
												className="px-6 py-4 text-left text-xs font-semibold text-[var(--color-cyan)] uppercase tracking-wider"
											>
												Time
											</th>
											<th
												className="px-6 py-4 text-left text-xs font-semibold text-[var(--color-cyan)] uppercase tracking-wider"
											>
												Title
											</th>
											<th
												className="px-6 py-4 text-left text-xs font-semibold text-[var(--color-cyan)] uppercase tracking-wider"
											>
												Type
											</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-[var(--color-mist)]">
										{activityData.map((activity, index) => (<ActivityTable key={index} activity={activity} />))}
									</tbody>
								</table>
							</div>
						</div>
					)}
				</div>
			</div>
		</main>
	);
}

export const ActivityTable = ({ activity }: { activity: Activity }) => {
	return (
		<tr
			className="hover:bg-[var(--color-charcoal)]/50 transition-colors"
		>
			<td
				className="px-6 py-4 text-sm text-[var(--color-bone)]"
			>
				{convertTimestampToDate(activity.timestamp)}
			</td>
			<td
				className="px-6 py-4 text-sm text-[var(--color-bone)]"
			>
				{activity.title}
			</td>
			<td
				className="px-6 py-4 text-sm text-[var(--color-bone)]"
			>
				{activity.type}
			</td>
		</tr>
	)
}
