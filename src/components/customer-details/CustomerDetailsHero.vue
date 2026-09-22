<template>
    <section class="hero-section">
        <img class="customer-details-background" :src="heroImage" alt="Hero banner" />
        <div class="overlay">
            <div class="overlay-content">
                <h1 class="hero-title">Enter Your Details to Join The Queue</h1>
                <CustomerDetailsForm />
            </div>
        </div>
    </section>
</template>

<script setup>
import CustomerDetailsForm from "@/components/customer-details/CustomerDetailsForm.vue";
import heroImage from "@/assets/icons/hero-banner.jpg";
</script>

<style scoped>
.hero-section {
  position: relative;
  width: 100%;
  flex: 1;
  overflow: hidden;
}

.customer-details-background {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: blur(2px);
  transform: scale(1.03);
}

.overlay {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.45);
  backdrop-filter: blur(2px);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px 20px;
  box-sizing: border-box;
}

.overlay-content {
  width: 100%;
  max-width: 900px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.hero-title {
  font-family: "Inter", sans-serif;
  margin: 0 0 clamp(16px, 2vw, 28px);
  text-align: center;
  font-size: clamp(18px, 3vw, 38px);
  font-weight: 700;
  color: #0a1f44;
}
</style>