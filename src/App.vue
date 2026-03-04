<script setup lang="ts">
import { ref } from 'vue'
import AppleFlavorCounter from './AppleFlavorCounter.vue'

const count = ref(2023)
const debounceVal = ref(300)
const stepDurationVal = ref(80)
const sizeVal = ref(60)

const add = () => (count.value += 10)
const sub = () => (count.value -= 10)
</script>

<template>
  <div class="container">
    <h1>Apple Flavor Counter Demo</h1>

    <div class="controls">
      <label>
        数值 (Value):
        <input type="number" v-model.number="count" />
      </label>

      <label>
        防抖 (Debounce ms):
        <input type="number" v-model.number="debounceVal" />
      </label>

      <label>
        每步时长 (Step Duration ms):
        <input type="number" v-model.number="stepDurationVal" />
      </label>

      <label>
        字体大小 (Size px):
        <input type="number" v-model.number="sizeVal" />
      </label>

      <div class="buttons">
        <button @click="sub">-10</button>
        <button @click="add">+10</button>
      </div>
    </div>

    <div class="preview-area">
      <p>Preview:</p>
      <AppleFlavorCounter
        :model-value="count"
        :debounce="debounceVal"
        :step-duration="stepDurationVal"
        :size="sizeVal"
        color="#333"
      />
    </div>

    <p class="desc">
      Combination lock-style animation: calculates shortest path for each
      digit.<br />
      Example: 2→8 goes 2→1→0→9→8 (4 steps down) instead of 6 steps up.
    </p>
  </div>
</template>

<style>
body {
  font-family: sans-serif;
  background: #f5f5f7;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  margin: 0;
}

.container {
  background: white;
  padding: 2rem;
  border-radius: 1rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  text-align: center;
  width: 400px;
}

.controls {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
  text-align: left;
}

.controls label {
  display: flex;
  justify-content: space-between;
}

.buttons {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.preview-area {
  padding: 2rem;
  background: #fafafa;
  border-radius: 8px;
  border: 1px solid #eee;
  margin-bottom: 1rem;
}
</style>
