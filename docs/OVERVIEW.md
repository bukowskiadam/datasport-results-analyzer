# Feature Overview

## Introduction

The datasport-results-analyzer is a comprehensive web-based tool for analyzing and visualizing race results from datasport.pl. This document provides a high-level overview of all features and links to detailed documentation.

## Quick Start

1. **Load Data**: Enter a datasport.pl URL and download the JSON file
2. **Upload**: Drag and drop the file into the upload zone
3. **Analyze**: View four different visualizations instantly
4. **Share**: Download SVGs or share visualizations via social media
5. **Filter**: Apply distance, bucket size, and runner filters
6. **Download**: Save SVG visualizations for reports or presentations
7. **Store**: Results automatically saved for future access

## Core Features

### 1. Data Loading
📖 **[Detailed Documentation](DATA_LOADING.md)**

- **URL-based loading** with automatic JSON endpoint construction
- **Drag-and-drop file upload** for quick access
- **Automatic validation** of data format and structure
- **DNF/DNS filtering** to show only completed runs
- **Large file support** (50MB+) via IndexedDB

**Quick Links:**
- [Loading Methods](DATA_LOADING.md#loading-methods)
- [CORS Restrictions](DATA_LOADING.md#cors-restrictions)
- [Error Handling](DATA_LOADING.md#error-handling)

### 2. Persistent Storage
📖 **[Detailed Documentation](STORAGE.md)**

- **IndexedDB-based storage** for large datasets
- **Multiple result management** with metadata
- **Inline name editing** for easy organization
- **Source URL tracking** to link back to datasport.pl
- **Storage quota monitoring** with visual indicators

**Quick Links:**
- [Storage Technology](STORAGE.md#storage-technology)
- [Result Cards UI](STORAGE.md#result-cards-ui)
- [Storage Quota Management](STORAGE.md#storage-quota-management)

### 3. Session Memory
📖 **[Detailed Documentation](MEMORY_FEATURE.md)**

- **Automatic session saving** after every action
- **Page refresh restoration** to continue where you left off
- **Filter state persistence** (distance, bucket size, runner)
- **localStorage-based** for reliability

**Quick Links:**
- [What's Remembered](MEMORY_FEATURE.md#whats-remembered)
- [How It Works](MEMORY_FEATURE.md#how-it-works)

### 4. Visualization Types
📖 **[Detailed Documentation](VISUALIZATIONS.md)**


Each visualization provides unique insights into race performance:

#### Net Times Scatter Plot
- Shows individual finish times vs position
- Identifies performance outliers
- Best for: Overall field analysis

#### Net Times Histogram
- Groups runners into time buckets
- Shows distribution patterns
- Best for: Finding common finish times

#### Stacked Start Buckets Histogram
- Color-coded by start time
- Shows wave start impact
- Best for: Analyzing start wave effects

#### Start vs Finish Time Scatter
- Plots start time vs finish time
- Reveals overtaking patterns
- Best for: Understanding race dynamics

**Quick Links:**
- [All Visualizations](VISUALIZATIONS.md#available-visualizations)
- [Common Features](VISUALIZATIONS.md#common-features)
- [Downloading SVGs](VISUALIZATIONS.md#downloading-visualizations)

### 5. Advanced Filtering
📖 **[Detailed Documentation](FILTERING.md)**

- **Distance filter** for multi-distance events
- **Bucket size control** (15s, 30s, 60s, 120s)
- **Runner highlighting** across all visualizations (up to 10 runners)
- **Real-time updates** with instant regeneration

**Quick Links:**
- [Distance Filter](FILTERING.md#1-distance-filter)
- [Bucket Size Filter](FILTERING.md#2-bucket-size-filter)
- [Runner Selection](FILTERING.md#3-runner-selection-filter)
- [Filter Interactions](FILTERING.md#filter-interactions)

### 6. SVG Export & Sharing
📖 **[Detailed Documentation](VISUALIZATIONS.md#downloading-visualizations)**

- **Scalable vector graphics** for quality output
- **PNG export** option for easy sharing
- **Share buttons** with social media integration
- **Individual download buttons** for each visualization
- **Web and print ready** formats
- **Editable** in graphics software

## User Interface

### Layout Overview

```
┌─────────────────────────────────────────────────────────┐
│  DATASPORT RESULTS ANALYZER                             │
├─────────────────────────────────────────────────────────┤
│  1. URL Input & Prepare Download                        │
│  2. Manual Download Section (if URL provided)           │
│  3. File Upload Zone (drag-and-drop)                    │
├─────────────────────────────────────────────────────────┤
│  4. Stored Results List (previous uploads)              │
│     - Result cards with metadata                        │
│     - Delete and edit options                           │
│     - Storage usage indicator                           │
├─────────────────────────────────────────────────────────┤
│  5. Filters Panel (collapsible)                         │
│     - Distance filter dropdown                          │
│     - Bucket size selector                              │
│     - Runner highlight selector                         │
├─────────────────────────────────────────────────────────┤
│  6. Visualizations (4 graphs)                           │
│     - Net Times Scatter                                 │
│     - Net Times Histogram                               │
│     - Start Buckets Histogram                           │
│     - Start vs Finish Scatter                           │
│     - Download buttons for each                         │
└─────────────────────────────────────────────────────────┘
```

### Key UI Elements

**URL Input Section**
- Text input for datasport.pl URL
- "Prepare Download" button
- Error message area

**Upload Zone**
- Drag-and-drop target
- "Browse Files" button
- Visual feedback on drag

**Result Cards**
- Editable name (click to edit)
- Metadata (count, size, date)
- Source URL link
- Edit URL button (✏️)
- Delete button (×)


**Filters Panel**
- Collapsible header (click to toggle)
- Three filter controls
- Info text showing current selection
- Remove button (×) next to each runner selector

**Visualization Containers**
- SVG display area
- Download button below each
- Responsive sizing

## Workflow Examples

### Analyzing a Single Race

1. **Load Data**
   - Enter datasport.pl URL
   - Download and upload JSON file
   
2. **Explore Visualizations**
   - Scroll through all four graphs
   - Identify patterns and outliers
   
3. **Apply Filters**
   - Select your distance (if multi-distance)
   - Adjust bucket size for clarity
   
4. **Highlight Yourself**
   - Select your name from dropdown
   - See your position across all graphs
   
5. **Share or Download Results**
   - Click share button to post on social media
   - Or click download for relevant graphs
   - Save for reports or sharing

### Comparing Multiple Races

1. **Upload First Race**
   - Follow standard upload process
   - Rename result (e.g., "Race A - 2023")
   
2. **Upload Second Race**
   - Upload another race
   - Rename (e.g., "Race B - 2023")
   
3. **Compare**
   - Click first result to load
   - Observe distribution patterns
   - Click second result to load
   - Compare visualizations
   
4. **Note Differences**
   - Histogram shape
   - Finish time spread
   - Start wave effects

### Team Analysis

1. **Load Team Race**
   - Upload race results
   
2. **For Each Team Member**
   - Select member from dropdown
   - Note their finish position
   - Download or share visualization
   
3. **Create Report**
   - Collect all downloaded SVGs
   - Insert into document
   - Add commentary

## Technical Stack

### Frontend Technologies
- **Pure JavaScript (ES6+)** - No frameworks
- **ES Modules** - Native import/export
- **SVG** - Scalable vector graphics
- **IndexedDB** - Client-side database
- **localStorage** - Session persistence

### Browser APIs Used
- IndexedDB API (storage)
- File API (upload)
- Drag and Drop API (UX)
- Storage API (quota estimation)
- localStorage API (session state)

### No Build Step
- Runs directly in modern browsers
- No transpilation needed
- No bundler required
- Direct ES module loading

## Code Architecture

### Modular Component Structure

The application follows a clean component-based architecture using vanilla JavaScript modules:

```
src/
├── app.js                     # Main application controller
├── components/                # Reusable UI components
│   ├── messages.js           # User feedback messages
│   ├── result-card.js        # Result card generation
│   ├── runner-selector.js    # Searchable runner selector
│   └── share-modal.js        # Sharing and export
├── datasport-fetcher.js      # Data fetching
├── storage.js                # IndexedDB operations
├── utils.js                  # Helper functions
├── visualizations.js         # Viz exports
└── viz-*.js                  # SVG generators
```

### Component Design Principles

**1. Separation of Concerns**
- UI components isolated from business logic
- Each module has a single, clear responsibility
- No circular dependencies

**2. Dependency Injection**
```javascript
// Components receive dependencies as parameters
showError(message, errorElement);
createRunnerSelector(data, onChangeCallback, trackEvent);
```

**3. Pure Functions & Callbacks**
```javascript
// Pure function: input → output
const html = createResultCard(result);

// Callbacks for side effects
const selector = createRunnerSelector(
  runners,
  () => regenerateVisualizations(),
  trackEvent
);
```

**4. Named Exports Only**
```javascript
// ✅ Always use named exports
export function createRunnerSelector() { }
export function getSelectedRunners() { }

// ❌ Never use default exports
export default function() { }
```

### Key Components

**messages.js** - User feedback
- `showError(message, element)` - Display errors with auto-hide
- `hideError(element)` - Manually hide errors

**result-card.js** - Result display
- `createResultCard(result)` - Generate result card HTML

**runner-selector.js** - Runner selection
- `createRunnerSelector(runners, onChange, trackEvent, selected)` - Create selector
- `getSelectedRunners(container)` - Get selected indices
- `prepareRunnersList(data)` - Prepare runner data

**share-modal.js** - Sharing functionality
- `showShareModal(svg, name, race, type, trackEvent, showError)` - Display modal
- `downloadAsPng(svg, name, type, trackEvent, showError)` - Export PNG

### Benefits of This Architecture

✅ **Maintainable** - Clear file structure, easy to find code  
✅ **Testable** - Pure functions, dependency injection  
✅ **Reusable** - Components work independently  
✅ **Readable** - Small focused modules  
✅ **No Framework** - Zero dependencies, no build step

## Browser Requirements

### Minimum Versions
- Chrome/Edge 63+
- Firefox 60+
- Safari 11.1+
- Opera 50+

### Required Features
- ES6 modules
- IndexedDB
- File API
- SVG support
- localStorage

### Not Supported
- Internet Explorer
- Very old mobile browsers
- Browsers with JavaScript disabled

## Data Privacy

### Local-Only Storage
- All data stays in your browser
- No server communication (except analytics)
- No account required
- Race data never leaves your device

### Analytics
- **Umami Analytics** - Privacy-focused, GDPR-compliant analytics
- **What's tracked**: Page views and feature usage (button clicks, filter changes)
- **What's NOT tracked**: Your race data, personal information, or uploaded files
- **Disabled on localhost** - No tracking during development
- **Purpose**: Understand which features are used to improve the app
- **No cookies** - Umami uses cookieless tracking
- **Anonymous** - No personal identification

### Events Tracked
- URL preparation (which race IDs are analyzed)
- Data loading method (upload vs storage)
- Filter usage (distance, bucket size, runner selection)
- Feature interactions (add/remove runner, etc.)

### Data Clearing
- Clear browser data removes all stored results
- Private mode: no persistence for results
- Manual delete: individual results
- Clear all: removes everything
- Analytics data: stored by Umami (not in your browser)

## Performance

### Supported Race Sizes
- **Small (< 500 runners)**: Instant
- **Medium (500-2,000)**: Very fast (~100ms)
- **Large (2,000-5,000)**: Fast (~200ms)
- **Very Large (5,000-10,000+)**: Good (~500ms)

### Optimization Tips
- Use larger bucket sizes for large races
- Filter by distance to reduce dataset
- Close unused browser tabs
- Modern browser recommended

## Common Use Cases

### For Runners
- Analyze your race performance
- Compare to the field
- Track improvement across races
- Share results with friends

### For Race Directors
- Visualize race distribution
- Analyze wave start effectiveness
- Identify pacing patterns
- Generate reports for sponsors

### For Coaches
- Evaluate athlete performance
- Compare team members
- Identify training needs
- Track seasonal progress

### For Researchers
- Study race dynamics
- Analyze overtaking patterns
- Research pacing strategies
- Compare race formats

## Getting Help

### Documentation Structure
```
docs/
├── OVERVIEW.md (this file) - High-level feature summary
├── DATA_LOADING.md - Data loading and upload
├── STORAGE.md - Result management and storage
├── MEMORY_FEATURE.md - Session persistence
├── FILTERING.md - Filtering and analysis options
└── VISUALIZATIONS.md - Visualization details
```

### Quick Reference

**Problem**: Cannot load data
→ See: [DATA_LOADING.md](DATA_LOADING.md#cors-restrictions)

**Problem**: Storage full
→ See: [STORAGE.md](STORAGE.md#storage-quota-management)

**Problem**: Filters not working
→ See: [FILTERING.md](FILTERING.md#troubleshooting)

**Problem**: Visualizations unclear
→ See: [VISUALIZATIONS.md](VISUALIZATIONS.md#choosing-the-right-visualization)

### Troubleshooting Steps

1. **Check browser console** for error messages
2. **Verify data format** (must be JSON array)
3. **Try different browser** (Chrome recommended)
4. **Clear browser cache** and try again
5. **Check documentation** for specific issue

## Future Enhancements

### Planned Features
- Export/import for result backup
- Additional visualization types
- Custom color schemes
- Advanced statistical analysis
- Comparison mode (side-by-side)

### Contributing
This is an open-source project. Contributions welcome for:
- Bug fixes
- Documentation improvements
- New visualization types
- Performance optimizations
- Browser compatibility

## Credits

### Data Source
Race data provided by datasport.pl

### Attribution
All generated visualizations include:
- Watermark linking to project
- Attribution to datasport.pl
- Proper crediting when sharing

### Open Source
This project uses only open web standards and no external libraries.

## License

See project repository for license information.

---

## Document Index

- **[OVERVIEW.md](OVERVIEW.md)** - This document (feature summary)
- **[DATA_LOADING.md](DATA_LOADING.md)** - Loading and uploading data
- **[STORAGE.md](STORAGE.md)** - Result storage and management  
- **[MEMORY_FEATURE.md](MEMORY_FEATURE.md)** - Session persistence
- **[FILTERING.md](FILTERING.md)** - Filtering and analysis
- **[VISUALIZATIONS.md](VISUALIZATIONS.md)** - Visualization details

---

**Last Updated**: October 22, 2025  
**App Version**: 1.0  
**Documentation Version**: 1.0
