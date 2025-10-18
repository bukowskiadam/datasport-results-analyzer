# Visualizations Documentation

## Overview

The app generates four different SVG visualizations from race results data. Each visualization provides unique insights into race performance, pacing strategies, and distribution patterns.

## Available Visualizations

### 1. Net Times Scatter Plot

**File**: `viz-netto-times.js`

#### Purpose
Shows the net finish time for each runner as a single point, ordered by finish position. Ideal for identifying outliers and seeing the overall spread of finish times.

#### Features
- **X-axis**: Finish position (1st, 2nd, 3rd, etc.)
- **Y-axis**: Net finish time (HH:MM format)
- **Data points**: One blue dot per finisher
- **Gridlines**: Horizontal lines every 10 minutes for easy reading
- **Interactive tooltips**: Hover to see runner name and time
- **Runner highlighting**: Selected runners shown in red with arrow label

#### Use Cases
- Identify fastest and slowest times at a glance
- Spot unusual gaps in the field
- See the distribution curve of finish times
- Compare a specific runner's time to the field

#### Technical Details
- Canvas size: 1200×600 pixels
- Point radius: 2px (regular), 5px (highlighted)
- Color scheme: Blue (#1f77b4) for regular, Red (#ff4444) for highlighted
- Scale: Linear for both axes

---

### 2. Net Times Histogram

**File**: `viz-histogram.js`

#### Purpose
Groups finishers into time buckets and displays the count in each bucket. Shows the distribution pattern and identifies the most common finish time ranges.

#### Features
- **X-axis**: Finish time in HH:MM format
- **Y-axis**: Number of finishers in bucket
- **Bars**: Blue bars representing runner count per bucket
- **Bucket sizes**: Configurable (60s, 120s, 300s, 600s)
- **Interactive tooltips**: Hover to see exact time range and count
- **Runner highlighting**: Selected runner's bucket marked with arrow

#### Bucket Size Options
- **60 seconds (1 minute)**: High detail, many bars
  - Best for: Small races (<500 runners) or detailed analysis
- **120 seconds (2 minutes)**: Balanced detail
  - Best for: Medium races (500-2000 runners)
- **300 seconds (5 minutes)**: Broader view
  - Best for: Large races (2000-5000 runners)
- **600 seconds (10 minutes)**: High-level overview
  - Best for: Very large races (5000+ runners)

#### Use Cases
- Find the most common finish time
- Identify peak performance windows
- See if distribution is normal or skewed
- Compare your finish time to the "pack"

#### Technical Details
- Canvas size: 1200×600 pixels
- Bar color: Blue (#1f77b4)
- 1px gap between bars for clarity
- Dynamic Y-axis scaling based on max count

---

### 3. Stacked Start Buckets Histogram

**File**: `viz-start-buckets.js`

#### Purpose
Shows finish time distribution with color-coded segments representing different start time groups. Reveals how start waves affect finish times.

#### Features
- **X-axis**: Finish time in HH:MM format
- **Y-axis**: Number of finishers in bucket
- **Stacked segments**: Color-coded by start time
  - Blue shades: Early starters
  - Red shades: Late starters
- **30 start buckets**: Entire start time range divided into 30 equal windows
- **Interactive tooltips**: Hover to see start bucket and count
- **Runner highlighting**: Selected runner marked with red dot and arrow

#### Color Gradient
The visualization uses a color gradient to represent start times:
- **Early starters**: Cool colors (blue, cyan)
- **Middle starters**: Neutral colors (green, yellow)
- **Late starters**: Warm colors (orange, red)

#### Use Cases
- Analyze impact of wave starts on finish distribution
- See if late starters cluster at certain finish times
- Identify if early/late starts correlate with finish performance
- Understand race logistics and wave strategy

#### Technical Details
- Canvas size: 1200×600 pixels
- Start time divided into 30 equal buckets
- Color interpolation: HSL color space (240° to 0°)
- Segments stacked bottom-to-top by start bucket order

---

### 4. Start vs Finish Time Scatter

**File**: `viz-start-vs-finish.js`

#### Purpose
Plots each runner's net finish time against their relative start time. Helps identify patterns in how start position affects race performance.

#### Features
- **X-axis**: Net finish time in HH:MM format
- **Y-axis**: Relative start time (minutes after first starter)
- **Data points**: Semi-transparent blue dots for each finisher
- **Diagonal patterns**: Visible trends show start time effect
- **Interactive tooltips**: Hover to see runner details
- **Runner highlighting**: Selected runner shown in red with arrow

#### Interpreting the Plot
- **Vertical alignment**: Runners with similar finish times regardless of start
  - Indicates strong runners who overcame late starts
- **Diagonal alignment**: Finish time proportional to start time
  - Indicates race may have been crowded or start order matters
- **Horizontal spread**: Wide variation in finish times for same start
  - Shows performance variation within start wave
- **Clusters**: Groups of dots indicate wave starts
  - More visible with discrete wave starts vs rolling starts

#### Use Cases
- Assess fairness of start wave assignments
- Identify if late starters were disadvantaged
- Find runners who overcame late starts
- Analyze correlation between start and finish positions
- Understand overtaking patterns in the race

#### Technical Details
- Canvas size: 1200×800 pixels (taller for better Y-axis detail)
- Point radius: 3px
- Opacity: 0.6 (to see overlapping points)
- Relative start times calculated from earliest starter (T₀)

---

## Common Features

### All Visualizations Include:

#### 1. Watermark
- Positioned at bottom-right corner
- Links to your webpage
- Subtle gray color (#999999)
- Font size: 10px

#### 2. Attribution
- Positioned at bottom-left corner
- Credits datasport.pl as data source
- Includes link to datasport.pl
- Font size: 10px

#### 3. Axes and Labels
- **Titles**: Descriptive axis labels
- **Tick marks**: Regular intervals
- **Grid lines**: Where appropriate for readability
- **Dynamic scaling**: Adjusts to data range

#### 4. Runner Highlighting
When a runner is selected from the dropdown:
- **Red circle**: Larger, brighter marker
- **White outline**: 2px stroke for visibility
- **Arrow annotation**: Points to the runner
- **Name label**: Shows runner's full name
- **Adaptive positioning**: Arrow placement adjusts based on available space
  - Prefers top-right diagonal
  - Falls back to top-left if needed
  - Uses side placement if no top space

#### 5. Interactive Tooltips
- Hover over data points to see details
- Shows runner name, times, and other relevant info
- Implemented using SVG `<title>` elements
- Works in all modern browsers

---

## Filtering and Options

### Distance Filter
- Available when data contains multiple race distances
- Dropdown shows all distances found in data
- Common formats:
  - "Marathon (42.19 km)"
  - "Half Marathon (21.10 km)"
  - "10 km"
  - "5 km"
- Auto-selected if only one distance
- Regenerates all visualizations when changed

### Bucket Size Filter
Affects histograms (Net Times and Start Buckets):
- **60 seconds**: Highest detail
- **120 seconds**: Good balance (default)
- **300 seconds**: Broader overview
- **600 seconds**: Widest buckets

### Runner Selection
- Dropdown lists all runners alphabetically
- Format: "Name (Age Category) #Bib" or variations if data is missing
- Selecting a runner:
  - Highlights them in all visualizations
  - Shows their exact position/time
  - Adds red markers and annotations
- Select "None" to remove highlighting

---

## Downloading Visualizations

### Download Buttons
Each visualization has a download button below it:
- **"Download SVG"** button
- Downloads as standalone SVG file
- Default filenames:
  - `netto-times.svg`
  - `histogram.svg`
  - `start-buckets.svg`
  - `start-vs-finish.svg`

### SVG File Benefits
- **Scalable**: Can be resized without quality loss
- **Editable**: Open in vector graphics software (Inkscape, Illustrator, etc.)
- **Web-ready**: Can be embedded in websites
- **Print-ready**: High quality for reports and presentations
- **Small file size**: Text-based format compresses well

### Using Downloaded SVGs

#### In Web Pages:
```html
<img src="histogram.svg" alt="Race finish time histogram">
```

#### In Documents:
- Insert directly into Microsoft Word, PowerPoint, Google Docs
- Maintains quality at any size

#### In Graphics Software:
- Edit colors, labels, styling
- Add additional annotations
- Combine multiple visualizations
- Export to PNG, PDF, or other formats

---

## Technical Implementation

### SVG Generation
All visualizations are pure SVG (Scalable Vector Graphics):
- Generated dynamically from race data
- No external libraries (D3.js, Chart.js, etc.)
- Vanilla JavaScript for maximum compatibility
- Server-side rendering friendly

### Performance
- **Fast rendering**: Even for 10,000+ runners
- **Smooth updates**: Instant filter changes
- **Memory efficient**: SVG is text-based
- **No canvas fallback needed**: SVG supported everywhere

### Accessibility
- Semantic SVG structure
- Title elements for screen readers
- Descriptive labels
- High contrast colors
- Large enough touch targets

---

## Customization

### For Developers

Each visualization module exports a single function:

```javascript
// Import from visualization modules
import { generateNettoTimesSvg } from './viz-netto-times.js';
import { generateHistogramSvg } from './viz-histogram.js';
import { generateStartBucketsSvg } from './viz-start-buckets.js';
import { generateStartVsFinishSvg } from './viz-start-vs-finish.js';

// Generate SVG string
const svg = generateHistogramSvg(
  raceData,        // Array of race results
  bucketSize,      // Bucket size in seconds (60, 120, 300, 600)
  selectedRunner   // Runner object or null
);
```

### Style Modifications
To customize appearance, edit constants in visualization files:
- `SVG_WIDTH`, `SVG_HEIGHT`: Canvas dimensions
- `PADDING_*`: Margins around plot area
- Colors in hex format (e.g., `#1f77b4`)
- Font sizes and families
- Line widths and styles

### Adding New Visualizations
Follow the existing pattern:
1. Create new `viz-*.js` module
2. Export a generation function
3. Import in `visualizations.js`
4. Add container in `index.html`
5. Call generation in `app.js`

---

## Best Practices

### Choosing the Right Visualization

- **Net Times Scatter**: Best for overall performance view
- **Net Times Histogram**: Best for distribution analysis  
- **Start Buckets**: Best for wave start analysis
- **Start vs Finish**: Best for overtaking pattern analysis

### Analyzing Race Performance

1. **Start with histogram** to see overall distribution
2. **Check start buckets** if race had wave starts
3. **Use start vs finish** to analyze overtaking patterns
4. **Use scatter plot** for individual comparisons

### Sharing Visualizations

- Download SVGs before deleting race data
- Include watermark for attribution (don't crop it out)
- Link back to datasport.pl when sharing
- Mention the race name and date in captions

### Performance Tips

- Use larger bucket sizes for races with 5000+ runners
- Filter by distance before analyzing multi-distance events
- Highlight runners to help identify them in dense plots
- Zoom browser if you need to see details (SVG scales perfectly)
