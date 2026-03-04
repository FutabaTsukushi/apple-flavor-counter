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

onMounted(() => {
  const str = props.modelValue.toString().split('')
  displayDigits.value = str.map(d => ({
    current: d,
    old: null,
    direction: null
  }))
})

const updateCounter = (newValue: number) => {
  const oldValue = lastStableValue

  let newStr = newValue.toString()
  let oldStr = oldValue.toString()
  const maxLength = Math.max(newStr.length, oldStr.length)

  newStr = newStr.padStart(maxLength, '0')
  oldStr = oldStr.padStart(maxLength, '0')

  const newArr = newStr.split('')
  const oldArr = oldStr.split('')

  const nextState: DigitState[] = newArr.map((digit, index) => {
    const oldDigit = oldArr[index]

    if (digit === oldDigit) {
      return { current: digit, old: null, direction: null }
    }

    const n = parseInt(digit)
    const o = parseInt(oldDigit)
    const direction = n < o ? 'from-bottom' : 'from-top'

    return {
      current: digit,
      old: oldDigit,
      direction: direction
    }
  })

  displayDigits.value = nextState
  lastStableValue = newValue

  nextTick(() => {
    if (!counterRef.value) return

    const slots = counterRef.value.querySelectorAll('.digit-slot')

    slots.forEach((slot, index) => {
      const state = displayDigits.value[index]
      if (!state || !state.old) return

      const oldEl = slot.querySelector('.old')
      const newEl = slot.querySelector('.new')

      if (oldEl && newEl) {
        const isFromBottom = state.direction === 'from-bottom'
        const yOffset = 100

        gsap.killTweensOf([oldEl, newEl])

        gsap.fromTo(
          oldEl,
          {
            yPercent: 0,
            opacity: 1,
            filter: 'blur(0px)'
          },
          {
            yPercent: isFromBottom ? -yOffset : yOffset,
            opacity: 0,
            filter: 'blur(10px)',
            duration: 0.5,
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
            duration: 0.5,
            ease: 'power2.out'
          }
        )
      }
    })
  })
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
