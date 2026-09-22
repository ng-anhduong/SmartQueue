<template>
  <div class="serve-section">
    <div class="curr-serve-banner">
      <h2 id="curr-serving">Currently Serving</h2>
      <p id="serve-ticket">{{ ticketNumber }}</p>
    </div>

    <div class="serve-status">
      <button class="serve-buttons" @click="handleMarkServed">
        Mark Served
      </button>
      <button class="serve-buttons" @click="handleMarkNoShow">No Show</button>
    </div>

    <button id="call-next" :disabled="!canCallNext" @click="handleCallNext">
      Call Next
    </button>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useQueueStore } from "@/stores/QueueStores";

const queueStore = useQueueStore();

const currentlyServing = computed(() => queueStore.currentlyServing);

const ticketNumber = computed(() => {
  return currentlyServing.value?.ticketNumber || "—";
});

const canCallNext = computed(() => {
  return !currentlyServing.value;
});

async function handleCallNext() {
  await queueStore.callNextAction();
}

async function handleMarkServed() {
  await queueStore.markServedAction();
}

async function handleMarkNoShow() {
  await queueStore.markNoShowAction();
}
</script>

<style scoped>
.serve-section {
  font-family: "Inter", sans-serif;
  height: 600px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.01);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 25px;
}

.curr-serve-banner {
  height: 350px;
  width: 600px;
  border: 1px solid #e5e7eb;
  margin-bottom: 25px;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.08);
  text-align: center;
}

#curr-serving {
  font-size: 45px;
  color: #0a1f44;
}

#serve-ticket {
  font-size: 60px;
  margin-top: 85px;
}

.serve-status {
  display: flex;
  justify-content: center;
  width: 700px;
  gap: 50px;
}

.serve-buttons {
  height: 40px;
  width: 275px;
  font-size: 17px;
  font-weight: 400;
  border: none;
  border-radius: 4px;
  background-color: #d9d9d9;
  cursor: pointer;
  transition:
    background 0.2s ease,
    transform 0.15s ease,
    opacity 0.2s ease;
}

#call-next {
  height: 40px;
  width: 600px;
  font-size: 17px;
  font-weight: 400;
  border: none;
  border-radius: 4px;
  background-color: #0a1f44;
  color: white;
  cursor: pointer;
  transition:
    background 0.2s ease,
    transform 0.15s ease,
    opacity 0.2s ease;
}

#call-next:hover:not(:disabled) {
  background-color: #102a5c;
}

#call-next:active:not(:disabled) {
  transform: translateY(1px);
}

#call-next:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
  opacity: 0.5;
}

.serve-buttons:hover {
  background-color: #c9c9c9;
}

.serve-buttons:active {
  transform: translateY(1px);
}
</style>
