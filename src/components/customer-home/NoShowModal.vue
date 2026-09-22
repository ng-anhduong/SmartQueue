<template>
  <div v-if="store.showNoShowModal" class="modal-overlay">
    <div class="modal-card">
      <h2 class="modal-title">You missed your turn</h2>

      <p class="modal-text">
        Estimated waiting time:
        <strong>{{ store.formattedWait ?? "—" }}</strong>
        <br />
        Would you like to rejoin the queue?
      </p>

      <div class="modal-actions">
        <button class="cancel-button" @click="handleExit">
          Exit to Main Page
        </button>
        <button
          class="confirm-button"
          :disabled="rejoining"
          @click="handleRejoin"
        >
          {{ rejoining ? "Rejoining..." : "Rejoin Queue" }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useQueueStore } from "@/stores/QueueStores";

const store = useQueueStore();
const router = useRouter();
const rejoining = ref(false);

async function handleRejoin() {
  rejoining.value = true;
  try {
    await store.rejoinQueueAction();
  } finally {
    rejoining.value = false;
  }
}

function handleExit() {
  store.dismissNoShowModal();
  store.leaveQueueAction();
  router.push("/");
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.22);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  padding: 24px;
}

.modal-card {
  width: min(880px, 92vw);
  min-height: 320px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.18);
  padding: 56px 48px 42px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.modal-title {
  margin: 0;
  color: #0a1f44;
  font-family: "Inter", sans-serif;
  font-size: 2.2rem;
  font-weight: 800;
  text-align: center;
}

.modal-text {
  margin-top: 28px;
  margin-bottom: 54px;
  color: #3d3d3d;
  font-family: "Inter", sans-serif;
  font-size: 1.2rem;
  font-weight: 400;
  text-align: center;
  line-height: 1.7;
}

.modal-actions {
  display: flex;
  gap: 28px;
  align-items: center;
  justify-content: center;
}

.cancel-button {
  min-width: 180px;
  height: 42px;
  border: none;
  background: transparent;
  color: #8d8d8d;
  font-family: "Inter", sans-serif;
  font-size: 14px;
  font-weight: 400;
  cursor: pointer;
  transition:
    background 0.2s ease,
    transform 0.15s ease,
    opacity 0.2s ease;
}

.cancel-button:hover {
  opacity: 0.7;
}

.confirm-button {
  min-width: 180px;
  height: 42px;
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
  box-shadow: 0 8px 18px rgba(10, 31, 68, 0.16);
}

.confirm-button:hover:not(:disabled) {
  background: #163465;
  transform: translateY(-1px);
}

.confirm-button:active:not(:disabled) {
  transform: translateY(0);
}

.confirm-button:disabled {
  background: #9ca3af;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

@media (max-width: 640px) {
  .modal-card {
    min-height: auto;
    padding: 36px 24px 28px;
    border-radius: 18px;
  }

  .modal-title {
    font-size: 1.7rem;
  }

  .modal-text {
    font-size: 1rem;
    margin-top: 20px;
    margin-bottom: 32px;
  }

  .modal-actions {
    flex-direction: column;
    gap: 14px;
    width: 100%;
  }

  .cancel-button,
  .confirm-button {
    width: 100%;
  }
}
</style>
