<script setup lang="ts">
import { ref } from 'vue'

defineProps<{ msg?: string }>()

const count = ref(0)

const increment = () => {
  count.value++
}
</script>

<template>
  <div class="apple-counter">
    <h1>{{ msg || 'Apple Flavor Counter' }}</h1>
    <div class="card">
      <button type="button" @click="increment">count is {{ count }} 🍎</button>
      <p>
        Edit
        <code>components/AppleFlavorCounter.vue</code> to test HMR
      </p>
    </div>
  </div>
</template>

<style scoped lang="scss">
.apple-counter {
  text-align: center;
  padding: 2em;
  border: 2px solid #ff6b6b;
  border-radius: 12px;
  background-color: #fff0f0;

  h1 {
    color: #d63031;
  }
}

.card {
  padding: 1em;
}

button {
  background-color: #ff7675;
  color: white;
  border: none;
  padding: 0.8em 1.5em;
  font-size: 1.1em;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #d63031;
  }
}
</style>
