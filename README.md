# Motion Counter

A Vue 3 counter component with smooth animations, inspired by motion design aesthetics.

## Features

- Combination lock-style digit rolling animation
- Calculates shortest path (direct or wrap-around) for each digit
- Smooth step-by-step transitions using GSAP
- Configurable debounce for rapid updates
- Customizable size, color, and animation speed
- TypeScript support

## Installation

```bash
npm install motion-counter
# or
pnpm add motion-counter
# or
yarn add motion-counter
```

## Usage

### Global Registration

```ts
import { createApp } from 'vue'
import { MotionCounter } from 'motion-counter'
import 'motion-counter/style.css'

const app = createApp(App)
app.component('MotionCounter', MotionCounter)
```

### Local Registration

```vue
<script setup>
import { ref } from 'vue'
import { MotionCounter } from 'motion-counter'
import 'motion-counter/style.css'

const count = ref(0)
</script>

<template>
  <MotionCounter v-model="count" />
</template>
```

## Props

| Prop                  | Type             | Default     | Description                                           |
| --------------------- | ---------------- | ----------- | ----------------------------------------------------- |
| `modelValue`          | `number`         | Required    | The counter value to display                          |
| `debounce`            | `number`         | `300`       | Debounce time in milliseconds for value updates       |
| `size`                | `number`         | `48`        | Font size in pixels                                   |
| `color`               | `string`         | `'inherit'` | Text color                                            |
| `stepDuration`        | `number`         | `80`        | Duration of each digit step animation in milliseconds |
| `increasingDirection` | `'up' \| 'down'` | `'up'`      | Scroll direction when digit increases                 |

## Animation Behavior

The component simulates a combination lock (rotary dial) effect:

- **Shortest Path Calculation**: For each digit, calculates whether to go directly or wrap around through 0
  - Example: 2 → 8 goes down (2→1→0→9→8, 4 steps) instead of up (6 steps)
  - Example: 8 → 2 goes up (8→9→0→1→2, 4 steps) instead of down (6 steps)
- **Step-by-Step Rolling**: Each digit animates through intermediate values
- **Blur Effect**: Smooth blur transition for a polished look
- **Configurable Direction**:
  - `increasingDirection="up"` (default): digits scroll up when increasing
  - `increasingDirection="down"`: digits scroll down when increasing

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
