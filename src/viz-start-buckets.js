/**
 * Stacked histogram of start buckets visualization
 */

import {
	generateAttribution,
	generateWatermark,
	interpolateColor,
	minutesToLabel,
	parseNetTime,
	parseStartTime,
	scaleLinear,
} from "./utils.js";

const SVG_WIDTH = 1200;
const SVG_HEIGHT = 600;

/**
 * Generate stacked histogram of start buckets SVG
 * @param {Array} records - Race results data
 * @param {number} bucketSizeSeconds - Bucket size in seconds (default: 60)
 * @returns {string} SVG markup
 */
export function generateStartBucketsSvg(records, bucketSizeSeconds = 60) {
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

	// First pass: collect all start seconds to calculate the range
	const allStartSeconds = finishers
		.map((entry) => parseStartTime(entry.start))
		.filter((sec) => sec !== null);

	if (!allStartSeconds.length) {
		throw new Error("Failed to parse start times.");
	}

	const minStartSecond = Math.min(...allStartSeconds);
	const maxStartSecond = Math.max(...allStartSeconds);
	const startRange = maxStartSecond - minStartSecond;
	
	// Divide start time range into 30 equal windows
	const startBucketCount = 30;
	const startBucketSize = startRange / startBucketCount || 1; // Avoid division by zero

	const runners = finishers
		.map((entry) => {
			const netSeconds = parseNetTime(entry.czasnetto);
			const startSecond = parseStartTime(entry.start);
			if (netSeconds === null || startSecond === null) {
				return null;
			}
			// Assign to one of 30 start buckets
			const startBucketIndex = Math.min(
				startBucketCount - 1,
				Math.floor((startSecond - minStartSecond) / startBucketSize),
			);
			return {
				finishMinute: netSeconds / 60,
				startBucketKey: startBucketIndex,
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

	const binSizeMinutes = bucketSizeSeconds / 60;
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
		const count = bin.totalsByStart.get(runner.startBucketKey) || 0;
		bin.totalsByStart.set(runner.startBucketKey, count + 1);
		bin.total += 1;
	});

	const enrichedBins = finishBins.map((bin) => {
		const segments = Array.from(bin.totalsByStart.entries())
			.sort((a, b) => a[0] - b[0])
			.map(([startBucketKey, count]) => ({
				startBucketKey,
				count,
				// Calculate the middle of this start bucket for color mapping
				startSecond: minStartSecond + (startBucketKey + 0.5) * startBucketSize,
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
					const tooltip = `Finish ${minutesToLabel(bin.startMinute)}-${minutesToLabel(bin.startMinute + binSizeMinutes)}\nStart bucket ${segment.startBucketKey + 1}: ${segment.count}`;
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

	// Format start time labels based on range
	const formatStartTime = (seconds) => {
		if (startRange > 180) {
			// Use minutes if range > 3 minutes
			const minutes = Math.round(seconds / 60);
			return `${minutes}min`;
		}
		return `${Math.round(seconds)}s`;
	};

	const startLabel0 = formatStartTime(0);
	const startLabelMid = formatStartTime(startRange / 2);
	const startLabelEnd = formatStartTime(startRange);

	const legendX = SVG_WIDTH - PADDING_RIGHT - 220;
	const legendY = PADDING_TOP;
	const legendWidth = 180;

	// Generate X-axis label with bucket size
	const bucketLabel = bucketSizeSeconds >= 60 
		? `${bucketSizeSeconds / 60}-minute buckets`
		: `${bucketSizeSeconds}-second buckets`;

	return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${SVG_WIDTH}" height="${SVG_HEIGHT}" viewBox="0 0 ${SVG_WIDTH} ${SVG_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <title>Finish time vs start time</title>
  <desc>Stacked histogram showing the number of finishers in 1-minute net finish time buckets, segmented by start minute (color).</desc>
  ${gradientLegend}
  <rect x="0" y="0" width="${SVG_WIDTH}" height="${SVG_HEIGHT}" fill="#ffffff" />
  ${generateWatermark(SVG_WIDTH, SVG_HEIGHT)}
  <line x1="${PADDING_LEFT}" y1="${SVG_HEIGHT - PADDING_BOTTOM}" x2="${SVG_WIDTH - PADDING_RIGHT}" y2="${SVG_HEIGHT - PADDING_BOTTOM}" stroke="#333333" stroke-width="1.5" />
  <line x1="${PADDING_LEFT}" y1="${SVG_HEIGHT - PADDING_BOTTOM}" x2="${PADDING_LEFT}" y2="${PADDING_TOP}" stroke="#333333" stroke-width="1.5" />
  ${tickElements.join("\n  ")}
  ${yTickElements.join("\n  ")}
  ${columns}
  <text x="${SVG_WIDTH / 2}" y="${SVG_HEIGHT - 20}" text-anchor="middle" font-size="14" fill="#333333">Net finish time (${bucketLabel}, labels every 10 min)</text>
  <text x="${PADDING_LEFT - 50}" y="${SVG_HEIGHT / 2}" text-anchor="middle" font-size="14" fill="#333333" transform="rotate(-90 ${PADDING_LEFT - 50} ${SVG_HEIGHT / 2})">Number of finishers</text>
  <rect x="${legendX}" y="${legendY}" width="${legendWidth}" height="12" fill="url(#startGradient)" />
  <text x="${legendX}" y="${legendY - 6}" text-anchor="start" font-size="12" fill="#333333">Earlier start</text>
  <text x="${legendX + legendWidth}" y="${legendY - 6}" text-anchor="end" font-size="12" fill="#333333">Later start</text>
  <text x="${legendX}" y="${legendY + 24}" text-anchor="start" font-size="10" fill="#666666">${startLabel0}</text>
  <text x="${legendX + legendWidth / 2}" y="${legendY + 24}" text-anchor="middle" font-size="10" fill="#666666">${startLabelMid}</text>
  <text x="${legendX + legendWidth}" y="${legendY + 24}" text-anchor="end" font-size="10" fill="#666666">${startLabelEnd}</text>
  ${generateAttribution(SVG_WIDTH, SVG_HEIGHT)}
</svg>`;
}
