export function convertTimestampToDate(timestamp: number) {
	return new Date(timestamp * 1000).toLocaleString(undefined, {
		year: "numeric",
		month: "numeric",
		day: "numeric",
		hour: "numeric",
		minute: "2-digit",
		hour12: true,
		timeZone: "UTC", // need to use UTC to guarantee consistent output
	});
}
