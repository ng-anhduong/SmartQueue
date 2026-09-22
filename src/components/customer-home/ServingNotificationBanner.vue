<template>
  <transition name="fade">
    <div v-if="store.showServingNotification" class="notification-banner">
      <span>
        You have been called! Please proceed to
        <strong>Counter {{ store.activeTicket?.counter ?? "—" }}</strong>
        for your {{ serviceLabel }} Service
      </span>
      <button class="banner-close" @click="store.dismissServingNotification()">
        ×
      </button>
    </div>
  </transition>
</template>

<script setup>
import { computed } from "vue";
import { useQueueStore } from "@/stores/QueueStores";

const store = useQueueStore();

const serviceLabels = {
  General: "General",
  Account: "Account",
  Loan: "Loan",
};

const serviceLabel = computed(
  () => serviceLabels[store.activeTicket?.serviceType] ?? "",
);
</script>

<style scoped>
.notification-banner {
  background: #e8f7ea;
  color: #205c2d;
  text-align: center;
  padding: 12px 44px 12px 16px;
  font-weight: 500;
  position: relative;
  font-family: "Inter", sans-serif;
  box-shadow: 0 6px 14px rgba(32, 92, 45, 0.08);
}

.banner-close {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  border: none;
  background: transparent;
  font-size: 18px;
  cursor: pointer;
  color: #205c2d;
}
</style>
