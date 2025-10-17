/**
 * Shared utility functions for race results analysis
 */

/**
 * Filter results to include only finishers (those with czasnetto)
 * @param {Array} data - Race results data
 * @returns {Array} Filtered array with only finishers
 */
export function filterFinishers(data) {
  if (!Array.isArray(data)) {
    return [];
  }
  return data.filter(result => result.czasnetto && result.czasnetto.trim() !== '');
}

/**
 * Extract unique distances from race results data
 * @param {Array} data - Race results data
 * @returns {Array<{value: string, label: string}>} Array of unique distances with labels
 */
export function getUniqueDistances(data) {
  if (!Array.isArray(data) || data.length === 0) {
    return [];
  }

  const distanceSet = new Set();
  for (const result of data) {
    if (result.odleglosc) {
      distanceSet.add(result.odleglosc);
    }
  }

  const distances = Array.from(distanceSet)
    .sort((a, b) => parseFloat(a) - parseFloat(b))
    .map(value => ({
      value,
      label: formatDistance(value)
    }));

  return distances;
}

/**
 * Format distance value for display
 * @param {string} distanceStr - Distance as string (e.g., "21097.00")
 * @returns {string} Formatted distance (e.g., "21.1 km" for half marathon)
 */
export function formatDistance(distanceStr) {
  const meters = parseFloat(distanceStr);
  if (Number.isNaN(meters)) {
    return distanceStr;
  }

  const km = meters / 1000;
  
  // Common race distances with special names
  if (Math.abs(km - 42.195) < 0.1) {
    return `Marathon (${km.toFixed(2)} km)`;
  }
  if (Math.abs(km - 21.0975) < 0.1) {
    return `Half Marathon (${km.toFixed(2)} km)`;
  }
  if (Math.abs(km - 10) < 0.1) {
    return `10 km`;
  }
  if (Math.abs(km - 5) < 0.1) {
    return `5 km`;
  }

  return `${km.toFixed(2)} km`;
}

/**
 * Parse net time string (format: "HH:MM:SS,mmm") to seconds
 * @param {string} value - Time string to parse
 * @returns {number|null} Time in seconds or null if invalid
 */
export function parseNetTime(value) {
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

/**
 * Parse start time string (format: "HH:MM" or "HH:MM:SS") to seconds
 * @param {string} value - Time string to parse
 * @returns {number|null} Time in seconds or null if invalid
 */
export function parseStartTime(value) {
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

/**
 * Create a linear scale function
 * @param {number} domainMin - Input domain minimum
 * @param {number} domainMax - Input domain maximum
 * @param {number} rangeMin - Output range minimum
 * @param {number} rangeMax - Output range maximum
 * @returns {function(number): number} Scale function
 */
export function scaleLinear(domainMin, domainMax, rangeMin, rangeMax) {
  const span = domainMax - domainMin || 1;
  const rangeSpan = rangeMax - rangeMin;
  return (value) => rangeMin + ((value - domainMin) / span) * rangeSpan;
}

/**
 * Convert minutes to time label (HH:MM format)
 * @param {number} minute - Minutes value
 * @returns {string} Formatted time string
 */
export function minutesToLabel(minute) {
  const totalMinutes = Math.floor(minute);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Convert HSL color to RGB
 * @param {number} h - Hue (0-360)
 * @param {number} s - Saturation (0-1)
 * @param {number} l - Lightness (0-1)
 * @returns {{r: number, g: number, b: number}} RGB color object
 */
export function hslToRgb(h, s, l) {
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

/**
 * Interpolate color from red (0) to purple (1)
 * @param {number} t - Position in gradient (0-1)
 * @returns {string} RGB color string
 */
export function interpolateColor(t) {
  const clamp = Math.max(0, Math.min(1, t));
  const hueStart = 0; // red
  const hueEnd = 300; // purple
  const hue = hueStart + (hueEnd - hueStart) * clamp;
  const { r, g, b } = hslToRgb(hue, 1, 0.5);
  return `rgb(${r},${g},${b})`;
}

/**
 * Generate watermark SVG element
 * @param {number} width - SVG width
 * @param {number} height - SVG height
 * @returns {string} Watermark SVG markup
 */
export function generateWatermark(width, height) {
  const url = 'bukowskiadam.github.io/datasport-results-analyzer';
  const watermarks = [];
  
  // Create a grid of watermarks
  const cols = 3;
  const rows = 2;
  const stepX = width / (cols + 1);
  const stepY = height / (rows + 1);
  
  for (let row = 1; row <= rows; row++) {
    for (let col = 1; col <= cols; col++) {
      const x = col * stepX;
      const y = row * stepY;
      watermarks.push(
        `<text x="${x}" y="${y}" text-anchor="middle" font-size="24" fill="#000000" opacity="0.03" font-weight="normal" transform="rotate(-15 ${x} ${y})">${url}</text>`
      );
    }
  }
  
  return watermarks.join('\n  ');
}

/**
 * Generate attribution SVG element
 * @param {number} width - SVG width
 * @param {number} height - SVG height
 * @returns {string} Attribution SVG markup
 */
export function generateAttribution(width, height) {
  const url = 'https://bukowskiadam.github.io/datasport-results-analyzer/';
  const y = height - 5;
  const x = width - 10;
  
  return `<a href="${url}" target="_blank">
    <text x="${x}" y="${y}" text-anchor="end" font-size="10" fill="#666666">Created with ${url}</text>
  </a>`;
}
