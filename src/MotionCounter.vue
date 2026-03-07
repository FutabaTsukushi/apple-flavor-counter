<template>
  <div
    ref="counterRef"
    class="motion-counter"
    :style="{ fontSize: size + 'px', color: color }"
  >
    <div v-for="(col, index) in digitColumns" :key="index" class="digit-slot">
      <div :ref="el => setStripRef(el, index)" class="digit-strip">
        <span v-for="(digit, dIndex) in col.digits" :key="dIndex" class="digit">
          {{ digit }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  watch,
  nextTick,
  onMounted,
  useTemplateRef,
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

const counterRef = useTemplateRef<HTMLDivElement>('counterRef');
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

  // 1. Determine logical direction (increment or decrement)
  // We assume the shortest path on the circular dial (0-9)
  // But we also respect the "increasingDirection" prop for visual flow.

  // Logic:
  // If we are logically increasing (e.g. 2->8, 8->2 wrap), we want the strip to move in the "increasing" visual direction.
  // If we are logically decreasing (e.g. 8->2 direct, 2->8 wrap), we want the strip to move in the "decreasing" visual direction.

  const diff = (to - from + 10) % 10;
  const isIncrementing = diff <= 5; // Shortest path is forward?

  // Visual direction mapping:
  // increasingDirection='up':
  //   Incrementing -> Strip moves UP (y decreases), show sequences like [from, from+1, ..., to]
  //   Decrementing -> Strip moves DOWN (y increases), show sequences like [to, ..., from-1, from] (reversed view)
  //                  Wait, if strip moves down, we see numbers ABOVE current.
  //                  So the DOM sequence should be [to, ..., from]. Initial y at bottom (from).

  // increasingDirection='down':
  //   Incrementing -> Strip moves DOWN (y increases), show [to, ..., from].
  //   Decrementing -> Strip moves UP (y decreases), show [from, ..., to].

  const moveUp =
    (increasingDirection === 'up' && isIncrementing) ||
    (increasingDirection === 'down' && !isIncrementing);

  const sequence: number[] = [];

  if (moveUp) {
    // Sequence: [from, from+1, ..., to]
    // Strip starts at index 0 (from), moves to index N (to). y: 0 -> -N em
    let curr = from;
    sequence.push(curr);
    while (curr !== to) {
      curr = (curr + 1) % 10;
      sequence.push(curr);
    }
  } else {
    // Sequence: [to, to+1, ..., from] (reversed for visual logic)
    // Actually, if we want to move DOWN (y increases), we need numbers ABOVE the current one.
    // So the sequence in DOM should be: [to, (to-1), ..., from].
    // Strip starts at index N (from), moves to index 0 (to). y: -N em -> 0
    let curr = to;
    sequence.push(curr);
    while (curr !== from) {
      curr = (curr + 1) % 10;
      sequence.push(curr);
    }
    // Now sequence is [to, ..., from]
    // But wait, "to" is the target. "from" is current.
    // If we have [to, ..., from], and we are at "from" (bottom), y should be -(length-1) em.
    // Target is "to" (top), y should be 0.
  }

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
          if (progress > 0.1 && progress < 0.9) {
            gsap.set(strip, { filter: 'blur(2px)' });
          } else {
            gsap.set(strip, { filter: 'blur(0px)' });
          }
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
