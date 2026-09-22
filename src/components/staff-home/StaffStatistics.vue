<template>
  <div class="stats-section">
    <div class="stats-card">
      <h4 class="stats-headers">People in Queue</h4>
      <p class="stats">{{ peopleInQueue }}</p>
    </div>

    <div class="stats-card">
      <h4 class="stats-headers">
        Average Wait Time for {{ serviceType }} Services
      </h4>
      <p class="stats">{{ formatDuration(avgWaitTime) }}</p>
    </div>

    <div class="stats-card">
      <h4 class="stats-headers">Next Ticket</h4>
      <p class="stats">{{ nextTicket }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useQueueStore } from "@/stores/QueueStores";
import { formatDuration } from "@/utils/formatDuration";

const queueStore = useQueueStore();

const peopleInQueue = computed(() => queueStore.peopleInQueue);
const serviceType = computed(() => queueStore.staff?.activeService || null);
const avgWaitTime = computed(() => queueStore.avgWaitTimeToday ?? 10);
const nextTicket = computed(() => queueStore.nextTicket ?? "—");
</script>

<style scoped>
.stats-section {
  font-family: "Inter", sans-serif;
  height: 200px;
  width: 100%;
  border: 1px solid #e5e7eb;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.01);
  display: flex;
  align-items: center;
  justify-content: center;
}

.stats-card {
  flex: 1;
  padding: 25px;
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.stats-card:not(:last-child) {
  border-right: 1px solid #e5e7eb;
}

.stats-headers {
  font-size: 27px;
  color: #0a1f44;
  margin: 0;
  height: 70px;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  text-align: center;
}

.stats {
  font-size: 28px;
  margin: 0;
  height: 60px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}
</style>
