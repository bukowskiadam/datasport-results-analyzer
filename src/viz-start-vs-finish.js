/**
 * Start time vs finish time scatter plot visualization
 */

import {
	calculateTimeInterval,
	generateAttribution,
	generateWatermark,
	minutesToLabel,
	parseNetTime,
	parseStartTime,
	scaleLinear,
} from "./utils.js";

const SVG_WIDTH = 1200;
const SVG_HEIGHT = 800;

/**
 * Generate start vs finish time scatter plot SVG
 * @param {Array} records - Race results data
 * @returns {string} SVG markup
 */
export function generateStartVsFinishSvg(records) {
	const PADDING_LEFT = 70;
	const PADDING_RIGHT = 30;
	const PADDING_TOP = 40;
	const PADDING_BOTTOM = 70;

	// Filter to entries with both start time and net finish time
	const finishers = records.filter(
		(entry) =>
			entry.start &&
			entry.czasnetto &&
			entry.msc &&
			entry.msc !== "0",
	);

	if (!finishers.length) {
		throw new Error("No runners with both start and net finish times found.");
	}

	// Parse times and create data points
	const tempPoints = finishers
		.map((entry) => {
			const startSeconds = parseStartTime(entry.start);
			const nettoSeconds = parseNetTime(entry.czasnetto);
			if (!startSeconds || !nettoSeconds) {
				return null;
			}
			return {
				startSeconds,
				nettoSeconds,
				name: `${entry.nazwisko || ""} ${entry.imie || ""}`.trim(),
			};
		})
		.filter(Boolean);

	if (!tempPoints.length) {
		throw new Error("Failed to parse start and net finish times.");
	}

	// Find the earliest start time (first person to start)
	const earliestStart = Math.min(...tempPoints.map((p) => p.startSeconds));

	// Calculate relative start times (seconds after first person)
	const points = tempPoints.map((p) => ({
		relativeStartSeconds: p.startSeconds - earliestStart,
		nettoSeconds: p.nettoSeconds,
		label: `${p.name} - Start: +${Math.floor((p.startSeconds - earliestStart) / 60)}:${String(Math.floor((p.startSeconds - earliestStart) % 60)).padStart(2, "0")}, Net time: ${formatNetTime(p.nettoSeconds)}`,
	}));

	// Find min/max for axes
	const relativeStartTimes = points.map((p) => p.relativeStartSeconds);
	const nettoTimes = points.map((p) => p.nettoSeconds);

	const minRelativeStart = Math.min(...relativeStartTimes);
	const maxRelativeStart = Math.max(...relativeStartTimes);
	const minNetto = Math.min(...nettoTimes);
	const maxNetto = Math.max(...nettoTimes);

	// Convert to minutes for better labeling
	const minRelativeStartMinutes = minRelativeStart / 60;
	const maxRelativeStartMinutes = maxRelativeStart / 60;
	const minNettoMinutes = minNetto / 60;
	const maxNettoMinutes = maxNetto / 60;

	// Create scales: X-axis = net finish time, Y-axis = relative start time
	const scaleX = scaleLinear(
		minNetto,
		maxNetto,
		PADDING_LEFT,
		SVG_WIDTH - PADDING_RIGHT,
	);
	const scaleY = scaleLinear(
		minRelativeStart,
		maxRelativeStart,
		SVG_HEIGHT - PADDING_BOTTOM,
		PADDING_TOP,
	);

	// Plot points
	const plotted = points
		.map((point) => {
			const cx = scaleX(point.nettoSeconds);
			const cy = scaleY(point.relativeStartSeconds);
			return `<circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="3" fill="#1f77b4" opacity="0.6"><title>${point.label}</title></circle>`;
		})
		.join("\n");

	// Generate X-axis ticks (net finish time) using the same algorithm as histograms
	const xTickElements = [];
	const timeInterval = calculateTimeInterval(minNettoMinutes, maxNettoMinutes);
	
	for (
		let minute = Math.ceil(minNettoMinutes / timeInterval) * timeInterval;
		minute <= maxNettoMinutes;
		minute += timeInterval
	) {
		const seconds = minute * 60;
		if (seconds >= minNetto && seconds <= maxNetto) {
			const x = scaleX(seconds);
			xTickElements.push(
				`<line x1="${x.toFixed(2)}" y1="${SVG_HEIGHT - PADDING_BOTTOM}" x2="${x.toFixed(2)}" y2="${SVG_HEIGHT - PADDING_BOTTOM + 6}" stroke="#333333" stroke-width="1" />`,
			);
			xTickElements.push(
				`<text x="${x.toFixed(2)}" y="${SVG_HEIGHT - PADDING_BOTTOM + 22}" text-anchor="middle" font-size="12" fill="#333333">${minutesToLabel(minute)}</text>`,
			);
		}
	}

	// Generate Y-axis ticks (relative start time) at appropriate intervals
	const yTickElements = [];
	const startRange = maxRelativeStartMinutes - minRelativeStartMinutes;
	const yInterval = startRange > 60 ? 10 : startRange > 30 ? 5 : startRange > 15 ? 2 : 1;
	const minRelativeStartMinuteRounded = Math.floor(minRelativeStartMinutes / yInterval) * yInterval;
	const maxRelativeStartMinuteRounded = Math.ceil(maxRelativeStartMinutes / yInterval) * yInterval;

	// Determine format for Y-axis labels based on max value
	const useMinuteFormat = maxRelativeStartMinutes < 60;
	const yAxisLabel = useMinuteFormat ? "Relative start time (minutes after first starter)" : "Relative start time (HH:MM after first starter)";

	for (
		let minute = minRelativeStartMinuteRounded;
		minute <= maxRelativeStartMinuteRounded;
		minute += yInterval
	) {
		const seconds = minute * 60;
		if (seconds >= minRelativeStart && seconds <= maxRelativeStart) {
			const y = scaleY(seconds);
			yTickElements.push(
				`<line x1="${PADDING_LEFT - 6}" y1="${y.toFixed(2)}" x2="${PADDING_LEFT}" y2="${y.toFixed(2)}" stroke="#333333" stroke-width="1" />`,
			);
			// Format label based on range
			const label = useMinuteFormat ? `+${minute}` : `+${minutesToLabel(minute)}`;
			yTickElements.push(
				`<text x="${PADDING_LEFT - 10}" y="${y.toFixed(2)}" text-anchor="end" alignment-baseline="middle" font-size="12" fill="#333333">${label}</text>`,
			);
		}
	}

	// Add gridlines for better readability
	const gridLines = [];
	for (
		let minute = Math.ceil(minNettoMinutes / timeInterval) * timeInterval;
		minute <= maxNettoMinutes;
		minute += timeInterval
	) {
		const seconds = minute * 60;
		if (seconds >= minNetto && seconds <= maxNetto) {
			const x = scaleX(seconds);
			gridLines.push(
				`<line x1="${x.toFixed(2)}" y1="${PADDING_TOP}" x2="${x.toFixed(2)}" y2="${SVG_HEIGHT - PADDING_BOTTOM}" stroke="#e0e0e0" stroke-width="1" />`,
			);
		}
	}

	for (
		let minute = minRelativeStartMinuteRounded;
		minute <= maxRelativeStartMinuteRounded;
		minute += yInterval
	) {
		const seconds = minute * 60;
		if (seconds >= minRelativeStart && seconds <= maxRelativeStart) {
			const y = scaleY(seconds);
			gridLines.push(
				`<line x1="${PADDING_LEFT}" y1="${y.toFixed(2)}" x2="${SVG_WIDTH - PADDING_RIGHT}" y2="${y.toFixed(2)}" stroke="#e0e0e0" stroke-width="1" />`,
			);
		}
	}

	// Generate watermark and attribution
	const watermark = generateWatermark(SVG_WIDTH, SVG_HEIGHT);
	const attribution = generateAttribution(SVG_WIDTH, SVG_HEIGHT);

	return `<svg width="${SVG_WIDTH}" height="${SVG_HEIGHT}" viewBox="0 0 ${SVG_WIDTH} ${SVG_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <title>Relative Start Time vs Net Finish Time</title>
  <desc>Scatter plot showing correlation between relative start time and net finish time for race participants</desc>
  
  <!-- White background -->
  <rect width="${SVG_WIDTH}" height="${SVG_HEIGHT}" fill="white" />
  ${watermark}
  
  <!-- Gridlines -->
  ${gridLines.join("\n  ")}
  
  <!-- Axes -->
  <line x1="${PADDING_LEFT}" y1="${PADDING_TOP}" x2="${PADDING_LEFT}" y2="${SVG_HEIGHT - PADDING_BOTTOM}" stroke="#333333" stroke-width="2" />
  <line x1="${PADDING_LEFT}" y1="${SVG_HEIGHT - PADDING_BOTTOM}" x2="${SVG_WIDTH - PADDING_RIGHT}" y2="${SVG_HEIGHT - PADDING_BOTTOM}" stroke="#333333" stroke-width="2" />
  
  <!-- X-axis ticks and labels -->
  ${xTickElements.join("\n  ")}
  
  <!-- Y-axis ticks and labels -->
  ${yTickElements.join("\n  ")}
  
  <!-- Data points -->
  ${plotted}
  <text x="${SVG_WIDTH / 2}" y="${SVG_HEIGHT - 20}" text-anchor="middle" font-size="14" fill="#333333">Net finish time</text>
  <text x="${PADDING_LEFT - 50}" y="${SVG_HEIGHT / 2}" text-anchor="middle" font-size="14" fill="#333333" transform="rotate(-90 ${PADDING_LEFT - 50} ${SVG_HEIGHT / 2})">${yAxisLabel}</text>
  ${attribution}
</svg>`;
}

/**
 * Format net time in seconds to HH:MM:SS format
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time string
 */
function formatNetTime(seconds) {
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const secs = Math.floor(seconds % 60);
	return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}
