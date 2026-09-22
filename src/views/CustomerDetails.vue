<template>
  <div class="page-layout">
    <NavBar />

    <main class="page-main">
      <CustomerDetailsHero />
    </main>

    <TheFooter />
  </div>
</template>

<script setup>
import NavBar from "@/components/TheNavBar.vue";
import CustomerDetailsHero from "@/components/customer-details/CustomerDetailsHero.vue";
import TheFooter from "@/components/TheFooter.vue";
</script>

<style scoped>
.page-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.page-main {
  flex: 1;
  min-height: 0;
  display: flex;
}
</style>
