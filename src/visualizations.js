/**
 * Browser-compatible visualization generators
 */

import {
	interpolateColor,
	minutesToLabel,
	parseNetTime,
	parseStartTime,
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

/**
 * Generate histogram of net finish times SVG
 * @param {Array} records - Race results data
 * @returns {string} SVG markup
 */
export function generateHistogramSvg(records) {
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
	const binSizeMinutes = 1;
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

	return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${SVG_WIDTH}" height="${SVG_HEIGHT}" viewBox="0 0 ${SVG_WIDTH} ${SVG_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <title>Histogram of net finish times</title>
  <desc>Bar chart showing the number of finishers in one-minute buckets of net time.</desc>
  <rect x="0" y="0" width="${SVG_WIDTH}" height="${SVG_HEIGHT}" fill="#ffffff" />
  <line x1="${PADDING_LEFT}" y1="${SVG_HEIGHT - PADDING_BOTTOM}" x2="${SVG_WIDTH - PADDING_RIGHT}" y2="${SVG_HEIGHT - PADDING_BOTTOM}" stroke="#333333" stroke-width="1.5" />
  <line x1="${PADDING_LEFT}" y1="${SVG_HEIGHT - PADDING_BOTTOM}" x2="${PADDING_LEFT}" y2="${PADDING_TOP}" stroke="#333333" stroke-width="1.5" />
  ${tickElements.join("\n  ")}
  ${yTickElements.join("\n  ")}
  ${barElements}
  <text x="${SVG_WIDTH / 2}" y="${SVG_HEIGHT - 20}" text-anchor="middle" font-size="14" fill="#333333">Net finish time (1-minute buckets, labels every 10 min)</text>
  <text x="${PADDING_LEFT - 50}" y="${SVG_HEIGHT / 2}" text-anchor="middle" font-size="14" fill="#333333" transform="rotate(-90 ${PADDING_LEFT - 50} ${SVG_HEIGHT / 2})">Number of finishers</text>
</svg>`;
}

/**
 * Generate stacked histogram of start buckets SVG
 * @param {Array} records - Race results data
 * @returns {string} SVG markup
 */
export function generateStartBucketsSvg(records) {
	const PADDING_LEFT = 70;
	const PADDING_RIGHT = 30;
	const PADDING_TOP = 40;
	const PADDING_BOTTOM = 70;

	const finishers = records.filter(
		(entry) => entry.msc && entry.msc !== "0" && entry.czasnetto && entry.start,
	);

	if (!finishers.length) {
		throw new Error("No completed runs in the data.");
	}

	const runners = finishers
		.map((entry) => {
			const netSeconds = parseNetTime(entry.czasnetto);
			const startSecond = parseStartTime(entry.start);
			if (netSeconds === null || startSecond === null) {
				return null;
			}
			return {
				finishMinute: netSeconds / 60,
				startMinuteKey: Math.floor(startSecond / 60),
				startSecond,
			};
		})
		.filter(Boolean);

	if (!runners.length) {
		throw new Error("Failed to parse start/net times.");
	}

	const minFinishMinute = Math.floor(
		Math.min(...runners.map((runner) => runner.finishMinute)),
	);
	const maxFinishMinute = Math.ceil(
		Math.max(...runners.map((runner) => runner.finishMinute)),
	);
	const minStartSecond = Math.min(
		...runners.map((runner) => runner.startSecond),
	);
	const maxStartSecond = Math.max(
		...runners.map((runner) => runner.startSecond),
	);

	const binSizeMinutes = 1;
	const binCount = Math.max(
		1,
		Math.ceil((maxFinishMinute - minFinishMinute) / binSizeMinutes) + 1,
	);
	const finishBins = [];

	for (let i = 0; i < binCount; i += 1) {
		finishBins.push({
			startMinute: minFinishMinute + i * binSizeMinutes,
			totalsByStart: new Map(),
			total: 0,
		});
	}

	runners.forEach((runner) => {
		const binIndex = Math.min(
			finishBins.length - 1,
			Math.floor((runner.finishMinute - minFinishMinute) / binSizeMinutes),
		);
		const bin = finishBins[binIndex];
		const count = bin.totalsByStart.get(runner.startMinuteKey) || 0;
		bin.totalsByStart.set(runner.startMinuteKey, count + 1);
		bin.total += 1;
	});

	const enrichedBins = finishBins.map((bin) => {
		const segments = Array.from(bin.totalsByStart.entries())
			.sort((a, b) => a[0] - b[0])
			.map(([startMinuteKey, count]) => ({
				startMinuteKey,
				count,
				startSecond: startMinuteKey * 60,
			}));
		return {
			startMinute: bin.startMinute,
			total: bin.total,
			segments,
		};
	});

	const maxBinTotal = Math.max(...enrichedBins.map((bin) => bin.total));

	const scaleX = scaleLinear(
		minFinishMinute,
		maxFinishMinute + binSizeMinutes,
		PADDING_LEFT,
		SVG_WIDTH - PADDING_RIGHT,
	);
	const scaleY = scaleLinear(
		0,
		maxBinTotal,
		SVG_HEIGHT - PADDING_BOTTOM,
		PADDING_TOP,
	);

	const columns = enrichedBins
		.map((bin) => {
			if (!bin.total) {
				return "";
			}
			const x = scaleX(bin.startMinute);
			const x2 = scaleX(bin.startMinute + binSizeMinutes);
			const width = Math.max(1, x2 - x - 1);
			let cumulative = 0;
			const stacked = bin.segments
				.map((segment) => {
					const yTop = scaleY(cumulative + segment.count);
					const yBottom = scaleY(cumulative);
					const height = Math.max(1, yBottom - yTop);
					cumulative += segment.count;
					const color = interpolateColor(
						(segment.startSecond - minStartSecond) /
							(maxStartSecond - minStartSecond || 1),
					);
					const tooltip = `Finish ${minutesToLabel(bin.startMinute)}-${minutesToLabel(bin.startMinute + binSizeMinutes)}\nStart ${minutesToLabel(segment.startMinuteKey)}: ${segment.count}`;
					return `<rect x="${x.toFixed(2)}" y="${yTop.toFixed(2)}" width="${width.toFixed(2)}" height="${height.toFixed(2)}" fill="${color}"><title>${tooltip}</title></rect>`;
				})
				.join("\n");
			return stacked;
		})
		.join("\n");

	const tickElements = [];
	for (
		let minute = Math.ceil(minFinishMinute / 10) * 10;
		minute <= maxFinishMinute + binSizeMinutes;
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
		const value = (maxBinTotal / yTicks) * i;
		const y = scaleY(value);
		yTickElements.push(
			`<line x1="${PADDING_LEFT - 6}" y1="${y.toFixed(2)}" x2="${PADDING_LEFT}" y2="${y.toFixed(2)}" stroke="#333333" stroke-width="1" />`,
		);
		yTickElements.push(
			`<text x="${PADDING_LEFT - 10}" y="${y.toFixed(2)}" text-anchor="end" alignment-baseline="middle" font-size="12" fill="#333333">${Math.round(value)}</text>`,
		);
	}

	const gradientStops = Array.from({ length: 11 }, (_, index) => {
		const t = index / 10;
		return `<stop offset="${(t * 100).toFixed(1)}%" stop-color="${interpolateColor(t)}" />`;
	}).join("\n      ");

	const gradientLegend = `<defs>
    <linearGradient id="startGradient" x1="0%" y1="0%" x2="100%" y2="0%" gradientUnits="objectBoundingBox">
      ${gradientStops}
    </linearGradient>
  </defs>`;

	return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${SVG_WIDTH}" height="${SVG_HEIGHT}" viewBox="0 0 ${SVG_WIDTH} ${SVG_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <title>Finish time vs start time</title>
  <desc>Stacked histogram showing the number of finishers in 1-minute net finish time buckets, segmented by start minute (color).</desc>
  ${gradientLegend}
  <rect x="0" y="0" width="${SVG_WIDTH}" height="${SVG_HEIGHT}" fill="#ffffff" />
  <line x1="${PADDING_LEFT}" y1="${SVG_HEIGHT - PADDING_BOTTOM}" x2="${SVG_WIDTH - PADDING_RIGHT}" y2="${SVG_HEIGHT - PADDING_BOTTOM}" stroke="#333333" stroke-width="1.5" />
  <line x1="${PADDING_LEFT}" y1="${SVG_HEIGHT - PADDING_BOTTOM}" x2="${PADDING_LEFT}" y2="${PADDING_TOP}" stroke="#333333" stroke-width="1.5" />
  ${tickElements.join("\n  ")}
  ${yTickElements.join("\n  ")}
  ${columns}
  <text x="${SVG_WIDTH / 2}" y="${SVG_HEIGHT - 20}" text-anchor="middle" font-size="14" fill="#333333">Net finish time (1-minute buckets, labels every 10 min)</text>
  <text x="${PADDING_LEFT - 50}" y="${SVG_HEIGHT / 2}" text-anchor="middle" font-size="14" fill="#333333" transform="rotate(-90 ${PADDING_LEFT - 50} ${SVG_HEIGHT / 2})">Number of finishers</text>
  <rect x="${SVG_WIDTH - PADDING_RIGHT - 220}" y="${PADDING_TOP}" width="180" height="12" fill="url(#startGradient)" />
  <text x="${SVG_WIDTH - PADDING_RIGHT - 220}" y="${PADDING_TOP - 6}" text-anchor="start" font-size="12" fill="#333333">Earlier start</text>
  <text x="${SVG_WIDTH - PADDING_RIGHT - 40}" y="${PADDING_TOP - 6}" text-anchor="end" font-size="12" fill="#333333">Later start</text>
</svg>`;
}
