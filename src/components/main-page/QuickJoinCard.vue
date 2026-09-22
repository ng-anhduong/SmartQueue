<template>
  <div class="quick-join-card">
    <div class="form-group">
      <label for="branch">Branch Outlet:</label>
      <select id="branch" v-model="selectedBranch">
        <option disabled value="">Select a branch</option>
        <option
          v-for="branch in store.branches"
          :key="branch.id"
          :value="branch.id"
        >
          {{ branch.name }}
        </option>
      </select>
    </div>

    <div class="form-group">
      <label for="service">Service Type:</label>
      <select id="service" v-model="selectedService">
        <option disabled value="">Select a service</option>
        <option
          v-for="service in services"
          :key="service.value"
          :value="service.value"
        >
          {{ service.label }}
        </option>
      </select>
    </div>

    <div class="queue-info">
      <!-- Neither selected -->
      <template v-if="!selectedBranch && !selectedService">
        <p class="queue-hint">
          Select a branch and service type to view queue stats
        </p>
      </template>

      <!-- Only branch selected -->
      <template v-else-if="selectedBranch && !selectedService">
        <p class="queue-hint">Please also select a service type</p>
      </template>

      <!-- Only service selected -->
      <template v-else-if="!selectedBranch && selectedService">
        <p class="queue-hint">Please also select a branch</p>
      </template>

      <!-- Both selected -->
      <template v-else>
        <p class="queue-title">
          {{ store.branches.find((b) => b.id === selectedBranch)?.name }} -
          {{ services.find((s) => s.value === selectedService)?.label }}
        </p>
        <template v-if="store.previewLoading">
          <p>Loading...</p>
        </template>
        <template v-else>
          <p>People Ahead: {{ store.queuePreview?.peopleAhead ?? 0 }}</p>
          <p>
            Estimated Wait:
            {{ formatDuration(store.queuePreview?.estimatedWait) }}
          </p>
        </template>
      </template>
    </div>

    <div class="button-wrap">
      <button
        type="button"
        :disabled="!selectedBranch || !selectedService"
        :class="{ disabled: !selectedBranch || !selectedService }"
        @click="handleJoinClick"
      >
        Join Queue
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from "vue";
import { useQueueStore } from "@/stores/QueueStores";
import { formatDuration } from "@/utils/formatDuration";
import { useRouter } from "vue-router";

const props = defineProps({
  autofillBranchId: String,
  autofillService: String,
});

const store = useQueueStore();
const router = useRouter();

const services = [
  { value: "General", label: "General Services" },
  { value: "Account", label: "Account Services" },
  { value: "Loan", label: "Loan Services" },
];

const selectedBranch = ref("");
const selectedService = ref("");

watch(
  () => [props.autofillBranchId, props.autofillService],
  ([branchId, service]) => {
    if (branchId) {
      selectedBranch.value = branchId;
    }
    if (service) {
      selectedService.value = service;
    }
  },
  { immediate: true },
);

onMounted(async () => {
  await store.loadBranches();
});

let unsubscribe = null;

watch([selectedBranch, selectedService], ([branch, service]) => {
  // Clean up previous listener
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
  if (branch && service) {
    unsubscribe = store.listenToBranchAndService(branch, service);
  }
});

onUnmounted(() => {
  if (unsubscribe) unsubscribe();
});

async function handleJoinClick() {
  if (!selectedBranch.value || !selectedService.value) return;

  await store.selectBranchAndService(
    selectedBranch.value,
    selectedService.value,
  );

  router.push("/customer-details");
}
</script>

<style scoped>
.quick-join-card {
  width: 100%;
  max-width: 400px;
  background: rgba(255, 255, 255, 0.8);
  padding: 20px 18px 22px;
  border-radius: 8px;
  box-sizing: border-box;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.form-group {
  margin-bottom: 12px;
}

label {
  display: block;
  margin-bottom: 6px;
  font-family: "Inter", sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: #111827;
}

select {
  width: 100%;
  height: 28px;
  padding: 0 10px;
  border: 1px solid #d9d9d9;
  background: #ffffff;
  color: #111827;
  font-family: "Inter", sans-serif;
  font-size: 14px;
  border-radius: 4px;
  box-sizing: border-box;
  outline: none;
}

.queue-info {
  min-height: 53px;
  margin-top: 8px;
  font-family: "Inter", sans-serif;
  color: #111827;
  font-size: 12px;
  line-height: 1.35;
}

.queue-title {
  margin: 0 0 10px;
}

.queue-info p {
  margin: 0;
}

.queue-info p + p {
  margin-top: 2px;
}

.button-wrap {
  display: flex;
  justify-content: center;
  margin-top: 14px;
}

button {
  min-width: 110px;
  height: 27px;
  border: none;
  border-radius: 4px;
  background: #0a1f44;
  color: #ffffff;
  font-family: "Inter", sans-serif;
  font-size: 14px;
  font-weight: 400;
  cursor: pointer;
  transition:
    background 0.2s ease,
    transform 0.15s ease,
    opacity 0.2s ease;
}

.queue-hint {
  color: #6b7280;
  margin: 0;
}

button:hover:not(.disabled) {
  background: #102a5c;
}

button:active:not(.disabled) {
  transform: translateY(1px);
}

button.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
