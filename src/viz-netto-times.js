/**
 * Net times scatter plot visualization
 */

import {
	generateAttribution,
	generateWatermark,
	minutesToLabel,
	parseNetTime,
	scaleLinear,
} from "./utils.js";

const SVG_WIDTH = 1200;
const SVG_HEIGHT = 600;

/**
 * Generate net times scatter plot SVG
 * @param {Array} records - Race results data
 * @returns {string} SVG markup
 */
export function generateNettoTimesSvg(records) {
	const PADDING_LEFT = 70;
	const PADDING_RIGHT = 30;
	const PADDING_TOP = 40;
	const PADDING_BOTTOM = 70;

	const finishers = records.filter(
		(entry) => entry.msc && entry.msc !== "0" && entry.czasnetto,
	);

	if (!finishers.length) {
		throw new Error("No completed runs in the data.");
	}

	const points = finishers
		.map((entry, index) => {
			const seconds = parseNetTime(entry.czasnetto);
			return seconds
				? {
						seconds,
						label:
							`${index + 1}. ${entry.nazwisko || ""} ${entry.imie || ""} - ${entry.czasnetto}`.trim(),
					}
				: null;
		})
		.filter(Boolean);

	if (!points.length) {
		throw new Error("Failed to parse net times.");
	}

	const secondsList = points.map((point) => point.seconds);
	const minSeconds = Math.min(...secondsList);
	const maxSeconds = Math.max(...secondsList);
	
	// Convert to minutes for better labeling
	const minMinutes = minSeconds / 60;
	const maxMinutes = maxSeconds / 60;

	const scaleX = scaleLinear(
		0,
		points.length - 1,
		PADDING_LEFT,
		SVG_WIDTH - PADDING_RIGHT,
	);
	const scaleY = scaleLinear(
		minSeconds,
		maxSeconds,
		SVG_HEIGHT - PADDING_BOTTOM,
		PADDING_TOP,
	);

	const plotted = points
		.map((point, index) => {
			const cx = scaleX(index);
			const cy = scaleY(point.seconds);
			return `<circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="2" fill="#1f77b4"><title>${point.label}</title></circle>`;
		})
		.join("\n");

	// Generate Y-axis ticks (time labels) at 10-minute intervals
	const yTickElements = [];
	const minMinuteRounded = Math.floor(minMinutes / 10) * 10;
	const maxMinuteRounded = Math.ceil(maxMinutes / 10) * 10;
	
	for (let minute = minMinuteRounded; minute <= maxMinuteRounded; minute += 10) {
		const seconds = minute * 60;
		if (seconds >= minSeconds && seconds <= maxSeconds) {
			const y = scaleY(seconds);
			yTickElements.push(
				`<line x1="${PADDING_LEFT - 6}" y1="${y.toFixed(2)}" x2="${PADDING_LEFT}" y2="${y.toFixed(2)}" stroke="#333333" stroke-width="1" />`
			);
			yTickElements.push(
				`<text x="${PADDING_LEFT - 10}" y="${y.toFixed(2)}" text-anchor="end" alignment-baseline="middle" font-size="12" fill="#333333">${minutesToLabel(minute)}</text>`
			);
		}
	}
	
	// Add horizontal gridlines for better readability
	const gridLines = [];
	for (let minute = minMinuteRounded; minute <= maxMinuteRounded; minute += 10) {
		const seconds = minute * 60;
		if (seconds >= minSeconds && seconds <= maxSeconds) {
			const y = scaleY(seconds);
			gridLines.push(
				`<line x1="${PADDING_LEFT}" y1="${y.toFixed(2)}" x2="${SVG_WIDTH - PADDING_RIGHT}" y2="${y.toFixed(2)}" stroke="#dddddd" stroke-width="1" opacity="0.5" />`
			);
		}
	}

	return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${SVG_WIDTH}" height="${SVG_HEIGHT}" viewBox="0 0 ${SVG_WIDTH} ${SVG_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <title>Net finish times</title>
  <desc>Each dot represents the net finish time for a finisher (only entries with non-zero placing).</desc>
  <rect x="0" y="0" width="${SVG_WIDTH}" height="${SVG_HEIGHT}" fill="#ffffff" />
  ${generateWatermark(SVG_WIDTH, SVG_HEIGHT)}
  ${gridLines.join("\n  ")}
  <line x1="${PADDING_LEFT}" y1="${SVG_HEIGHT - PADDING_BOTTOM}" x2="${SVG_WIDTH - PADDING_RIGHT}" y2="${SVG_HEIGHT - PADDING_BOTTOM}" stroke="#333333" stroke-width="1.5" />
  <line x1="${PADDING_LEFT}" y1="${SVG_HEIGHT - PADDING_BOTTOM}" x2="${PADDING_LEFT}" y2="${PADDING_TOP}" stroke="#333333" stroke-width="1.5" />
  ${yTickElements.join("\n  ")}
  ${plotted}
  <text x="${SVG_WIDTH / 2}" y="${SVG_HEIGHT - 20}" text-anchor="middle" font-size="14" fill="#333333">Participants (ordered as in file)</text>
  <text x="${PADDING_LEFT - 50}" y="${SVG_HEIGHT / 2}" text-anchor="middle" font-size="14" fill="#333333" transform="rotate(-90 ${PADDING_LEFT - 50} ${SVG_HEIGHT / 2})">Net finish time</text>
  ${generateAttribution(SVG_WIDTH, SVG_HEIGHT)}
</svg>`;
}
