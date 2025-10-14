# datasport-results-analyzer

Generate SVG visualizations from `results.json` (a large race results data file):

1. Netto times scatter (`netto-times.svg`)
2. Netto times histogram (`histogram-netto-times.svg`)
3. Stacked finish vs start time histogram (`start-buckets-stacked.svg`)

## Prerequisites

- Node.js 18+ (project uses ES Modules)
- `results.json` in the project root (already present)

## Install

```fish
npm install
```

## Generate all graphs

```fish
npm run graphs
```

This simply chains the three Node scripts (no external runner dependency) and produces the SVG files.

Outputs are written alongside the scripts:

- `netto-times.svg`
- `histogram-netto-times.svg`
- `start-buckets-stacked.svg`

## Run individual scripts

```fish
npm run netto-times
npm run histogram-netto-times
npm run start-buckets-stacked
```

## Notes

- Scripts filter to finishers with non-zero placing and required time fields.
- All parsing is tolerant: malformed lines are skipped.
- Colors in the stacked histogram show earlier (red) to later (purple) start minutes.

## License

MIT (see `package.json`).
