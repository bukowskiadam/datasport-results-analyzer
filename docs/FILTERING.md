# Filtering and Analysis Features

## Overview

The app provides powerful filtering capabilities to analyze specific subsets of race data and highlight individual runners. All filters work together and update visualizations in real-time.

## Available Filters

### 1. Distance Filter

**Purpose**: Analyze specific race distances in multi-distance events

#### When Available
- Automatically detected when uploaded data contains multiple distances
- Shows all unique distances found in the `odleglosc` field
- Dropdown appears only if multiple distances exist

#### Distance Display Format
- **10 km**: Displayed as "10 km"
- **Half Marathon**: Displayed as "Half Marathon (21.10 km)"
- **Marathon**: Displayed as "Marathon (42.19 km)"
- **Custom distances**: Displayed as "XX.XX km"

#### Behavior
- **Single distance race**: Dropdown disabled, distance auto-selected
- **Multi-distance race**: Dropdown enabled, default is "All Distances"
- **Selection**: Updates all four visualizations immediately
- **Result count**: Info text shows filtered count vs. total

#### Examples

**Before Filtering:**
```
5,234 total results across 3 distances
```

**After Filtering (Marathon selected):**
```
Showing 2,156 results
```

#### Common Use Cases
- Focus on your specific race distance
- Compare distributions between distances
- Exclude shorter/longer distances from analysis

---

### 2. Bucket Size Filter

**Purpose**: Control the granularity of histogram visualizations

#### Affects These Visualizations:
- ✅ Net Times Histogram
- ✅ Stacked Start Buckets Histogram
- ❌ Net Times Scatter (not affected)
- ❌ Start vs Finish (not affected)

#### Available Options

**60 seconds (1 minute)**
- Highest detail
- Many narrow bars
- Best for: Small races (<500 runners)
- Best for: Detailed time distribution analysis
- Example: Shows distinct spikes at popular finish times

**120 seconds (2 minutes)** - DEFAULT
- Balanced detail and overview
- Recommended for most races
- Best for: Medium races (500-2,000 runners)
- Best for: General distribution patterns

**300 seconds (5 minutes)**
- Broader grouping
- Clearer overall shape
- Best for: Large races (2,000-5,000 runners)
- Best for: High-level distribution view

**600 seconds (10 minutes)**
- Maximum grouping
- Simplified distribution
- Best for: Very large races (5,000+ runners)
- Best for: Quick overview of finish spread

#### Effect on Visualizations

**Net Times Histogram:**
```
60s:  Many bars, detailed peaks
120s: Balanced, most patterns visible
300s: Fewer bars, smooth distribution
600s: Very few bars, general shape only
```

**Start Buckets Histogram:**
- Same bucket size applied to finish time axis
- Start time always divided into 30 buckets (independent)
- Larger buckets = fewer stacked columns
- Easier to see start time color patterns with larger buckets

#### Choosing Bucket Size

**Consider these factors:**
1. **Race size**: Larger races → larger buckets
2. **Analysis goal**: 
   - Detail analysis → smaller buckets
   - Overview → larger buckets
3. **Visual clarity**: Too many bars = cluttered
4. **Performance data**: 
   - Packed field → smaller buckets show spikes
   - Spread field → larger buckets show trend

---

### 3. Runner Selection Filter

**Purpose**: Highlight a specific runner across all visualizations

#### Selection Interface
- **Dropdown**: Alphabetically sorted list of all runners
- **Format**: "Last Name First Name (#Bib)"
- **Example**: "Kowalski Jan (#42)"
- **None option**: Clears highlighting

#### Effects on Visualizations

**Net Times Scatter:**
- Selected runner shown as larger red dot (5px vs 2px)
- White outline (2px) for visibility
- Arrow annotation pointing to the dot
- Runner name displayed near arrow
- All other runners remain blue

**Net Times Histogram:**
- Bucket containing the runner marked with arrow
- Arrow points to top of the bucket
- Runner name displayed near arrow
- Bucket not visually different (contains multiple runners)

**Stacked Start Buckets:**
- Selected runner's position marked with red dot
- Shows exact location within stacked column
- Arrow annotation with runner name
- Helps identify which start bucket and finish time

**Start vs Finish:**
- Selected runner shown as larger red dot (6px vs 3px)
- White outline for visibility
- Arrow annotation with runner name
- Shows runner's start time and finish time position

#### Arrow Positioning

The app uses **adaptive positioning** to ensure labels are always visible:

**Priority 1: Top-right diagonal** (default)
```
          Name →
                ↘
                 ●
```

**Priority 2: Top-left diagonal** (if no space on right)
```
       ← Name
      ↙
     ●
```

**Priority 3: Side placement** (if no space above)
```
Name ← ● or ● → Name
```

#### Use Cases
- **Compare yourself** to the field
- **Track a friend** across visualizations
- **Study elite runners** performance patterns
- **Identify specific runners** in dense plots
- **Analyze overtaking** (start vs finish plot)

#### Technical Details
- Runner list generated from full dataset (not filtered)
- Index-based selection (maintains reference even after filtering)
- Survives distance filter changes
- Saved in session state (restored on page reload)

---

## Filter Interactions

### Combining Filters

All three filters work together:

**Example Workflow:**
1. Select "Marathon" distance → Shows only marathon runners
2. Select "300s" bucket → Histogram displays 5-minute buckets
3. Select specific runner → Runner highlighted if they ran marathon

**Important**: Runner highlighting only works if:
- Runner is in the current distance filter
- Runner has valid finish time
- Runner appears in the visualization's data

### Filter Persistence

**During Session:**
- All filters maintained while analyzing same result
- Switching between results resets filters
- Manual changes to filters are preserved

**Across Sessions:**
See [MEMORY_FEATURE.md](MEMORY_FEATURE.md) for details on:
- Filter state saved to localStorage
- Automatic restoration on page reload
- Clearing conditions

---

## Result Information Display

### Data Info Section

Located above visualizations, shows:

**After Upload:**
```
✓ Loaded 2,543 finishers from results.json (127 DNF/DNS excluded)
```

**After Loading Stored Result:**
```
✓ Loaded 2,543 finishers from storage: Warsaw Marathon 2023 (127 DNF/DNS excluded)
```

**Components:**
- ✓ Success indicator
- Finisher count (only those with valid times)
- Source (filename or "storage")
- DNF/DNS count (excluded from analysis)

### Distance Info Section

Shows impact of distance filter:

**All Distances:**
```
5,234 total results across 3 distances
```

**Single Distance:**
```
2,156 results
```

**Filtered:**
```
Showing 2,156 results
```

---

## Collapsible Filters Panel

### Header
Shows current result name:
```
┌─ results.json ───────────────────────────┐
│  Distance: All Distances                 │
│  Bucket Size: 2 minutes                  │
│  Highlight Runner: None                  │
└──────────────────────────────────────────┘
```

### Collapse/Expand
- **Click header**: Toggle panel visibility
- **Arrow indicator**: Shows current state (▼ expanded, ▶ collapsed)
- **Keyboard**: Enter or Space to toggle
- **Accessibility**: Proper ARIA attributes

### Use Cases
- **Collapsed**: Save screen space while viewing visualizations
- **Expanded**: Make filter adjustments
- **Default**: Expanded after loading new data

---

## Performance Considerations

### Real-Time Updates

**What Happens on Filter Change:**
1. Filter value changed (e.g., distance selected)
2. Data filtered based on new criteria
3. All 4 visualizations regenerated
4. SVG markup replaced in DOM
5. Session state saved
6. UI updated (info text, etc.)

**Performance:**
- Instant for small races (<1,000 runners)
- ~100-200ms for medium races (1,000-5,000)
- ~200-500ms for large races (5,000-10,000)
- No lag or freezing even with 10,000+ runners

### Optimization Techniques

**Efficient Filtering:**
```javascript
// Uses native Array.filter (optimized by browser)
const filtered = data.filter(r => r.odleglosc === selectedDistance);
```

**Selective Regeneration:**
- Only visible visualizations are regenerated
- SVG generation is pure JavaScript (no library overhead)
- Minimal DOM manipulation (single innerHTML replacement per viz)

**Smart State Management:**
- Filters don't re-fetch from IndexedDB
- Full dataset kept in memory during session
- Only filtered subset passed to viz generators

---

## Advanced Filtering Scenarios

### Multi-Distance Races

**Common Configurations:**
- Marathon + Half Marathon
- 10K + 5K + Kids Run
- Ultra distances (50K, 100K, etc.)

**Analysis Strategies:**
1. Start with "All Distances" for overview
2. Filter to your distance for detailed analysis
3. Compare distributions by switching distances
4. Note: Runner highlighting works across distances

### Wave Start Analysis

**Using Start Buckets Visualization:**
1. Leave distance filter on "All Distances"
2. Select medium bucket size (120s or 300s)
3. Look for color patterns:
   - Clear horizontal bands = discrete waves
   - Gradient = rolling start
   - Scattered colors = mixed start times

**Identifying Fairness:**
- Early starters (blue) finishing early = expected
- Late starters (red) finishing early = overcame disadvantage
- Mixed colors at same finish time = fair competition

### Pacing Analysis

**Using Bucket Size Variation:**
1. Start with 60s buckets for detail
2. Find the peak (most common finish time)
3. Switch to 300s for overall shape
4. Look for:
   - Single peak = evenly paced field
   - Multiple peaks = distinct runner groups
   - Long tail = wide performance variation

---

## Troubleshooting

### Filter Not Working

**Symptoms:**
- Changing filter doesn't update visualizations
- Error message appears

**Solutions:**
- Check browser console for errors
- Refresh page and reload result
- Verify data is loaded (info section shows data)

### Runner Not Highlighted

**Symptoms:**
- Runner selected but not visible in visualizations
- No arrow or red dot appears

**Possible Causes:**
1. **Runner filtered out**: Check if runner's distance matches filter
2. **Runner DNF**: Check if runner has valid finish time
3. **Runner outside view**: Check if runner's time is in axis range

**Solutions:**
- Set distance filter to "All Distances"
- Verify runner completed the race
- Check that runner appears in result data

### Performance Issues

**Symptoms:**
- Slow filter changes
- Browser lag or freeze

**Solutions:**
- Use larger bucket sizes (300s or 600s)
- Filter to single distance instead of all
- Check race size (10,000+ may be slower)
- Close other browser tabs
- Try in different browser

---

## Best Practices

### For Most Efficient Analysis:

1. **Start Broad**: Use "All Distances" and default bucket size
2. **Identify Patterns**: Look at all visualizations
3. **Drill Down**: Apply distance filter for specific analysis
4. **Adjust Buckets**: Fine-tune based on race size
5. **Highlight**: Select runners for specific comparisons
6. **Download**: Save SVGs before changing filters

### For Performance:
- Filter to single distance early (reduces data size)
- Use larger buckets for large races
- Collapse filter panel when not in use
- Don't rapidly change filters (give time to render)

### For Accuracy:
- Check DNF/DNS count (excluded from analysis)
- Verify distance filter matches your race
- Remember highlighted runners must match filter
- Compare different bucket sizes for validation
