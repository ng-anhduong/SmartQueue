<template>
  <section class="hero-banner">
    <img class="hero-image" :src="heroImage" alt="Hero banner" />
    <div class="hero-overlay">
      <h1 class="hero-title">SmartQueue</h1>
      <p class="hero-subtitle">Already know where to go? Join now!</p>
      <QuickJoinCard
        :autofillBranchId="autofillBranchId"
        :autofillService="autofillService"
      />
    </div>
  </section>
</template>

<script setup>
import heroImage from "@/assets/icons/hero-banner.jpg";
import QuickJoinCard from "@/components/main-page/QuickJoinCard.vue";

defineProps({
  autofillBranchId: String,
  autofillService: String,
});
</script>

<style scoped>
.hero-banner {
  position: relative;
  height: 450px;
  overflow: hidden;
  margin-bottom: 45px;
}

.hero-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 10% 10%;
  display: block;
}

.hero-overlay {
  position: absolute;
  top: 53%;
  transform: translateY(-50%);
  left: clamp(
    24px,
    9vw,
    375px
  ); /* scales from 24px on mobile up to 375px on large screens */
  width: min(500px, 90vw); /* never wider than the viewport */
}

.hero-overlay p {
  margin-bottom: 30px;
}

.hero-title {
  margin: 0 0 12px;
  font-family: "Inter", sans-serif;
  font-size: clamp(32px, 4vw, 58px);
  font-weight: 700;
  line-height: 1.1;
  color: #0a1f44;
}

.hero-subtitle {
  margin: 0 0 24px;
  font-family: "Inter", sans-serif;
  font-size: clamp(16px, 2vw, 22px);
  font-weight: 700;
  line-height: 1.4;
  color: #1f2937;
}
</style>
