/**
 * Histogram of net finish times visualization
 */

import {
	calculateTimeInterval,
	generateAttribution,
	generateWatermark,
	getRunnerColor,
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
 * @param {Array} selectedRunners - Array of runners to highlight
 * @returns {string} SVG markup
 */
export function generateHistogramSvg(records, bucketSizeSeconds = 60, selectedRunners = []) {
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

	const timesWithEntries = finishers
		.map((entry) => {
			const seconds = parseNetTime(entry.czasnetto);
			return seconds ? { seconds, entry } : null;
		})
		.filter(Boolean);

	if (!timesWithEntries.length) {
		throw new Error("Failed to parse net times.");
	}

	const timesInMinutes = timesWithEntries.map((item) => item.seconds / 60);
	const minMinute = Math.floor(Math.min(...timesInMinutes));
	const maxMinute = Math.ceil(Math.max(...timesInMinutes));
	const binSizeMinutes = bucketSizeSeconds / 60;
	const binCount = Math.max(
		1,
		Math.ceil((maxMinute - minMinute) / binSizeMinutes) + 1,
	);
	const bins = [];

	for (let i = 0; i < binCount; i += 1) {
		bins.push({ startMinute: minMinute + i * binSizeMinutes, count: 0, entries: [] });
	}

	timesWithEntries.forEach((item) => {
		const minuteValue = item.seconds / 60;
		const index = Math.min(
			bins.length - 1,
			Math.floor((minuteValue - minMinute) / binSizeMinutes),
		);
		bins[index].count += 1;
		bins[index].entries.push(item.entry);
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
	const timeInterval = calculateTimeInterval(minMinute, maxMinute);
	for (
		let minute = Math.ceil(minMinute / timeInterval) * timeInterval;
		minute <= maxMinute + binSizeMinutes;
		minute += timeInterval
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

	// Add highlight for selected runners
	let highlightElements = "";
	let markerDefs = "";
	
	for (let i = 0; i < selectedRunners.length; i++) {
		const selectedRunner = selectedRunners[i];
		const color = getRunnerColor(i);
		
		// Find which bin contains the selected runner
		const selectedRunnerTime = parseNetTime(selectedRunner.czasnetto);
		if (selectedRunnerTime) {
			const selectedMinute = selectedRunnerTime / 60;
			const binIndex = Math.min(
				bins.length - 1,
				Math.floor((selectedMinute - minMinute) / binSizeMinutes),
			);
			const bin = bins[binIndex];
			
			// Check if the bin contains the selected runner
			if (bin.entries.includes(selectedRunner)) {
				const x = scaleX(bin.startMinute);
				const nextMinute = bin.startMinute + binSizeMinutes;
				const x2 = scaleX(nextMinute);
				const width = Math.max(1, x2 - x - 1);
				const centerX = x + width / 2;
				
				// Position marker at top of the bar
				const y = scaleY(bin.count);
				const runnerName = `${selectedRunner.nazwisko || ""} ${selectedRunner.imie || ""}`.trim();
				
				// Adaptive positioning with vertical offset for multiple runners
				const verticalOffset = i * 25;
				const spaceAbove = y - PADDING_TOP;
				const spaceRight = (SVG_WIDTH - PADDING_RIGHT) - centerX;
				const spaceLeft = centerX - PADDING_LEFT;
				
				let arrowStartX, arrowStartY, arrowEndX, arrowEndY, textX, textY, textAnchor;
				
				// Minimum space needed above for diagonal arrow (accounts for text height and offset)
				const minSpaceAbove = 50 + verticalOffset;
				
				// If bar is very close to top (less than minSpaceAbove), place arrow to the side
				if (spaceAbove < minSpaceAbove) {
					// Place arrow to the side with most space
					if (spaceRight > spaceLeft && spaceRight > 80) {
						// Place arrow to the right
						arrowStartX = centerX + 80;
						arrowStartY = y + 5 + verticalOffset;
						arrowEndX = centerX + 8;
						arrowEndY = y;
						textX = arrowStartX + 5;
						textY = arrowStartY + 4;
						textAnchor = "start";
					} else if (spaceLeft > 80) {
						// Place arrow to the left
						arrowStartX = centerX - 80;
						arrowStartY = y + 5 + verticalOffset;
						arrowEndX = centerX - 8;
						arrowEndY = y;
						textX = arrowStartX - 5;
						textY = arrowStartY + 4;
						textAnchor = "end";
					} else {
						// Very little space on sides, use shorter arrow to preferred side
						if (spaceRight > spaceLeft) {
							arrowStartX = centerX + Math.min(60, spaceRight - 10);
							arrowStartY = y + 5 + verticalOffset;
							arrowEndX = centerX + 8;
							arrowEndY = y;
							textX = arrowStartX + 5;
							textY = arrowStartY + 4;
							textAnchor = "start";
						} else {
							arrowStartX = centerX - Math.min(60, spaceLeft - 10);
							arrowStartY = y + 5 + verticalOffset;
							arrowEndX = centerX - 8;
							arrowEndY = y;
							textX = arrowStartX - 5;
							textY = arrowStartY + 4;
							textAnchor = "end";
						}
					}
				} else if (spaceRight < 60) {
					// Not enough space on right, try top-left diagonal
					if (spaceLeft > 60) {
						// Place arrow from top-left
						arrowStartX = centerX - 60;
						arrowStartY = y - (40 + verticalOffset);
						arrowEndX = centerX - 8;
						arrowEndY = y - 8;
						textX = arrowStartX - 5;
						textY = arrowStartY;
						textAnchor = "end";
					} else {
						// Place to the left side if possible
						arrowStartX = centerX - Math.min(60, spaceLeft - 10);
						arrowStartY = y - (20 + verticalOffset);
						arrowEndX = centerX - 8;
						arrowEndY = y - 8;
						textX = arrowStartX - 5;
						textY = arrowStartY;
						textAnchor = "end";
					}
				} else {
					// Enough space above and to the right, place arrow diagonally top-right
					arrowStartX = centerX + 60;
					arrowStartY = y - (40 + verticalOffset);
					arrowEndX = centerX + 8;
					arrowEndY = y - 8;
					textX = arrowStartX + 5;
					textY = arrowStartY;
					textAnchor = "start";
				}
				
				const markerId = `arrowhead-hist-${i}`;
				markerDefs += `
    <marker id="${markerId}" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <polygon points="0 0, 10 3, 0 6" fill="${color}" />
    </marker>`;
				
				highlightElements += `
  <!-- Highlighted runner ${i + 1} arrow -->
  <line x1="${arrowStartX}" y1="${arrowStartY}" x2="${arrowEndX}" y2="${arrowEndY}" 
        stroke="${color}" stroke-width="2" marker-end="url(#${markerId})" />
  <text x="${textX}" y="${textY}" text-anchor="${textAnchor}" font-size="16" font-weight="bold" fill="${color}">${runnerName}</text>
  <!-- Highlighted runner ${i + 1} dot -->
  <circle cx="${centerX.toFixed(2)}" cy="${y.toFixed(2)}" r="6" fill="${color}" opacity="1.0" stroke="#ffffff" stroke-width="2">
    <title>${runnerName} - ${selectedRunner.czasnetto}</title>
  </circle>`;
			}
		}
	}
	
	if (markerDefs) {
		highlightElements = `
  <!-- Marker definitions for arrows -->
  <defs>${markerDefs}
  </defs>` + highlightElements;
	}

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
  ${highlightElements}
  <text x="${SVG_WIDTH / 2}" y="${SVG_HEIGHT - 20}" text-anchor="middle" font-size="14" fill="#333333">Net finish time (${bucketLabel}, labels every 10 min)</text>
  <text x="${PADDING_LEFT - 50}" y="${SVG_HEIGHT / 2}" text-anchor="middle" font-size="14" fill="#333333" transform="rotate(-90 ${PADDING_LEFT - 50} ${SVG_HEIGHT / 2})">Number of finishers</text>
  ${generateAttribution(SVG_WIDTH, SVG_HEIGHT)}
</svg>`;
}
