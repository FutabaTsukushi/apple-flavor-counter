<script setup lang="ts">
import { ref } from 'vue';
import AppleFlavorCounter from './AppleFlavorCounter.vue';

const count = ref(2023);
const debounceVal = ref(300);

const add = () => count.value += 10;
const sub = () => count.value -= 10;
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

      <div class="buttons">
        <button @click="sub">-10</button>
        <button @click="add">+10</button>
      </div>
    </div>

    <div class="preview-area">
      <p>Preview:</p>
      <!-- 使用我们刚写的组件 -->
      <AppleFlavorCounter 
        :model-value="count" 
        :debounce="debounceVal"
        :size="60"
        color="#333"
      />
    </div>

    <p class="desc">
      Try changing the number. If New < Old, it enters from bottom. If New > Old, from top.<br>
      Leading zeros are automatically padded to match the length of the longer number.
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
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
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
