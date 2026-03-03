<template>
  <div class="apple-counter" :style="{ fontSize: size + 'px', color: color }">
    <!-- 遍历每一位 -->
    <div 
      v-for="(digitState, index) in displayDigits" 
      :key="index" 
      class="digit-slot"
    >
      <!-- 旧值 (Exiting) -->
      <span 
        v-if="digitState.old !== null"
        class="digit old"
        ref="oldRefs"
      >
        {{ digitState.old }}
      </span>

      <!-- 新值 (Entering) -->
      <span 
        class="digit new"
        ref="newRefs"
      >
        {{ digitState.current }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted } from 'vue';
import gsap from 'gsap';

// 定义 Props
const props = defineProps({
  modelValue: {
    type: Number,
    required: true,
  },
  debounce: {
    type: Number,
    default: 300,
  },
  // 为了方便演示，加点样式控制
  size: {
    type: Number,
    default: 48
  },
  color: {
    type: String,
    default: 'inherit'
  }
});

// 每一位的状态结构
interface DigitState {
  current: string; // 当前显示的值
  old: string | null; // 上一次的值 (动画用)
  direction: 'up' | 'down' | null; // 动画方向
}

const displayDigits = ref<DigitState[]>([]);
const oldRefs = ref<HTMLElement[]>([]);
const newRefs = ref<HTMLElement[]>([]);

let timeoutId: ReturnType<typeof setTimeout> | null = null;
// 记录上一次稳定显示的值（用于防抖后的比较）
let lastStableValue = props.modelValue;

// 初始化
onMounted(() => {
  const str = props.modelValue.toString().split('');
  displayDigits.value = str.map(d => ({ current: d, old: null, direction: null }));
});

// 核心更新逻辑
const updateCounter = (newValue: number) => {
  const oldValue = lastStableValue;
  
  // 1. 转字符串并补零对齐
  let newStr = newValue.toString();
  let oldStr = oldValue.toString();
  const maxLength = Math.max(newStr.length, oldStr.length);
  
  newStr = newStr.padStart(maxLength, '0');
  oldStr = oldStr.padStart(maxLength, '0');

  const newArr = newStr.split('');
  const oldArr = oldStr.split('');

  // 2. 构建新的状态数组
  // 我们需要对比每一位，决定动画方向
  const nextState: DigitState[] = newArr.map((digit, index) => {
    const oldDigit = oldArr[index];
    
    // 如果数字没变，不需要动画，保持原样
    if (digit === oldDigit) {
      return { current: digit, old: null, direction: null };
    }

    // 比较大小决定方向
    // 题目要求：新值 < 旧值 -> 从下方淡入 (方向 up? 或者是 translateY 从正值到0)
    // 题目描述： "若对应位新值小于旧值... 数字从下方模糊淡入... 覆盖旧值"
    // 这意味着新数字初始位置在 y > 0，向上移动到 y=0。我们记为 'from-bottom'
    // 反之 (新 > 旧) -> 从上方进入。初始位置 y < 0，向下移动到 y=0。我们记为 'from-top'
    
    const n = parseInt(digit);
    const o = parseInt(oldDigit);
    const direction = n < o ? 'from-bottom' : 'from-top';

    return {
      current: digit,
      old: oldDigit, // 保留旧值用于显示
      direction: direction as 'from-bottom' | 'from-top'
    };
  });

  displayDigits.value = nextState;
  lastStableValue = newValue; // 更新稳定值

  // 3. 等待 DOM 更新后执行 GSAP 动画
  nextTick(() => {
    // 找到所有需要动画的位（即 old 不为 null 的）
    // 注意：displayDigits 的 index 对应 DOM 中的 slot index
    // 但 ref 数组 (newRefs, oldRefs) 可能是乱序或者是过滤后的，需要小心处理
    // 在 Vue 3 中 v-for 的 ref 绑定如果是数组，顺序不一定保证，但通常是按挂载顺序。
    // 更稳妥的方式是直接查询 DOM 或者确保结构一致。
    // 这里我们简单处理：遍历 displayDigits，根据 index 找 DOM。
    // 实际上因为 v-if 存在，oldRefs 的数量可能少于 displayDigits。
    
    // 让我们用选择器或者确保 refs 的准确性。
    // 简单起见，我们在模板里不使用 v-if 来彻底移除 DOM，而是用 opacity 控制，
    // 或者在 update 时重置 refs。
    
    // 重新获取 DOM 元素以确保准确
    const slots = document.querySelectorAll('.apple-counter .digit-slot');
    
    slots.forEach((slot, index) => {
      const state = displayDigits.value[index];
      if (!state || !state.old) return; // 这一位没变

      const oldEl = slot.querySelector('.old');
      const newEl = slot.querySelector('.new');

      if (oldEl && newEl) {
        // 根据方向设定初始状态
        // from-bottom (新 < 旧): New 从下(100%)上来, Old 往上(-100%)走
        // from-top (新 > 旧): New 从上(-100%)下来, Old 往下(100%)走
        
        const isFromBottom = state.direction === 'from-bottom';
        const yOffset = 100; //百分比

        // Kill previous animations
        gsap.killTweensOf([oldEl, newEl]);

        // Old Value Animation (Exiting)
        gsap.fromTo(oldEl, 
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
        );

        // New Value Animation (Entering)
        gsap.fromTo(newEl,
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
            ease: 'power2.out',
            onComplete: () => {
                // 动画结束后，清理 old 状态，避免重影
                // 注意：这里修改响应式数据可能会触发重绘
                // 但为了下一次动画，我们需要重置状态
                // 实际上我们可以保留 old=null 的逻辑在下一次 update 之前
                // 或者在这里不做任何事，只在下一次 update 时覆盖
            }
          }
        );
      }
    });
  });
};

// 监听值变化
watch(
  () => props.modelValue,
  (newVal) => {
    // 如果设置了防抖
    if (timeoutId) clearTimeout(timeoutId);
    
    // 立即显示（如果不防抖）或延迟
    // 题目要求：不在防抖时间内更新。即：防抖期间不更新，防抖结束更新。
    // 这是标准的 debounce。
    
    // 特殊情况：如果 debounce 为空或0
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
.apple-counter {
  display: inline-flex;
  font-feature-settings: "tnum"; /* 等宽数字，防止抖动 */
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
