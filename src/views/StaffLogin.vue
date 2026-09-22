<template>
  <div class="page-layout">
    <NavBar />

    <main class="login-page">
      <section class="hero-banner">
        <img class="hero-image" :src="heroImage" alt="Background" />
        <div class="background-overlay">
          <div class="overlay">
            <h3 class="login-title">Staff Login</h3>
            <StaffLoginForm />
          </div>
        </div>
      </section>
    </main>

    <TheFooter />
  </div>
</template>

<script setup>
import NavBar from "@/components/TheNavBar.vue";
import heroImage from "@/assets/icons/hero-banner.jpg";
import TheFooter from "@/components/TheFooter.vue";
import StaffLoginForm from "@/components/staff-login/StaffLoginForm.vue";
</script>

<style scoped>
.page-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.login-page {
  flex: 1;
  min-height: 0;
  display: flex;
}

.hero-banner {
  position: relative;
  width: 100%;
  flex: 1;
  overflow: hidden;
}

.hero-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: blur(2px);
  transform: scale(1.03);
}

.background-overlay {
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

.overlay {
  width: 100%;
  max-width: 900px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.login-title {
  font-family: "Inter", sans-serif;
  margin: 0 0 clamp(16px, 2vw, 28px);
  text-align: center;
  font-size: clamp(18px, 3vw, 38px);
  font-weight: 700;
  color: #0a1f44;
}
</style>