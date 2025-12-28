import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { convertTimestampToDate } from "../utils";

describe("convertTimestampToDate", () => {
	// Save the original timeZone getter to restore later
	let originalTimeZone: PropertyDescriptor | undefined;

	beforeAll(() => {
		// Force Intl.DateTimeFormat to use UTC for all dates in Node
		// @ts-ignore
		originalTimeZone = Object.getOwnPropertyDescriptor(Intl.DateTimeFormat.prototype, 'resolvedOptions');
		// Monkey-patch resolvedOptions to always return UTC as timeZone
		// This does not affect the output for browsers, but for Node/Vitest it ensures consistency
		Object.defineProperty(Intl.DateTimeFormat.prototype, 'resolvedOptions', {
			value: function () {
				return { timeZone: 'UTC' };
			},
			configurable: true,
		});
	});

	afterAll(() => {
		// Restore the original resolvedOptions if it existed
		if (originalTimeZone) {
			Object.defineProperty(Intl.DateTimeFormat.prototype, 'resolvedOptions', originalTimeZone);
		}
	});

	it("converts a UNIX timestamp (seconds) to a formatted date string in UTC", () => {
		// 01 Jan 2024 12:34:00 UTC
		const timestamp = 1704112440;
		// Will match the string if the implementation uses UTC
		expect(convertTimestampToDate(timestamp)).toBe("1/1/2024, 12:34 PM");
	});

	it("handles epoch zero correctly in UTC", () => {
		expect(convertTimestampToDate(0)).toBe("1/1/1970, 12:00 AM");
	});

	it("handles negative timestamps (dates before 1970) in UTC", () => {
		// -315619200 is 1 Jan 1960, 00:00:00 UTC
		expect(convertTimestampToDate(-315619200)).toBe("1/1/1960, 12:00 AM");
	});

	it("handles large future timestamps in UTC", () => {
		// 32503680000 is year 3000-01-01, 00:00:00 UTC
		expect(convertTimestampToDate(32503680000)).toBe("1/1/3000, 12:00 AM");
	});
});

