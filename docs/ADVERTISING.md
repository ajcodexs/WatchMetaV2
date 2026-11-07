# WatchMeta advertising components

The supplied Adsterra units are registered in `src/components/ads/adsterraUnits.js`.
Use the React wrappers instead of pasting provider scripts into `index.html`.

## Responsive banner

`AdsterraBanner` loads one banner per viewport:

- Desktop (`640px` and wider): 728x90
- Mobile (below `640px`): 320x50

It is currently placed below the player on movie and TV detail pages.

```jsx
import AdsterraBanner from '@/components/ads/AdsterraBanner.jsx';
<AdsterraBanner />
```

You can choose another supplied banner unit for either breakpoint:


Available banner names:

- `banner320x50`
- `banner728x90`

The component uses `max-width: 100%` and `overflow-hidden`, so a wide unit does not create horizontal page scrolling. Only the selected breakpoint unit is loaded.

## Native banner

The native unit is available as a separate component:

```jsx
<AdsterraNative />
```

Place it once in the page content where the native ad should appear. It is not loaded globally.

## Adding or changing units

1. Update the matching entry in `src/components/ads/adsterraUnits.js`.
2. Keep provider keys out of unrelated files and do not add global scripts to `index.html`.
3. Use `npm run build` after changing a unit.
4. Test both a narrow mobile viewport and a desktop viewport to confirm only one responsive banner is loaded.

Provider scripts are third-party content and may still display their own advertisements inside the iframe. The React layer controls placement and loading timing, but cannot remove content inside a cross-origin provider frame.
