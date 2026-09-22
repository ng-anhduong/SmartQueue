<template>
  <transition name="fade">
    <div v-if="store.showNotification" class="notification-banner">
      <span>{{ store.notification || "Successfully joined the queue" }}</span>
    </div>
  </transition>
</template>

<script setup>
import { watch, onUnmounted } from "vue";
import { useQueueStore } from "@/stores/QueueStores";

const store = useQueueStore();

let timer = null;

watch(
  () => store.showNotification,
  (visible) => {
    if (visible) {
      timer = setTimeout(() => store.dismissNotification(), 5000);
    } else {
      clearTimeout(timer);
    }
  },
  { immediate: true },
);

onUnmounted(() => clearTimeout(timer));
</script>

<style scoped>
.notification-banner {
  background: #e8f7ea;
  color: #205c2d;
  text-align: center;
  padding: 12px 16px;
  font-weight: 500;
  border-radius: 0;
  position: relative;
  font-family: "Inter", sans-serif;
  box-shadow: 0 6px 14px rgba(32, 92, 45, 0.08);
}
</style>
