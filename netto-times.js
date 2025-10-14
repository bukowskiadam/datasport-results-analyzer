import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(__dirname, 'results.json');
const OUTPUT_FILE = path.join(__dirname, 'netto-times.svg');

const SVG_WIDTH = 1200;
const SVG_HEIGHT = 600;
const PADDING = 50;

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

function scaleLinear(domainMin, domainMax, rangeMin, rangeMax) {
  const span = domainMax - domainMin || 1;
  const rangeSpan = rangeMax - rangeMin;
  return (value) => rangeMin + ((value - domainMin) / span) * rangeSpan;
}

function buildSvg(points, minSeconds, maxSeconds) {
  const scaleX = scaleLinear(0, points.length - 1, PADDING, SVG_WIDTH - PADDING);
  const scaleY = scaleLinear(minSeconds, maxSeconds, SVG_HEIGHT - PADDING, PADDING);

  const plotted = points
    .map((point, index) => {
      const cx = scaleX(index);
      const cy = scaleY(point.seconds);
      return `<circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="2" fill="#1f77b4"><title>${point.label}</title></circle>`;
    })
    .join('\n');

  const minLabel = `${Math.round(minSeconds / 60)} min`;
  const maxLabel = `${Math.round(maxSeconds / 60)} min`;

  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg width="${SVG_WIDTH}" height="${SVG_HEIGHT}" viewBox="0 0 ${SVG_WIDTH} ${SVG_HEIGHT}" xmlns="http://www.w3.org/2000/svg">\n  <title>Half marathon net finish times</title>\n  <desc>Each dot represents the net finish time for a finisher (only entries with non-zero placing).</desc>\n  <rect x="0" y="0" width="${SVG_WIDTH}" height="${SVG_HEIGHT}" fill="#ffffff" />\n  <line x1="${PADDING}" y1="${scaleY(minSeconds).toFixed(2)}" x2="${PADDING}" y2="${scaleY(maxSeconds).toFixed(2)}" stroke="#333333" stroke-width="1" />\n  <line x1="${scaleX(0).toFixed(2)}" y1="${SVG_HEIGHT - PADDING}" x2="${scaleX(points.length - 1).toFixed(2)}" y2="${SVG_HEIGHT - PADDING}" stroke="#333333" stroke-width="1" />\n  <text x="${PADDING - 10}" y="${scaleY(minSeconds).toFixed(2)}" text-anchor="end" alignment-baseline="middle" font-size="12" fill="#333333">${minLabel}</text>\n  <text x="${PADDING - 10}" y="${scaleY(maxSeconds).toFixed(2)}" text-anchor="end" alignment-baseline="middle" font-size="12" fill="#333333">${maxLabel}</text>\n  <text x="${SVG_WIDTH / 2}" y="${SVG_HEIGHT - PADDING + 30}" text-anchor="middle" font-size="14" fill="#333333">Participants (ordered as in file)</text>\n  <text x="${PADDING - 40}" y="${SVG_HEIGHT / 2}" text-anchor="middle" font-size="14" fill="#333333" transform="rotate(-90 ${PADDING - 40} ${SVG_HEIGHT / 2})">Net time (seconds)</text>\n  ${plotted}\n</svg>`;
}

function main() {
  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  const records = JSON.parse(raw);
  const finishers = records.filter((entry) => entry.msc && entry.msc !== '0' && entry.czasnetto);
  if (!finishers.length) {
  console.error('No completed runs in the data.');
    process.exit(1);
  }
  const points = finishers
    .map((entry, index) => {
      const seconds = parseNetTime(entry.czasnetto);
      return seconds ? { seconds, label: `${index + 1}. ${entry.nazwisko || ''} ${entry.imie || ''} - ${entry.czasnetto}`.trim() } : null;
    })
    .filter(Boolean);

  if (!points.length) {
  console.error('Failed to parse net times.');
    process.exit(1);
  }

  const secondsList = points.map((point) => point.seconds);
  const minSeconds = Math.min(...secondsList);
  const maxSeconds = Math.max(...secondsList);
  const svg = buildSvg(points, minSeconds, maxSeconds);
  fs.writeFileSync(OUTPUT_FILE, svg, 'utf8');
  console.log(`Saved ${OUTPUT_FILE} for ${points.length} athletes.`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
