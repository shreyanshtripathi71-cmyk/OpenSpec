/* Window type registry. Only `id`, `label`, and `modelPath` are read by
   the configurator; per-cell model swaps go through WINDOW_MODEL_PATHS
   (defined in configuratorData). The pricing / spec sheet / description
   copy was used by removed marketing components and is gone. */
export const WINDOW_TYPES = [
  { id: 'casement',      label: 'Casement',      modelPath: '/windows/casement/CasementWindow.gltf' },
  { id: 'awning',        label: 'Awning',        modelPath: '/windows/awning/AwningWindow.glb' },
  { id: 'picture',       label: 'Picture',       modelPath: '/windows/picture/PictureWindow_Model_1.gltf' },
  { id: 'single-hung',   label: 'Single Hung',   modelPath: '/windows/single-hung/SingleHungWindow_optimized.glb' },
  { id: 'double-hung',   label: 'Double Hung',   modelPath: '/windows/double-hung/DoubleHungWindow_optimized.glb' },
  { id: 'single-slider', label: 'Single Slider', modelPath: '/windows/single-slider/SingleSliderWindow_optimized.glb' },
  { id: 'double-slider', label: 'Double Slider', modelPath: '/windows/double-slider/DoubleSliderWindow_optimized.glb' },
  { id: 'end-vent',      label: 'End Vent',      modelPath: '/windows/end-vent/End Vent Slider Window_Model_1_optimized.glb' },
  { id: 'high-fix',      label: 'High Fix',      modelPath: '/windows/high-fix/HighFixWindow_DoubleGlazing.gltf' },
];

/* Window types that ship as larger GLBs; we skip the shadow pass + dial
   back env-map intensity on these to keep first-paint snappy. */
export const HEAVY_MODELS = new Set([
  'single-hung',
  'double-hung',
  'single-slider',
  'double-slider',
  'end-vent',
]);
