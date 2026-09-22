<template>
  <nav class="nav-bar">
    <!-- Staff Info -->
    <div v-if="isStaff">Staff ID: {{ staffID }} | Branch: {{ branch }}</div>

    <!-- Logo -->
    <div class="nav-center" @click="handleLogoClick">
      <img class="nav-logo" :src="logo" alt="SmartQueue logo" />
    </div>

    <!-- Logout -->
    <div class="nav-right" v-if="isStaff">
      <button @click="logout">Log Out</button>
    </div>
  </nav>
</template>

<script setup>
import { computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useQueueStore } from "@/stores/QueueStores";
import logo from "@/assets/icons/smartqueue-logo.png";

const router = useRouter();
const route = useRoute();
const queueStore = useQueueStore();

const isStaff = computed(() => {
  return !!queueStore.staff && String(route.name || "").startsWith("staff");
});

const staffID = computed(() => queueStore.staff?.staffId || "");
const branch = computed(() => queueStore.staff?.branchName || "");

async function logout() {
  await queueStore.logout();
  router.replace({ name: "staff-login" });
}

function handleLogoClick() {
  if (isStaff.value) {
    if (route.name == "staff-setup") {
      router.push({ name: "staff-setup"})
      return;
    } else {
      router.push({ name: "staff-main" });
      return;
    }
  }

  const ticket = queueStore.activeTicket;

  if (ticket && ticket.status !== "served") {
    if (route.name !== "customer-main") {
      router.push({ name: "customer-main" });
    }
    return;
  }

  if (route.name !== "main") {
    router.push({ name: "main" });
  }
}
</script>

<style scoped>
.nav-bar {
  font-family: "Inter", sans-serif;
  height: 55px;
  background-color: #0a1f44;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  color: white;
}

.nav-center {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  cursor: pointer;
}

.nav-logo {
  height: 40px;
  width: auto;
  object-fit: contain;
}

.nav-right button {
  font-size: 16px;
  background: none;
  border: none;
  color: white;
  cursor: pointer;
}
</style>
