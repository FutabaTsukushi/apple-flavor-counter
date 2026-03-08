<script setup lang="ts">
import {
  ref,
  watch,
  nextTick,
  onMounted,
  type ComponentPublicInstance
} from 'vue';
import gsap from 'gsap';

const props = defineProps({
  modelValue: {
    type: Number,
    required: true
  },
  debounce: {
    type: Number,
    default: 300
  },
  size: {
    type: Number,
    default: 48
  },
  color: {
    type: String,
    default: 'inherit'
  },
  stepDuration: {
    type: Number,
    default: 80
  },
  increasingDirection: {
    type: String as () => 'up' | 'down',
    default: 'up',
    validator: (v: string) => ['up', 'down'].includes(v)
  }
});

interface DigitColumn {
  currentValue: number;
  digits: number[];
  animation: gsap.core.Tween | null;
}

const digitColumns = ref<DigitColumn[]>([]);
const stripRefs = ref<Map<number, HTMLDivElement>>(new Map());

let timeoutId: ReturnType<typeof setTimeout> | null = null;
let lastStableValue = props.modelValue;

function setStripRef(
  el: Element | ComponentPublicInstance | null,
  index: number
) {
  if (el && el instanceof Element) {
    stripRefs.value.set(index, el as HTMLDivElement);
  }
}

onMounted(() => {
  const str = props.modelValue.toString().split('');
  digitColumns.value = str.map(d => ({
    currentValue: parseInt(d),
    digits: [parseInt(d)],
    animation: null
  }));

  nextTick(() => {
    digitColumns.value.forEach((_, index) => {
      const strip = stripRefs.value.get(index);
      if (strip) {
        gsap.set(strip, { y: 0 });
      }
    });
  });
});

interface ScrollSequence {
  sequence: number[];
  moveUp: boolean;
}

function getScrollSequence(
  from: number,
  to: number,
  increasingDirection: 'up' | 'down'
): ScrollSequence {
  if (from === to) return { sequence: [from], moveUp: true };

  const forwardSteps = (to - from + 10) % 10;
  const backwardSteps = (from - to + 10) % 10;
  const isIncrementing = forwardSteps <= backwardSteps;

  // Build the shortest path in logical order (from -> ... -> to)
  const step = isIncrementing ? 1 : -1;
  const path: number[] = [from];
  let curr = from;
  while (curr !== to) {
    curr = (curr + step + 10) % 10;
    path.push(curr);
  }

  const moveUp =
    (increasingDirection === 'up' && isIncrementing) ||
    (increasingDirection === 'down' && !isIncrementing);

  // For downward motion we need the current digit at the bottom of the strip,
  // so use the reversed sequence to align start/end positions.
  const sequence = moveUp ? path : [...path].reverse();

  return { sequence, moveUp };
}

function animateToDigit(
  index: number,
  from: number,
  to: number
): Promise<void> {
  return new Promise(resolve => {
    const col = digitColumns.value[index];
    const strip = stripRefs.value.get(index);
    if (!strip || !col) {
      resolve();
      return;
    }

    if (from === to) {
      resolve();
      return;
    }

    if (col.animation) {
      col.animation.kill();
    }

    // Determine sequence and direction
    const { sequence, moveUp } = getScrollSequence(
      from,
      to,
      props.increasingDirection
    );

    // Update DOM
    col.digits = sequence;

    nextTick(() => {
      // Setup initial position
      const totalSteps = sequence.length - 1;

      let startY = 0;
      let targetY = 0;

      if (moveUp) {
        // [from, ..., to]
        // Start at from (top, index 0), y=0
        // End at to (bottom, index N), y=-N
        startY = 0;
        targetY = -totalSteps;
      } else {
        // [to, ..., from]
        // Start at from (bottom, index N), y=-N
        // End at to (top, index 0), y=0
        startY = -totalSteps;
        targetY = 0;
      }

      gsap.set(strip, { y: `${startY}em` });

      const duration = (totalSteps * props.stepDuration) / 1000;

      const anim = gsap.to(strip, {
        y: `${targetY}em`,
        duration,
        ease: 'power2.inOut',
        onUpdate: function () {
          // Add blur effect based on velocity
          // We can approximate velocity or use GSAP's tracker if available,
          // but here we just check progress speed? No, let's use a simple heuristic.
          // Or just leave it for now since we don't have the inertia plugin.
          // The previous code used this.getVelocity(), but that requires InertiaPlugin or Draggable.
          // Assuming standard GSAP, we can't get velocity easily without plugins.
          // We can skip blur for now to ensure stability, or use a fixed blur during animation.
          const progress = this.progress();
          // Calculate blur based on a sine curve for a smooth transition from 0 to 2px back to 0
          const blurValue = Math.sin(progress * Math.PI) * 2;
          gsap.set(strip, { filter: `blur(${blurValue}px)` });
        },
        onComplete: () => {
          // Cleanup
          col.currentValue = to;
          col.digits = [to];
          col.animation = null;

          // Reset position synchronously with DOM update
          // We need to wait for Vue to render the single digit [to]
          // Then reset y to 0 (since it's the only digit)
          nextTick(() => {
            gsap.set(strip, { y: 0, filter: 'blur(0px)' });
            resolve();
          });
        }
      });

      col.animation = anim;
    });
  });
}

// Need to update the getScrollSequence return type locally or use `any` if lazy
// But let's fix the logic above first.
// Redefining getScrollSequence inside or outside.

const updateCounter = async (newValue: number) => {
  const oldValue = lastStableValue;

  const newStrRaw = newValue.toString();
  const oldStrRaw = oldValue.toString();
  const maxLength = Math.max(newStrRaw.length, oldStrRaw.length);

  const newStr = newStrRaw.padStart(maxLength, '0');
  const oldStr = oldStrRaw.padStart(maxLength, '0');

  const newArr = newStr.split('').map(d => parseInt(d));
  const oldArr = oldStr.split('').map(d => parseInt(d));

  // Adjust column count
  while (digitColumns.value.length < maxLength) {
    digitColumns.value.push({
      currentValue: 0,
      digits: [0],
      animation: null
    });
  }

  // Initialize new columns position
  await nextTick();
  digitColumns.value.forEach((_, idx) => {
    if (idx >= oldArr.length) {
      // New columns
      const strip = stripRefs.value.get(idx);
      if (strip) gsap.set(strip, { y: 0 });
    }
  });

  while (digitColumns.value.length > maxLength) {
    const removed = digitColumns.value.pop();
    if (removed?.animation) {
      removed.animation.kill();
    }
    stripRefs.value.delete(digitColumns.value.length);
  }

  const animations: Promise<void>[] = [];

  for (let i = 0; i < maxLength; i++) {
    const oldDigit = oldArr[i];
    const newDigit = newArr[i];

    if (oldDigit !== newDigit) {
      animations.push(animateToDigit(i, oldDigit, newDigit));
    }
  }

  await Promise.all(animations);

  lastStableValue = newValue;

  // Final cleanup for consistency
  digitColumns.value = newStrRaw.split('').map(d => ({
    currentValue: parseInt(d),
    digits: [parseInt(d)],
    animation: null
  }));

  await nextTick();
  stripRefs.value.forEach(strip => {
    gsap.set(strip, { y: 0, filter: 'blur(0px)' });
  });
};

watch(
  () => props.modelValue,
  newVal => {
    if (timeoutId) clearTimeout(timeoutId);

    if (!props.debounce) {
      updateCounter(newVal);
      return;
    }

    timeoutId = setTimeout(() => {
      updateCounter(newVal);
    }, props.debounce);
  }
);
</script>

<template>
  <div class="motion-counter" :style="{ fontSize: size + 'px', color: color }">
    <div v-for="(col, index) in digitColumns" :key="index" class="digit-slot">
      <div :ref="el => setStripRef(el, index)" class="digit-strip">
        <span v-for="(digit, dIndex) in col.digits" :key="dIndex" class="digit">
          {{ digit }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.motion-counter {
  display: inline-flex;
  font-feature-settings: 'tnum';
  font-variant-numeric: tabular-nums;
  overflow: hidden;
  line-height: 1;
}

.digit-slot {
  position: relative;
  display: inline-block;
  width: 0.6em;
  height: 1em;
  overflow: hidden;
}

.digit-strip {
  display: flex;
  flex-direction: column;
  will-change: transform;
}

.digit {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 1em;
  line-height: 1;
}
</style>
