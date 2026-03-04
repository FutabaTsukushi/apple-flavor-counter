# Apple Flavor Counter

A Vue 3 counter component with smooth animations, inspired by Apple's design aesthetic.

## Features

- Smooth digit transition animations using GSAP
- Automatic directional animation (up/down based on value change)
- Configurable debounce for rapid updates
- Customizable size and color
- TypeScript support
- Zero dependencies (except Vue 3 and GSAP)

## Installation

```bash
npm install apple-flavor-counter
# or
pnpm add apple-flavor-counter
# or
yarn add apple-flavor-counter
```

## Usage

### Global Registration

```ts
import { createApp } from 'vue'
import { AppleFlavorCounter } from 'apple-flavor-counter'
import 'apple-flavor-counter/style.css'

const app = createApp(App)
app.component('AppleFlavorCounter', AppleFlavorCounter)
```

### Local Registration

```vue
<script setup>
import { ref } from 'vue'
import { AppleFlavorCounter } from 'apple-flavor-counter'
import 'apple-flavor-counter/style.css'

const count = ref(0)
</script>

<template>
  <AppleFlavorCounter v-model="count" />
</template>
```

## Props

| Prop         | Type     | Default     | Description                                     |
| ------------ | -------- | ----------- | ----------------------------------------------- |
| `modelValue` | `number` | Required    | The counter value to display                    |
| `debounce`   | `number` | `300`       | Debounce time in milliseconds for value updates |
| `size`       | `number` | `48`        | Font size in pixels                             |
| `color`      | `string` | `'inherit'` | Text color                                      |

## Animation Behavior

- When a digit **increases**: The new digit slides in from the **top** while the old digit exits downward
- When a digit **decreases**: The new digit slides in from the **bottom** while the old digit exits upward
- Both animations include a smooth blur effect for a polished look

## Development

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test

# Run tests once
pnpm test:run

# Run tests with coverage
pnpm test:coverage

# Lint code
pnpm lint

# Format code
pnpm format
```

## License

MIT
