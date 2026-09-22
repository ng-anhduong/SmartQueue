<template>
  <section class="hero-section">
    <img
      class="hero-background"
      :src="queueBackground"
      alt="Queue status banner"
    />

    <div class="overlay">
      <div class="overlay-content">
        <div class="status-container">
          <div class="status-card">
            <h2>Estimated Waiting Time</h2>
            <p class="status-value">{{ formattedWait }}</p>
          </div>

          <div class="status-card">
            <h2>Now Serving</h2>
            <p class="status-value">{{ nowServing }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from "vue";
import { useQueueStore } from "@/stores/QueueStores";
import queueBackground from "@/assets/icons/queue-bg.jpeg";

const store = useQueueStore();

const formattedWait = computed(() => store.formattedWait || "Calculating...");
const nowServing = computed(() => store.latestCalledTicket || "—");
</script>

<style scoped>
.hero-section {
  position: relative;
  width: 100%;
  min-height: 340px;
  overflow: hidden;
}

.hero-background {
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
  min-height: 340px;
  background: rgba(255, 255, 255, 0.58);
  backdrop-filter: blur(3px);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 36px 20px 42px;
  box-sizing: border-box;
}

.overlay-content {
  width: 100%;
  max-width: 900px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.status-container {
  width: 100%;
  max-width: 500px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.status-card {
  width: 100%;
  background: rgba(255, 255, 255, 0.96);
  border-radius: 8px;
  padding: 22px 20px;
  box-sizing: border-box;
  box-shadow: 0 10px 28px rgba(10, 31, 68, 0.12);
  text-align: center;
  border: 1px solid rgba(10, 31, 68, 0.06);
}

.status-card h2 {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
  color: #0a1f44;
  font-family: "Inter", sans-serif;
  line-height: 1.3;
}

.status-value {
  margin: 10px 0 0;
  font-size: 28px;
  font-weight: 700;
  color: #111827;
  font-family: "Inter", sans-serif;
  line-height: 1.2;
  letter-spacing: -0.02em;
}

@media (max-width: 640px) {
  .hero-section,
  .overlay {
    min-height: 300px;
  }

  .hero-title {
    font-size: 30px;
    margin-bottom: 18px;
  }

  .status-value {
    font-size: 24px;
  }
}
</style>
