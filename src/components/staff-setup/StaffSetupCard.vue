<template>
  <div class="form-card">
    <form @submit.prevent="handleSetup">
      <div class="form-group">
        <label for="queueSelect">Select Queue</label>
        <select v-model="selectedQueue" :disabled="services.length === 0">
          <option disabled value="">Select Queue</option>
          <option v-for="service in services" :key="service" :value="service">
            {{ service }} Services
          </option>
        </select>
      </div>

      <div class="form-group">
        <label for="counterSelect">Select Counter</label>
        <select v-model="selectedCounter" :disabled="counters.length === 0">
          <option disabled value="">Select Counter</option>
          <option v-for="num in counters" :key="num" :value="num">
            Counter {{ num }}
          </option>
        </select>
      </div>

      <button
        class="confirm-button"
        type="submit"
        :disabled="!selectedQueue || !selectedCounter"
      >
        Confirm
      </button>
      <div class="feedback-slot"></div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useQueueStore } from "@/stores/QueueStores";
import { useRouter } from "vue-router";

const queueStore = useQueueStore();
const router = useRouter();

const selectedQueue = ref("");
const selectedCounter = ref("");

const services = computed(() =>
  queueStore.selectedBranch?.counters
    ? Object.keys(queueStore.selectedBranch.counters)
    : [],
);

const counters = computed(() => {
  if (!selectedQueue.value) return [];
  const count = queueStore.selectedBranch?.counters?.[selectedQueue.value] || 0;
  return Array.from({ length: count }, (_, i) => i + 1);
});

async function handleSetup() {
  if (!selectedQueue.value || !selectedCounter.value) return;
  await queueStore.confirmSetup(selectedQueue.value, selectedCounter.value);
  router.push({ name: "staff-main" });
}

onMounted(async () => {
  await queueStore.loadBranches();
  if (queueStore.staff?.branchId) {
    await queueStore.selectBranchAndService(queueStore.staff.branchId, null);
  }
});
</script>

<style scoped>
.form-card {
  width: 100%;
  max-width: 420px;
  min-height: 251px;
  background: #ffffff;
  border-radius: 8px;
  padding: 32px 28px;
  box-sizing: border-box;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.18);
}

.form-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 16px;
}

.form-group label {
  font-family: "Inter", sans-serif;
  margin-bottom: 6px;
  font-size: 16px;
  color: #333333;
}

.form-group select {
  font-family: "Inter", sans-serif;
  height: 40px;
  padding: 0 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
}

.confirm-button {
  width: 100%;
  height: 42px;
  border: none;
  border-radius: 4px;
  background: #2f2f2f;
  font-family: "Inter", sans-serif;
  color: white;
  font-size: 14px;
  cursor: pointer;
  margin-top: 12px;
  transition:
    background 0.2s ease,
    transform 0.15s ease,
    opacity 0.2s ease;
}

.confirm-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.feedback-slot {
  margin-top: 8px;
  margin-bottom: -3px;
}
</style>
