<template>
  <section class="queue-panel">
    <div class="hero-wrapper">
      <LiveQueueStatusCard />
      <div class="banner-slot">
        <QueueJoinSuccessBanner />
        <ServingNotificationBanner />
      </div>
    </div>
    <div class="queue-bottom">
      <TicketDetailsCard />
      <LeaveQueueButton />
    </div>
    <NoShowModal />
  </section>
</template>

<script setup>
import QueueJoinSuccessBanner from "@/components/customer-home/QueueJoinSuccessBanner.vue";
import ServingNotificationBanner from "@/components/customer-home/ServingNotificationBanner.vue";
import LiveQueueStatusCard from "@/components/customer-home/LiveQueueStatusCard.vue";
import TicketDetailsCard from "@/components/customer-home/TicketDetailsCard.vue";
import LeaveQueueButton from "@/components/customer-home/LeaveQueueButton.vue";
import NoShowModal from "@/components/customer-home/NoShowModal.vue";

</script>

<style scoped>
.queue-panel {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0px;
}

.hero-wrapper {
  position: relative;
}

.banner-slot {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
}

.queue-bottom {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  margin-top: 20px;
}
</style>