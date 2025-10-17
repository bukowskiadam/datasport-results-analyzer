/**
 * Net times scatter plot visualization
 */

import { parseNetTime, scaleLinear } from "./utils.js";

const SVG_WIDTH = 1200;
const SVG_HEIGHT = 600;

/**
 * Generate net times scatter plot SVG
 * @param {Array} records - Race results data
 * @returns {string} SVG markup
 */
export function generateNettoTimesSvg(records) {
	const PADDING = 50;

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

	const scaleX = scaleLinear(
		0,
		points.length - 1,
		PADDING,
		SVG_WIDTH - PADDING,
	);
	const scaleY = scaleLinear(
		minSeconds,
		maxSeconds,
		SVG_HEIGHT - PADDING,
		PADDING,
	);

	const plotted = points
		.map((point, index) => {
			const cx = scaleX(index);
			const cy = scaleY(point.seconds);
			return `<circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="2" fill="#1f77b4"><title>${point.label}</title></circle>`;
		})
		.join("\n");

	const minLabel = `${Math.round(minSeconds / 60)} min`;
	const maxLabel = `${Math.round(maxSeconds / 60)} min`;

	return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${SVG_WIDTH}" height="${SVG_HEIGHT}" viewBox="0 0 ${SVG_WIDTH} ${SVG_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <title>Half marathon net finish times</title>
  <desc>Each dot represents the net finish time for a finisher (only entries with non-zero placing).</desc>
  <rect x="0" y="0" width="${SVG_WIDTH}" height="${SVG_HEIGHT}" fill="#ffffff" />
  <line x1="${PADDING}" y1="${scaleY(minSeconds).toFixed(2)}" x2="${PADDING}" y2="${scaleY(maxSeconds).toFixed(2)}" stroke="#333333" stroke-width="1" />
  <line x1="${scaleX(0).toFixed(2)}" y1="${SVG_HEIGHT - PADDING}" x2="${scaleX(points.length - 1).toFixed(2)}" y2="${SVG_HEIGHT - PADDING}" stroke="#333333" stroke-width="1" />
  <text x="${PADDING - 10}" y="${scaleY(minSeconds).toFixed(2)}" text-anchor="end" alignment-baseline="middle" font-size="12" fill="#333333">${minLabel}</text>
  <text x="${PADDING - 10}" y="${scaleY(maxSeconds).toFixed(2)}" text-anchor="end" alignment-baseline="middle" font-size="12" fill="#333333">${maxLabel}</text>
  <text x="${SVG_WIDTH / 2}" y="${SVG_HEIGHT - PADDING + 30}" text-anchor="middle" font-size="14" fill="#333333">Participants (ordered as in file)</text>
  <text x="${PADDING - 40}" y="${SVG_HEIGHT / 2}" text-anchor="middle" font-size="14" fill="#333333" transform="rotate(-90 ${PADDING - 40} ${SVG_HEIGHT / 2})">Net time (seconds)</text>
  ${plotted}
</svg>`;
}
