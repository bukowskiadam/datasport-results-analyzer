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

**15 seconds**
- Very high detail
- Many narrow bars
- Best for: Very small races (<200 runners)
- Best for: Extremely detailed time distribution analysis
- Example: Shows precise finish time patterns

**30 seconds**
- High detail
- Clear narrow bars
- Best for: Small races (200-500 runners)
- Best for: Detailed time distribution analysis

**60 seconds (1 minute)** - DEFAULT
- Balanced detail and overview
- Recommended for most races
- Best for: Medium races (500-2,000 runners)
- Best for: General distribution patterns

**120 seconds (2 minutes)**
- Broader grouping
- Clearer overall shape
- Best for: Large races (2,000-5,000 runners)
- Best for: High-level distribution view

#### Effect on Visualizations

**Net Times Histogram:**
```
15s:  Very many bars, extremely detailed peaks
30s:  Many bars, detailed peaks
60s:  Balanced, most patterns visible
120s: Fewer bars, smooth distribution
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

**Purpose**: Highlight specific runners across all visualizations for easy comparison

#### Selection Interface
- **Searchable input fields**: Each field allows typing to search for runners with autocomplete
- **Real-time filtering**: Results appear as you type, showing up to 50 matching runners
- **Search by**: Runner name, age category, distance, or bib number
- **Format (single distance)**: "Last Name First Name (Age Category) #Bib"
- **Format (multi-distance)**: "Last Name First Name (Age Category Distance) #Bib"
- **Example (single distance)**: "Kowalski Jan (M40) #42"
- **Example (multi-distance)**: "Kowalski Jan (M40 42.19km) #42"
- **Keyboard navigation**: Use arrow keys to navigate results, Enter to select, Escape to close
- **Add runners**: Click the "+ Add Runner" button to add more search fields (up to 10)
- **Remove runners**: Click the "×" button next to any field to remove it
- **Multiple runners**: Each runner gets a different color for easy identification
- **Default state**: One empty search field appears when data is loaded
- **Mobile friendly**: Works great with virtual keyboards and touch screens

#### How to Use
1. **Search for first runner**: Type in the search field to filter runners by name, bib, or category
2. **Select from results**: Click a runner from the autocomplete dropdown, or use arrow keys and Enter
3. **Add more runners**: Click the "+ Add Runner" button to add another search field
4. **Search additional runners**: Type in new fields to find and select more runners
5. **Remove a runner**: Click the "×" button next to their field to remove it
6. **View comparison**: All selected runners appear highlighted across all visualizations
7. **Limit**: Maximum of 10 runners can be selected (button hides when limit reached)

**Search Tips:**
- Type any part of the runner's name (first or last)
- Search by bib number for quick access
- In multi-distance races, you can search by distance (e.g., "42" for marathon)
- Results update as you type (shows top 50 matches)
- Use arrow keys to navigate, Enter to select
- Works great on mobile with virtual keyboard

#### Color Scheme for Multiple Runners
When multiple runners are selected, they are highlighted with different colors:
- **Runner 1**: Red (#ff4444)
- **Runner 2**: Green (#00cc00)
- **Runner 3**: Orange (#ff8800)
- **Runner 4**: Purple (#8844ff)
- **Runner 5**: Cyan (#00cccc)
- **Runner 6+**: Colors repeat (Runner 6 = Red, Runner 7 = Green, etc.)

The color system helps distinguish between runners when comparing multiple athletes across all four visualizations.

#### Effects on Visualizations

**Net Times Scatter:**
- Each selected runner shown as larger colored dot (5px vs 2px)
- White outline (2px) for visibility
- Arrow annotation pointing to each dot
- Runner name displayed near each arrow (in matching color)
- All non-selected runners remain blue

**Net Times Histogram:**
- Buckets containing selected runners marked with colored arrows
- Each arrow points to top of the bucket
- Runner names displayed near arrows (in matching colors)
- Multiple runners in same bucket get vertically stacked labels

**Stacked Start Buckets:**
- Each selected runner's position marked with colored dot
- Shows exact location within stacked column
- Arrow annotation with runner name (in matching color)
- Helps compare which start bucket and finish time for each runner

**Start vs Finish:**
- Each selected runner shown as larger colored dot (6px vs 3px)
- White outline for visibility
- Arrow annotation with runner name (in matching color)
- Easy comparison of start times and finish times across multiple runners

#### Arrow Positioning

The app uses **adaptive positioning** with automatic vertical spacing to prevent label overlap:

**For multiple runners:**
- Each subsequent runner's label is offset vertically by 25px
- Labels automatically adjust position to avoid collisions
- Arrows intelligently choose between top-right, top-left, or side placement

**Priority 1: Top-right diagonal** (default)
```
          Runner 1 →
                ↘
          Runner 2 → ●
                ↘    ●
                 ●
```

**Priority 2: Top-left diagonal** (if no space on right)
```
       ← Runner 1
      ↙
← Runner 2 ●
  ↙        ●
 ●
```

**Priority 3: Side placement** (if no space above)
```
Runner 1 ← ● or ● → Runner 1
Runner 2 ← ● or ● → Runner 2
```

#### Use Cases
- **Compare teammates** performance in the same race
- **Compare yourself with friends** across all visualizations
- **Study elite runners** and compare their patterns
- **Analyze pacing strategies** of multiple runners
- **Compare age group winners** across visualizations
- **Track training group members** in the same race
- **Quick bib number search** for finding specific runners in large races (10,000+ runners)

#### Tips for Multi-Runner Selection
- **2-3 runners**: Best for detailed comparison
- **4-5 runners**: Still readable, good for team analysis
- **More than 5**: Colors repeat, labels may overlap in dense areas
- **Maximum 10 runners**: Limited for performance and readability
- **Remove unused**: Delete empty dropdowns to keep UI clean

#### Technical Details
- Runner list generated from full dataset (not filtered)
- Searchable autocomplete with real-time filtering
- Shows up to 50 matching results for performance
- **Distance display**: Automatically shown when race has multiple distances
- Distance format: Converted from meters to kilometers (e.g., "42.19km")
- Index-based selection (maintains reference even after filtering)
- Survives distance filter changes
- Saved in session state (restored on page reload)
- Array-based storage in filterState: `runners: ["42", "156", "89"]`
- Maximum 10 runners enforced by UI (for performance and readability)
- Each runner selector is independently removable
- Keyboard accessible (arrow keys, Enter, Escape)

---

## Filter Interactions

### Combining Filters

All three filters work together:

**Example Workflow:**
1. Select "Marathon" distance → Shows only marathon runners
2. Select "300s" bucket → Histogram displays 5-minute buckets
3. Select 2-3 specific runners → All highlighted with different colors for comparison

**Important**: Runner highlighting only works if:
- Runners are in the current distance filter
- Runners have valid finish times
- Runners appear in the visualization's data

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
1. Start with 30s or 60s buckets for detail
2. Find the peak (most common finish time)
3. Switch to 120s for overall shape
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

### Runners Not Highlighted

**Symptoms:**
- Runners selected but not visible in visualizations
- No arrows or colored dots appear

**Possible Causes:**
1. **Runners filtered out**: Check if runners' distance matches filter
2. **Runners DNF**: Check if runners have valid finish times
3. **Runners outside view**: Check if runners' times are in axis range

**Solutions:**
- Set distance filter to "All Distances"
- Verify runners completed the race
- Check that runners appear in result data

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
- Use 60s or 120s buckets for large races (avoid 15s/30s)
- Collapse filter panel when not in use
- Don't rapidly change filters (give time to render)

### For Accuracy:
- Check DNF/DNS count (excluded from analysis)
- Verify distance filter matches your race
- Remember highlighted runners must match filter
- Compare different bucket sizes for validation
