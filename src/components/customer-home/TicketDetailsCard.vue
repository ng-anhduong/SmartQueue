<template>
  <section class="ticket-section">
    <div class="ticket-row">
      <span class="label">Ticket Number</span>
      <span class="value">{{ store.activeTicket?.ticketNumber || "—" }}</span>
    </div>

    <div class="ticket-row">
      <span class="label">Branch</span>
      <span class="value">{{ store.selectedBranch?.name || "—" }}</span>
    </div>

    <div class="ticket-row">
      <span class="label">Queue</span>
      <span class="value">{{ serviceLabel }}</span>
    </div>

    <div class="ticket-row">
      <span class="label">People Ahead</span>
      <span class="value">{{ adjustedPeopleAhead }}</span>
    </div>
  </section>
</template>

<script setup>
import { computed } from "vue";
import { useQueueStore } from "@/stores/QueueStores";

const store = useQueueStore();

const serviceLabels = {
  General: "General Services",
  Account: "Account Services",
  Loan: "Loan Services",
};

const serviceLabel = computed(() => {
  return serviceLabels[store.activeTicket?.serviceType] || "—";
});

const adjustedPeopleAhead = computed(() => {
  if (!store.activeTicket) return "—";
  if (store.activeTicket.status !== "waiting") return 0;
  return store.peopleAhead ?? 0;
});
</script>

<style scoped>
.ticket-section {
  width: 100%;
  max-width: 500px;
  margin: 32px auto 0;
  display: flex;
  flex-direction: column;
  font-family: "Inter", sans-serif;
}

.ticket-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
}

.label {
  font-size: 15px;
  font-weight: 700;
  color: #0a1f44;
}

.value {
  font-size: 15px;
  font-weight: 400;
  color: #111827;
}
</style>
