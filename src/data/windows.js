/* Window type registry. Only `id`, `label`, and `modelPath` are read by
   the configurator; per-cell model swaps go through WINDOW_MODEL_PATHS
   (defined in configuratorData). The pricing / spec sheet / description
   copy was used by removed marketing components and is gone. */
export const WINDOW_TYPES = [
  { id: 'casement',      label: 'Casement',      modelPath: '/windows/casement/Casement.glb' },
  { id: 'awning',        label: 'Awning',        modelPath: '/windows/casement/Casement.glb' },
  { id: 'picture',       label: 'Picture',       modelPath: '/windows/casement/Casement.glb' },
  { id: 'single-hung',   label: 'Single Hung',   modelPath: '/windows/casement/Casement.glb' },
  { id: 'double-hung',   label: 'Double Hung',   modelPath: '/windows/casement/Casement.glb' },
  { id: 'single-slider', label: 'Single Slider', modelPath: '/windows/casement/Casement.glb' },
  { id: 'double-slider', label: 'Double Slider', modelPath: '/windows/casement/Casement.glb' },
  { id: 'end-vent',      label: 'End Vent',      modelPath: '/windows/casement/Casement.glb' },
  { id: 'high-fix',      label: 'High Fix',      modelPath: '/windows/casement/Casement.glb' },
];

/* Window types that ship as larger GLBs; we skip the shadow pass + dial
   back env-map intensity on these to keep first-paint snappy. */
export const HEAVY_MODELS = new Set([]);
