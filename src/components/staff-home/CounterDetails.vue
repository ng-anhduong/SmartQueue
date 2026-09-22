<template>
  <div class="counter-section">
    <p id="counter-details">
      Counter {{ activeCounter }} • {{ activeService }} Service
    </p>
    <router-link id="change-router" :to="{ name: 'staff-setup' }"
      >• Change</router-link
    >
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useQueueStore } from "@/stores/QueueStores";

const queueStore = useQueueStore();

const activeService = computed(() => queueStore.staff?.activeService || null);
const activeCounter = computed(() => queueStore.staff?.activeCounter || null);
</script>

<style scoped>
.counter-section {
  font-family: "Inter", sans-serif;
  height: 10%;
  border: 1px solid #e5e7eb;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.01);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

#counter-details {
  font-size: 16px;
  text-align: center;
}

#change-router {
  font-size: 14px;
  color: #3a6eca;
  text-decoration: none;
}
</style>
