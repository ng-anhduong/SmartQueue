<template>
  <div class="form-card">
    <form @submit.prevent="handleLogin" novalidate>
      <div class="form-group">
        <label for="staffID">Staff Email</label>
        <input
          id="staffID"
          type="text"
          v-model="staffID"
          placeholder="Enter Staff Email here"
        />
      </div>

      <div class="form-group">
        <label for="staffPW">Password</label>
        <div class="password-wrapper">
          <input
            id="staffPW"
            :type="showPassword ? 'text' : 'password'"
            v-model="staffPW"
            placeholder="Enter Staff Password here"
          />
          <button
            type="button"
            class="toggle-btn"
            @click="showPassword = !showPassword"
          >
            <Eye v-if="!showPassword" :size="18" />
            <EyeOff v-else :size="18" />
          </button>
        </div>
      </div>

      <button
        class="join-button"
        type="submit"
        :disabled="!staffID.trim() || !staffPW.trim() || loading"
      >
        {{ loading ? "Signing in..." : "Sign In" }}
      </button>

      <div class="feedback-slot">
        <p v-if="errorMsg" class="feedback-text location-error">
          {{ errorMsg }}
        </p>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useQueueStore } from "@/stores/QueueStores";
import { useRouter } from "vue-router";
import { Eye, EyeOff } from "lucide-vue-next";

const queueStore = useQueueStore();
const router = useRouter();

const staffID = ref("");
const staffPW = ref("");
const showPassword = ref(false)
const loading = ref(false);
const errorMsg = ref("");

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getFriendlyErrorMessage(err) {
  const code = err?.code || "";

  switch (code) {
    case "auth/invalid-email":
      return "Please enter a valid staff email";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Incorrect email or password";
    case "auth/too-many-requests":
      return "Too many attempts. Please try again later";
    case "auth/network-request-failed":
      return "Network error. Please check your internet connection";
    default:
      return "Unable to sign in. Please try again";
  }
}

async function handleLogin() {
  if (!staffID.value.trim() || !staffPW.value.trim()) {
    errorMsg.value = "Please enter both email and password";
    return;
  }

  if (!isValidEmail(staffID.value.trim())) {
    errorMsg.value = "Please enter a valid staff email";
    return;
  }

  loading.value = true;
  errorMsg.value = "";

  try {
    await queueStore.login(staffID.value.trim(), staffPW.value.trim());
    router.push({ name: "staff-setup" });
  } catch (err) {
    console.error(err);
    errorMsg.value = getFriendlyErrorMessage(err);
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.form-card {
  width: 100%;
  max-width: 420px;
  background: #ffffff;
  border-radius: 8px;
  padding: 32px 28px;
  box-sizing: border-box;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.18);
}

.form-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 16px;
}

.form-group label {
  font-family: "Inter", sans-serif;
  margin-bottom: 6px;
  font-size: 16px;
  color: #333333;
}

.form-group input {
  font-family: "Inter", sans-serif;
  height: 40px;
  padding: 0 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
}

.password-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.password-wrapper input {
  width: 100%;
  padding-right: 40px;
}

.toggle-btn {
  position: absolute;
  right: 10px;
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #555;
}

.join-button {
  width: 100%;
  height: 42px;
  border: none;
  border-radius: 4px;
  background: #2f2f2f;
  font-family: "Inter", sans-serif;
  color: white;
  font-size: 14px;
  cursor: pointer;
  margin-top: 12px;
  transition:
    background 0.2s ease,
    transform 0.15s ease,
    opacity 0.2s ease;
}

.join-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.feedback-slot {
  margin-top: 8px;
  margin-bottom: -3px;
  overflow: visible;
}

.feedback-text {
  margin: 0;
  font-size: 14px;
  line-height: 1;
  font-family: "Inter", sans-serif;
  text-align: center;
}

.location-error {
  color: #dc2626;
}
</style>
