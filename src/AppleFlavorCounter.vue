<template>
  <div
    ref="counterRef"
    class="apple-counter"
    :style="{ fontSize: size + 'px', color: color }"
  >
    <div
      v-for="(digitState, index) in displayDigits"
      :key="index"
      class="digit-slot"
    >
      <span v-if="digitState.old !== null" class="digit old">
        {{ digitState.old }}
      </span>

      <span class="digit new">
        {{ digitState.current }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted, useTemplateRef } from 'vue'
import gsap from 'gsap'

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
  }
})

interface DigitState {
  current: string
  old: string | null
  direction: 'from-bottom' | 'from-top' | null
}

const counterRef = useTemplateRef<HTMLDivElement>('counterRef')
const displayDigits = ref<DigitState[]>([])

let timeoutId: ReturnType<typeof setTimeout> | null = null
let lastStableValue = props.modelValue
const animationQueues: Map<number, Promise<void>> = new Map()

onMounted(() => {
  const str = props.modelValue.toString().split('')
  displayDigits.value = str.map(d => ({
    current: d,
    old: null,
    direction: null
  }))
})

function getShortestPath(
  from: number,
  to: number
): { steps: number; direction: 'up' | 'down' } {
  const directDiff = to - from
  const clockwiseSteps = ((directDiff % 10) + 10) % 10
  const counterClockwiseSteps = 10 - clockwiseSteps

  if (clockwiseSteps <= counterClockwiseSteps) {
    return { steps: clockwiseSteps, direction: 'up' }
  } else {
    return { steps: counterClockwiseSteps, direction: 'down' }
  }
}

function getNextDigit(current: number, direction: 'up' | 'down'): number {
  if (direction === 'up') {
    return (current + 1) % 10
  } else {
    return (current - 1 + 10) % 10
  }
}

async function animateStep(
  index: number,
  fromDigit: string,
  toDigit: string,
  direction: 'up' | 'down'
): Promise<void> {
  return new Promise(resolve => {
    displayDigits.value[index] = {
      current: toDigit,
      old: fromDigit,
      direction: direction === 'up' ? 'from-bottom' : 'from-top'
    }

    nextTick(() => {
      if (!counterRef.value) {
        resolve()
        return
      }

      const slots = counterRef.value.querySelectorAll('.digit-slot')
      const slot = slots[index]
      if (!slot) {
        resolve()
        return
      }

      const oldEl = slot.querySelector('.old')
      const newEl = slot.querySelector('.new')

      if (oldEl && newEl) {
        const isFromBottom = direction === 'up'
        const yOffset = 100

        gsap.killTweensOf([oldEl, newEl])

        gsap.fromTo(
          oldEl,
          { yPercent: 0, opacity: 1, filter: 'blur(0px)' },
          {
            yPercent: isFromBottom ? -yOffset : yOffset,
            opacity: 0,
            filter: 'blur(10px)',
            duration: props.stepDuration / 1000,
            ease: 'power2.out'
          }
        )

        gsap.fromTo(
          newEl,
          {
            yPercent: isFromBottom ? yOffset : -yOffset,
            opacity: 0,
            filter: 'blur(10px)'
          },
          {
            yPercent: 0,
            opacity: 1,
            filter: 'blur(0px)',
            duration: props.stepDuration / 1000,
            ease: 'power2.out',
            onComplete: resolve
          }
        )
      } else {
        resolve()
      }
    })
  })
}

async function animateDigit(
  index: number,
  fromChar: string,
  toChar: string
): Promise<void> {
  const from = parseInt(fromChar)
  const to = parseInt(toChar)

  if (from === to) return

  const { steps, direction } = getShortestPath(from, to)
  let current = from

  for (let i = 0; i < steps; i++) {
    const next = getNextDigit(current, direction)
    await animateStep(index, current.toString(), next.toString(), direction)
    current = next
  }
}

const updateCounter = async (newValue: number) => {
  const oldValue = lastStableValue

  let newStr = newValue.toString()
  let oldStr = oldValue.toString()
  const maxLength = Math.max(newStr.length, oldStr.length)

  newStr = newStr.padStart(maxLength, '0')
  oldStr = oldStr.padStart(maxLength, '0')

  const newArr = newStr.split('')
  const oldArr = oldStr.split('')

  displayDigits.value = newArr.map(digit => ({
    current: digit,
    old: null,
    direction: null
  }))

  lastStableValue = newValue

  await nextTick()

  const animations: Promise<void>[] = []

  for (let i = 0; i < maxLength; i++) {
    const oldDigit = oldArr[i]
    const newDigit = newArr[i]

    if (oldDigit !== newDigit) {
      const animPromise = animateDigit(i, oldDigit, newDigit)
      animationQueues.set(i, animPromise)
      animations.push(animPromise)
    }
  }

  await Promise.all(animations)
}

watch(
  () => props.modelValue,
  newVal => {
    if (timeoutId) clearTimeout(timeoutId)

    if (!props.debounce) {
      updateCounter(newVal)
      return
    }

    timeoutId = setTimeout(() => {
      updateCounter(newVal)
    }, props.debounce)
  }
)
</script>

<style scoped>
.apple-counter {
  display: inline-flex;
  font-feature-settings: 'tnum'; /* 等宽数字，防止抖动 */
  font-variant-numeric: tabular-nums;
  overflow: hidden;
  line-height: 1;
}

.digit-slot {
  position: relative;
  display: inline-block;
  width: 0.6em; /* 根据字体调整宽度 */
  height: 1em;
  text-align: center;
}

.digit {
  display: inline-block;
  width: 100%;
  height: 100%;
  /* 确保新旧数字重叠 */
}

.digit.new {
  position: relative; /* 默认流 */
  z-index: 2;
}

.digit.old {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
}
</style>
