import {
  defineConfig,
  presetAttributify,
  presetWind3,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss'

import brand from './src/common/colors'

export default defineConfig({
  presets: [presetWind3(), presetAttributify()],
  transformers: [
    // group
    transformerVariantGroup(),
    // @apply
    transformerDirectives(),
  ],
  shortcuts: {
    'flex-center': 'flex items-center justify-center',
    'chart-card': 'bg-[#1a1a1a] border border-[#333] rounded-lg p-4 shadow-lg',
    'glass-panel': 'bg-white/10 backdrop-blur-md border border-white/20',
  },
  theme: {
    colors: {
      brand,
    },
  },
})
