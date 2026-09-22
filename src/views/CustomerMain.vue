<template>
  <div class="page-layout">
    <TheNavBar />

    <main class="page-main">
      <CustomerQueuePanel />
    </main>

  </div>
</template>

<script setup>
import TheNavBar from "@/components/TheNavBar.vue";
import CustomerQueuePanel from "@/components/customer-home/CustomerQueuePanel.vue";
</script>
