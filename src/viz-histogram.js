/**
 * Histogram of net finish times visualization
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
 * Generate histogram of net finish times SVG
 * @param {Array} records - Race results data
 * @param {number} bucketSizeSeconds - Bucket size in seconds (default: 60)
 * @returns {string} SVG markup
 */
export function generateHistogramSvg(records, bucketSizeSeconds = 60) {
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

	const timesInSeconds = finishers
		.map((entry) => parseNetTime(entry.czasnetto))
		.filter((seconds) => seconds !== null);

	if (!timesInSeconds.length) {
		throw new Error("Failed to parse net times.");
	}

	const timesInMinutes = timesInSeconds.map((value) => value / 60);
	const minMinute = Math.floor(Math.min(...timesInMinutes));
	const maxMinute = Math.ceil(Math.max(...timesInMinutes));
	const binSizeMinutes = bucketSizeSeconds / 60;
	const binCount = Math.max(
		1,
		Math.ceil((maxMinute - minMinute) / binSizeMinutes) + 1,
	);
	const bins = [];

	for (let i = 0; i < binCount; i += 1) {
		bins.push({ startMinute: minMinute + i * binSizeMinutes, count: 0 });
	}

	timesInMinutes.forEach((minuteValue) => {
		const index = Math.min(
			bins.length - 1,
			Math.floor((minuteValue - minMinute) / binSizeMinutes),
		);
		bins[index].count += 1;
	});

	const maxCount = Math.max(...bins.map((bin) => bin.count));

	const scaleX = scaleLinear(
		minMinute,
		maxMinute + binSizeMinutes,
		PADDING_LEFT,
		SVG_WIDTH - PADDING_RIGHT,
	);
	const scaleY = scaleLinear(
		0,
		maxCount,
		SVG_HEIGHT - PADDING_BOTTOM,
		PADDING_TOP,
	);

	const barElements = bins
		.map((bin) => {
			const x = scaleX(bin.startMinute);
			const nextMinute = bin.startMinute + binSizeMinutes;
			const x2 = scaleX(nextMinute);
			const width = Math.max(1, x2 - x - 1);
			const y = scaleY(bin.count);
			const height = SVG_HEIGHT - PADDING_BOTTOM - y;
			return `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${width.toFixed(2)}" height="${height.toFixed(2)}" fill="#1f77b4"><title>${minutesToLabel(bin.startMinute)}-${minutesToLabel(nextMinute)}: ${bin.count}</title></rect>`;
		})
		.join("\n");

	const tickElements = [];
	for (
		let minute = Math.ceil(minMinute / 10) * 10;
		minute <= maxMinute + binSizeMinutes;
		minute += 10
	) {
		const x = scaleX(minute);
		tickElements.push(
			`<line x1="${x.toFixed(2)}" y1="${SVG_HEIGHT - PADDING_BOTTOM}" x2="${x.toFixed(2)}" y2="${SVG_HEIGHT - PADDING_BOTTOM + 6}" stroke="#333333" stroke-width="1" />`,
		);
		tickElements.push(
			`<text x="${x.toFixed(2)}" y="${SVG_HEIGHT - PADDING_BOTTOM + 22}" text-anchor="middle" font-size="12" fill="#333333">${minutesToLabel(minute)}</text>`,
		);
	}

	const yTicks = 6;
	const yTickElements = [];
	for (let i = 0; i <= yTicks; i += 1) {
		const value = (maxCount / yTicks) * i;
		const y = scaleY(value);
		yTickElements.push(
			`<line x1="${PADDING_LEFT - 6}" y1="${y.toFixed(2)}" x2="${PADDING_LEFT}" y2="${y.toFixed(2)}" stroke="#333333" stroke-width="1" />`,
		);
		yTickElements.push(
			`<text x="${PADDING_LEFT - 10}" y="${y.toFixed(2)}" text-anchor="end" alignment-baseline="middle" font-size="12" fill="#333333">${Math.round(value)}</text>`,
		);
	}

	// Generate X-axis label with bucket size
	const bucketLabel = bucketSizeSeconds >= 60 
		? `${bucketSizeSeconds / 60}-minute buckets`
		: `${bucketSizeSeconds}-second buckets`;

	return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${SVG_WIDTH}" height="${SVG_HEIGHT}" viewBox="0 0 ${SVG_WIDTH} ${SVG_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <title>Histogram of net finish times</title>
  <desc>Bar chart showing the number of finishers in one-minute buckets of net time.</desc>
  <rect x="0" y="0" width="${SVG_WIDTH}" height="${SVG_HEIGHT}" fill="#ffffff" />
  ${generateWatermark(SVG_WIDTH, SVG_HEIGHT)}
  <line x1="${PADDING_LEFT}" y1="${SVG_HEIGHT - PADDING_BOTTOM}" x2="${SVG_WIDTH - PADDING_RIGHT}" y2="${SVG_HEIGHT - PADDING_BOTTOM}" stroke="#333333" stroke-width="1.5" />
  <line x1="${PADDING_LEFT}" y1="${SVG_HEIGHT - PADDING_BOTTOM}" x2="${PADDING_LEFT}" y2="${PADDING_TOP}" stroke="#333333" stroke-width="1.5" />
  ${tickElements.join("\n  ")}
  ${yTickElements.join("\n  ")}
  ${barElements}
  <text x="${SVG_WIDTH / 2}" y="${SVG_HEIGHT - 20}" text-anchor="middle" font-size="14" fill="#333333">Net finish time (${bucketLabel}, labels every 10 min)</text>
  <text x="${PADDING_LEFT - 50}" y="${SVG_HEIGHT / 2}" text-anchor="middle" font-size="14" fill="#333333" transform="rotate(-90 ${PADDING_LEFT - 50} ${SVG_HEIGHT / 2})">Number of finishers</text>
  ${generateAttribution(SVG_WIDTH, SVG_HEIGHT)}
</svg>`;
}
