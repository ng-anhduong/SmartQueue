<template>
  <div>
    <NavBar />
    <main class="main-page">
      <HeroBanner :autofillBranchId="branchId" :autofillService="service" />
      <BranchSearch @locationConfirmed="onLocationConfirmed" />
      <RecommenderSection
        :usingLabel="usingLabel"
        :userLat="userLat"
        :userLng="userLng"
        :selectedService="selectedService"
        @useBranch="onUseBranch"
      />
    </main>
    <TheFooter />
  </div>
</template>

<script>
export default {
  name: "MainPage",
};
</script>

<script setup>
import { ref } from "vue";
import NavBar from "@/components/TheNavBar.vue";
import HeroBanner from "@/components/main-page/HeroBanner.vue";
import BranchSearch from "@/components/main-page/BranchSearch.vue";
import RecommenderSection from "@/components/main-page/RecommenderSection.vue";
import TheFooter from "@/components/TheFooter.vue";

const usingLabel = ref("");
const userLat = ref(null);
const userLng = ref(null);
const selectedService = ref("");
const branchId = ref("");
const service = ref("");

function onLocationConfirmed(payload) {
  usingLabel.value = payload.usingLabel;
  userLat.value = payload.lat;
  userLng.value = payload.lng;
  selectedService.value = payload.selectedService;
}

function onUseBranch(payload) {
  branchId.value = payload.branchId;
  service.value = payload.service;
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}
</script>

<style scoped>
.main-page {
  width: 100%;
}
</style>
