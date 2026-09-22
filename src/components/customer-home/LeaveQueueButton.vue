<template>
  <div class="button-wrap">
    <button
      v-if="store.activeTicket?.status === 'waiting'"
      class="leave-button"
      @click="showLeaveModal = true"
    >
      Leave Queue
    </button>

    <button v-else class="return-button" @click="router.push('/')">
      Back to Home
    </button>
  </div>

  <!-- Leave Queue Modal -->
  <div v-if="showLeaveModal" class="modal-overlay" @click="closeModal">
    <div class="modal-card" @click.stop>
      <h2 class="modal-title">Leave Queue?</h2>
      <p class="modal-text">You’ll lose your position in the queue</p>

      <div class="modal-actions">
        <button class="cancel-button" @click="closeModal">Cancel</button>
        <button class="confirm-button" @click="confirmLeaveQueue">
          Confirm
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useQueueStore } from "@/stores/QueueStores";

const router = useRouter();
const store = useQueueStore();

const showLeaveModal = ref(false);

function closeModal() {
  showLeaveModal.value = false;
}

async function confirmLeaveQueue() {
  try {
    await store.leaveQueueAction();
    store.dismissNotification();
    showLeaveModal.value = false;
    router.push("/");
  } catch (error) {
    console.error("Failed to leave queue:", error);
  }
}
</script>

<style scoped>
.button-wrap {
  display: flex;
  justify-content: center;
  margin-top: 2px;
}

.leave-button,
.return-button {
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

.leave-button:hover,
.return-button:hover {
  background: #163465;
  transform: translateY(-1px);
}

.leave-button:active,
.return-button:active {
  transform: translateY(0);
}

/* Modal */
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
  font-weight: 600;
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

.confirm-button:hover {
  background: #163465;
  transform: translateY(-1px);
}

.confirm-button:active {
  transform: translateY(0);
}

@media (max-width: 640px) {
  .modal-card {
    min-height: auto;
    padding: 36px 24px 28px;
    border-radius: 8px;
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
