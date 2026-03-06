<template>
  <div
    ref="counterRef"
    class="motion-counter"
    :style="{ fontSize: size + 'px', color: color }"
  >
    <div v-for="(_, index) in digitColumns" :key="index" class="digit-slot">
      <div :ref="el => setStripRef(el, index)" class="digit-strip">
        <span v-for="digit in 10" :key="digit - 1" class="digit">
          {{ digit - 1 }}
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
    animation: null
  }));

  nextTick(() => {
    digitColumns.value.forEach((col, index) => {
      const strip = stripRefs.value.get(index);
      if (strip) {
        gsap.set(strip, { y: `${-col.currentValue}em` });
      }
    });
  });
});

function getScrollDirection(
  from: number,
  to: number
): { steps: number; direction: 'up' | 'down' } {
  const diff = to - from;
  const isIncreasing = diff > 0;

  let direction: 'up' | 'down';
  let steps: number;

  if (isIncreasing) {
    direction = props.increasingDirection;
    steps = direction === 'up' ? diff : 10 - diff;
  } else {
    direction = props.increasingDirection === 'up' ? 'down' : 'up';
    steps = direction === 'up' ? Math.abs(diff) : 10 - Math.abs(diff);
  }

  return { steps, direction };
}

function animateToDigit(
  index: number,
  from: number,
  to: number
): Promise<void> {
  return new Promise(resolve => {
    const strip = stripRefs.value.get(index);
    if (!strip) {
      resolve();
      return;
    }

    if (from === to) {
      resolve();
      return;
    }

    const { steps, direction } = getScrollDirection(from, to);

    if (digitColumns.value[index].animation) {
      digitColumns.value[index].animation!.kill();
    }

    const duration = (steps * props.stepDuration) / 1000;

    const currentY = -from;
    const distance = direction === 'up' ? -steps : steps;
    const targetY = currentY + distance;

    const anim = gsap.to(strip, {
      y: `${targetY}em`,
      duration,
      ease: 'power2.inOut',
      onUpdate: function () {
        const progress = this.progress();
        const velocity = Math.abs(this.getVelocity ? this.getVelocity() : 0);
        const blurAmount = Math.min(velocity * 0.01, 4);

        if (progress > 0.1 && progress < 0.9) {
          gsap.set(strip, { filter: `blur(${blurAmount}px)` });
        }
      },
      onComplete: () => {
        gsap.set(strip, { y: `${-to}em`, filter: 'blur(0px)' });
        digitColumns.value[index].currentValue = to;
        digitColumns.value[index].animation = null;
        resolve();
      }
    });

    digitColumns.value[index].animation = anim;
  });
}

const updateCounter = async (newValue: number) => {
  const oldValue = lastStableValue;

  const newStrRaw = newValue.toString();
  const oldStrRaw = oldValue.toString();
  const maxLength = Math.max(newStrRaw.length, oldStrRaw.length);

  const newStr = newStrRaw.padStart(maxLength, '0');
  const oldStr = oldStrRaw.padStart(maxLength, '0');

  const newArr = newStr.split('').map(d => parseInt(d));
  const oldArr = oldStr.split('').map(d => parseInt(d));

  while (digitColumns.value.length < maxLength) {
    digitColumns.value.push({
      currentValue: 0,
      animation: null
    });
  }

  while (digitColumns.value.length > maxLength) {
    const removed = digitColumns.value.pop();
    if (removed?.animation) {
      removed.animation.kill();
    }
    const lastIndex = digitColumns.value.length;
    stripRefs.value.delete(lastIndex);
  }

  await nextTick();

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

  digitColumns.value = newStrRaw.split('').map(d => ({
    currentValue: parseInt(d),
    animation: null
  }));

  await nextTick();

  newStrRaw.split('').forEach((digit, index) => {
    const strip = stripRefs.value.get(index);
    if (strip) {
      gsap.set(strip, { y: `-${digit}em`, filter: 'blur(0px)' });
    }
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
