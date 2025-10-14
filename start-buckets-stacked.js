import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(__dirname, 'results.json');
const OUTPUT_FILE = path.join(__dirname, 'start-buckets-stacked.svg');

const SVG_WIDTH = 1200;
const SVG_HEIGHT = 600;
const PADDING_LEFT = 70;
const PADDING_RIGHT = 30;
const PADDING_TOP = 40;
const PADDING_BOTTOM = 70;

function parseNetTime(value) {
  if (!value) {
    return null;
  }
  const clean = value.replace(/\s/g, '');
  const parts = clean.split(':');
  if (parts.length !== 3) {
    return null;
  }
  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);
  const secFraction = parts[2].split(',');
  if (secFraction.length !== 2) {
    return null;
  }
  const seconds = Number(secFraction[0]);
  const fraction = Number(`0.${secFraction[1]}`);
  if ([hours, minutes, seconds, fraction].some(Number.isNaN)) {
    return null;
  }
  return hours * 3600 + minutes * 60 + seconds + fraction;
}

function parseStartTime(value) {
  if (!value) {
    return null;
  }
  const clean = value.trim();
  const parts = clean.split(':');
  if (parts.length < 2 || parts.length > 3) {
    return null;
  }
  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);
  const seconds = parts.length === 3 ? Number(parts[2]) : 0;
  if ([hours, minutes, seconds].some(Number.isNaN)) {
    return null;
  }
  return hours * 3600 + minutes * 60 + seconds;
}

function scaleLinear(domainMin, domainMax, rangeMin, rangeMax) {
  const span = domainMax - domainMin || 1;
  const rangeSpan = rangeMax - rangeMin;
  return (value) => rangeMin + ((value - domainMin) / span) * rangeSpan;
}

function minutesToLabel(minute) {
  const totalMinutes = Math.floor(minute);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

function startMinuteLabel(startMinuteKey) {
  return minutesToLabel(startMinuteKey);
}

function hslToRgb(h, s, l) {
  const hue = ((h % 360) + 360) % 360;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = l - c / 2;

  let tmpR = 0;
  let tmpG = 0;
  let tmpB = 0;

  if (hue < 60) {
    tmpR = c;
    tmpG = x;
  } else if (hue < 120) {
    tmpR = x;
    tmpG = c;
  } else if (hue < 180) {
    tmpG = c;
    tmpB = x;
  } else if (hue < 240) {
    tmpG = x;
    tmpB = c;
  } else if (hue < 300) {
    tmpR = x;
    tmpB = c;
  } else {
    tmpR = c;
    tmpB = x;
  }

  const r = Math.round((tmpR + m) * 255);
  const g = Math.round((tmpG + m) * 255);
  const b = Math.round((tmpB + m) * 255);
  return { r, g, b };
}

function interpolateColor(t) {
  const clamp = Math.max(0, Math.min(1, t));
  const hueStart = 0; // red
  const hueEnd = 300; // purple
  const hue = hueStart + (hueEnd - hueStart) * clamp;
  const { r, g, b } = hslToRgb(hue, 1, 0.5);
  return `rgb(${r},${g},${b})`;
}

function buildStackedHistogramSvg(finishBins, minFinishMinute, maxFinishMinute, maxBinTotal, minStartSecond, maxStartSecond) {
  const binSizeMinutes = 1;
  const scaleX = scaleLinear(minFinishMinute, maxFinishMinute + binSizeMinutes, PADDING_LEFT, SVG_WIDTH - PADDING_RIGHT);
  const scaleY = scaleLinear(0, maxBinTotal, SVG_HEIGHT - PADDING_BOTTOM, PADDING_TOP);

  const columns = finishBins
    .map((bin) => {
      if (!bin.total) {
        return '';
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
          const color = interpolateColor((segment.startSecond - minStartSecond) / (maxStartSecond - minStartSecond || 1));
          const tooltip = `Finish ${minutesToLabel(bin.startMinute)}-${minutesToLabel(bin.startMinute + binSizeMinutes)}\nStart ${startMinuteLabel(segment.startMinuteKey)}: ${segment.count}`;
          return `<rect x="${x.toFixed(2)}" y="${yTop.toFixed(2)}" width="${width.toFixed(2)}" height="${height.toFixed(2)}" fill="${color}"><title>${tooltip}</title></rect>`;
        })
        .join('\n');
      return stacked;
    })
    .join('\n');

  const tickElements = [];
  for (let minute = Math.ceil(minFinishMinute / 10) * 10; minute <= maxFinishMinute + binSizeMinutes; minute += 10) {
    const x = scaleX(minute);
    tickElements.push(`<line x1="${x.toFixed(2)}" y1="${SVG_HEIGHT - PADDING_BOTTOM}" x2="${x.toFixed(2)}" y2="${SVG_HEIGHT - PADDING_BOTTOM + 6}" stroke="#333333" stroke-width="1" />`);
    tickElements.push(`<text x="${x.toFixed(2)}" y="${SVG_HEIGHT - PADDING_BOTTOM + 22}" text-anchor="middle" font-size="12" fill="#333333">${minutesToLabel(minute)}</text>`);
  }

  const yTicks = 6;
  const yTickElements = [];
  for (let i = 0; i <= yTicks; i += 1) {
    const value = (maxBinTotal / yTicks) * i;
    const y = scaleY(value);
    yTickElements.push(`<line x1="${PADDING_LEFT - 6}" y1="${y.toFixed(2)}" x2="${PADDING_LEFT}" y2="${y.toFixed(2)}" stroke="#333333" stroke-width="1" />`);
    yTickElements.push(`<text x="${PADDING_LEFT - 10}" y="${y.toFixed(2)}" text-anchor="end" alignment-baseline="middle" font-size="12" fill="#333333">${Math.round(value)}</text>`);
  }

  const gradientStops = Array.from({ length: 11 }, (_, index) => {
    const t = index / 10;
    return `<stop offset="${(t * 100).toFixed(1)}%" stop-color="${interpolateColor(t)}" />`;
  }).join('\n      ');

  const gradientLegend = `<defs>
    <linearGradient id="startGradient" x1="0%" y1="0%" x2="100%" y2="0%" gradientUnits="objectBoundingBox">
      ${gradientStops}
    </linearGradient>
  </defs>`;

  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg width="${SVG_WIDTH}" height="${SVG_HEIGHT}" viewBox="0 0 ${SVG_WIDTH} ${SVG_HEIGHT}" xmlns="http://www.w3.org/2000/svg">\n  <title>Finish time vs start time</title>\n  <desc>Stacked histogram showing the number of finishers in 1-minute net finish time buckets, segmented by start minute (color).</desc>\n  ${gradientLegend}\n  <rect x="0" y="0" width="${SVG_WIDTH}" height="${SVG_HEIGHT}" fill="#ffffff" />\n  <line x1="${PADDING_LEFT}" y1="${SVG_HEIGHT - PADDING_BOTTOM}" x2="${SVG_WIDTH - PADDING_RIGHT}" y2="${SVG_HEIGHT - PADDING_BOTTOM}" stroke="#333333" stroke-width="1.5" />\n  <line x1="${PADDING_LEFT}" y1="${SVG_HEIGHT - PADDING_BOTTOM}" x2="${PADDING_LEFT}" y2="${PADDING_TOP}" stroke="#333333" stroke-width="1.5" />\n  ${tickElements.join('\n  ')}\n  ${yTickElements.join('\n  ')}\n  ${columns}\n  <text x="${SVG_WIDTH / 2}" y="${SVG_HEIGHT - 20}" text-anchor="middle" font-size="14" fill="#333333">Net finish time (1-minute buckets, labels every 10 min)</text>\n  <text x="${PADDING_LEFT - 50}" y="${SVG_HEIGHT / 2}" text-anchor="middle" font-size="14" fill="#333333" transform="rotate(-90 ${PADDING_LEFT - 50} ${SVG_HEIGHT / 2})">Number of finishers</text>\n  <rect x="${SVG_WIDTH - PADDING_RIGHT - 220}" y="${PADDING_TOP}" width="180" height="12" fill="url(#startGradient)" />\n  <text x="${SVG_WIDTH - PADDING_RIGHT - 220}" y="${PADDING_TOP - 6}" text-anchor="start" font-size="12" fill="#333333">Earlier start</text>\n  <text x="${SVG_WIDTH - PADDING_RIGHT - 40}" y="${PADDING_TOP - 6}" text-anchor="end" font-size="12" fill="#333333">Later start</text>\n</svg>`;
}

function main() {
  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  const records = JSON.parse(raw);
  const finishers = records.filter((entry) => entry.msc && entry.msc !== '0' && entry.czasnetto && entry.start);
  if (!finishers.length) {
  console.error('No completed runs in the data.');
    process.exit(1);
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
  console.error('Failed to parse start/net times.');
    process.exit(1);
  }

  const minFinishMinute = Math.floor(Math.min(...runners.map((runner) => runner.finishMinute)));
  const maxFinishMinute = Math.ceil(Math.max(...runners.map((runner) => runner.finishMinute)));
  const minStartSecond = Math.min(...runners.map((runner) => runner.startSecond));
  const maxStartSecond = Math.max(...runners.map((runner) => runner.startSecond));

  const binSizeMinutes = 1;
  const binCount = Math.max(1, Math.ceil((maxFinishMinute - minFinishMinute) / binSizeMinutes) + 1);
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
      Math.floor((runner.finishMinute - minFinishMinute) / binSizeMinutes)
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

  const svg = buildStackedHistogramSvg(
    enrichedBins,
    minFinishMinute,
    maxFinishMinute,
    maxBinTotal,
    minStartSecond,
    maxStartSecond
  );

  fs.writeFileSync(OUTPUT_FILE, svg, 'utf8');
  console.log(`Saved ${OUTPUT_FILE}.`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
