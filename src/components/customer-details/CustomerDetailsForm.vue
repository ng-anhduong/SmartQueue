<template>
  <div class="form-card">
    <button
      class="google-btn"
      type="button"
      :disabled="loading"
      @click="handleGoogleFlow"
    >
      <span class="google-icon" v-html="googleSvg"></span>
      <span>Continue with Google</span>
    </button>

    <div class="divider">
      <span>or</span>
    </div>

    <form class="form" @submit.prevent="handleMagicLink" novalidate>
      <label class="field">
        <span>Email address</span>
        <input v-model="customerEmail" type="text" placeholder="Your email" />
      </label>

      <label class="field">
        <span>First name</span>
        <input
          v-model="customerName"
          type="text"
          placeholder="Your first name"
        />
      </label>

      <button
        class="primary-btn"
        type="submit"
        :disabled="loading || !customerEmail.trim() || !customerName.trim()"
      >
        {{ loading ? "Sending link..." : "Join Queue" }}
      </button>
    </form>

    <div class="feedback-slot">
      <p v-if="successMsg" class="feedback-text success-text">
        {{ successMsg }}
      </p>
      <p v-if="errorMsg" class="feedback-text error-text">{{ errorMsg }}</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useQueueStore } from "@/stores/QueueStores.js";
import {
  signInWithGoogleCustomer,
  sendMagicLink,
  completeMagicLink,
} from "@/services/CustomerAuthService.js";

const router = useRouter();
const store = useQueueStore();

const customerName = ref("");
const customerEmail = ref("");

const loading = ref(false);
const errorMsg = ref("");
const successMsg = ref("");

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function hasQueueSelection() {
  return !!store.selectedBranch?.id && !!store.selectedService;
}

async function handleGoogleFlow() {
  loading.value = true;
  errorMsg.value = "";
  successMsg.value = "";

  try {
    const { user, profile } = await signInWithGoogleCustomer(
      customerName.value.trim(),
    );

    if (!hasQueueSelection()) {
      errorMsg.value =
        "Please select a branch and service before joining the queue";
      return;
    }

    await store.joinQueueAction(
      customerName.value.trim() || profile.name,
      user.email,
      user.uid,
      "google",
    );

    router.push("/customer-main");
  } catch (error) {
    console.error(error);

    if (
      error?.message?.includes(
        "Please select a branch and service before joining the queue",
      )
    ) {
      errorMsg.value =
        "Please select a branch and service before joining the queue";
    } else {
      errorMsg.value = "Google sign-in failed. Please try again";
    }
  } finally {
    loading.value = false;
  }
}

async function handleMagicLink() {
  const email = customerEmail.value.trim();
  const name = customerName.value.trim();

  if (!email || !name) {
    errorMsg.value = "Please enter both email and first name";
    successMsg.value = "";
    return;
  }

  if (!isValidEmail(email)) {
    errorMsg.value = "Please enter a valid email address";
    successMsg.value = "";
    return;
  }

  if (!hasQueueSelection()) {
    errorMsg.value =
      "Please select a branch and service before joining the queue";
    successMsg.value = "";
    return;
  }

  loading.value = true;
  errorMsg.value = "";
  successMsg.value = "";

  try {
    await sendMagicLink(
      email,
      name,
      store.selectedBranch.id,
      store.selectedService
    );
    successMsg.value =
      "Magic link sent. Check your email to finish joining the queue";
  } catch (error) {
    console.error(error);
    const code = error?.code || "";

    switch (code) {
      case "auth/invalid-email":
        errorMsg.value = "Please enter a valid email address";
        break;
      case "auth/missing-continue-uri":
        errorMsg.value = "App is missing the return URL. Contact support";
        break;
      case "auth/invalid-continue-uri":
      case "auth/unauthorized-continue-uri":
        errorMsg.value =
          "This domain is not authorized for magic links. Please add your site domain in Firebase Auth → Authorized domains";
        break;
      default:
        errorMsg.value = "Could not send the sign-in link. Please try again";
    }
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  try {
    const params = new URL(window.location.href).searchParams;
    const emailFromUrl = params.get("email") || "";
    const branchFromUrl = params.get("branchId") || "";
    const serviceFromUrl = params.get("serviceType") || "";

    const { user, profile, branchId, serviceType } =
      (await completeMagicLink(window.location.href, emailFromUrl)) || {};
    if (!user) return;

    // restore selection if missing
    if (!hasQueueSelection()) {
      const branchToUse = branchId || branchFromUrl;
      const serviceToUse = serviceType || serviceFromUrl;
      if (branchToUse && serviceToUse) {
        if (!store.branches.length) {
          await store.loadBranches();
        }
        await store.selectBranchAndService(branchToUse, serviceToUse);
      }
    }

    if (!hasQueueSelection()) {
      errorMsg.value =
        "Please select a branch and service before joining the queue";
      return;
    }

    await store.joinQueueAction(
      profile?.name ||
        user.displayName ||
        user.email?.split("@")[0] ||
        "Customer",
      user.email,
      user.uid,
      "email-link",
    );
    router.replace("/customer-main");
  } catch (error) {
    console.error(error);

    if (
      error?.message?.includes(
        "Please select a branch and service before joining the queue",
      )
    ) {
      errorMsg.value =
        "Please select a branch and service before joining the queue";
    } else {
      errorMsg.value = "Sign-in link is invalid or expired";
    }
  }
});

const googleSvg = `
<svg width="20" height="20" viewBox="0 0 256 262" xmlns="http://www.w3.org/2000/svg">
  <path fill="#4285F4" d="M255.68 133.5c0-10.7-.86-18.5-2.73-26.6H130.5v48.2h71.9c-1.45 12.1-9.3 30.4-26.7 42.6l-.24 1.6 38.8 30 2.7.3c24.8-22.9 38.2-56.6 38.2-96.1"/>
  <path fill="#34A853" d="M130.5 261.1c35.1 0 64.6-11.6 86.1-31.5l-41.1-31.8c-11 7.7-25.8 13.1-45 13.1-34.4 0-63.6-22.9-74-54.6l-1.5.1-40.3 31.2-.5 1.4c21.3 42.3 64.9 71.1 116.3 71.1"/>
  <path fill="#FBBC05" d="M56.5 156.3c-2.8-8.1-4.4-16.8-4.4-25.8 0-9 .16-17.7 4.3-25.8l-.07-1.7-40.7-31.6-1.3.6C5.5 86.5 0 109.2 0 131.7c0 22.5 5.5 45.2 14.3 65l42.2-32"/>
  <path fill="#EB4335" d="M130.5 50.4c24.4 0 40.8 10.5 50.1 19.3l36.6-35.8C195 12.2 165.6 0 130.5 0 79.1 0 35.5 28.8 14.3 66.7l42.2 32c10.3-31.7 39.5-54.6 74-54.6"/>
</svg>
`;
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
  text-align: center;
  font-family: "Inter", sans-serif;
}

.google-btn {
  width: 100%;
  height: 42px;
  border: 1px solid #d9dbe0;
  border-radius: 4px;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-family: "Inter", sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: #2f2f2f;
  cursor: pointer;
  transition:
    background 0.2s ease,
    transform 0.15s ease,
    opacity 0.2s ease;
}

.google-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.google-btn:hover:not(:disabled) {
  background: #f7f7f7;
  transform: translateY(-1px);
}

.google-btn:active:not(:disabled) {
  transform: translateY(1px);
}

.google-icon {
  display: inline-flex;
  width: 20px;
  height: 20px;
}

.divider {
  position: relative;
  margin: 18px 0;
  color: #7a8090;
  font-size: 13px;
}

.divider::before,
.divider::after {
  content: "";
  position: absolute;
  top: 50%;
  width: 42%;
  height: 1px;
  background: #e2e4ea;
}

.divider::before {
  left: 0;
}

.divider::after {
  right: 0;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 14px;
  text-align: left;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field span {
  font-family: "Inter", sans-serif;
  font-size: 16px;
  color: #333333;
}

.field input {
  height: 40px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  padding: 0 12px;
  font-size: 14px;
  font-family: "Inter", sans-serif;
  background: #ffffff;
  outline: none;
  box-sizing: border-box;
}

.primary-btn {
  width: 100%;
  height: 42px;
  border: none;
  border-radius: 4px;
  background: #2f2f2f;
  color: #ffffff;
  font-family: "Inter", sans-serif;
  font-size: 14px;
  font-weight: 400;
  cursor: pointer;
  margin-top: 12px;
  transition:
    background 0.2s ease,
    transform 0.15s ease,
    opacity 0.2s ease;
}

.primary-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.primary-btn:hover:not(:disabled) {
  background: #3a3a3a;
  transform: translateY(-1px);
}

.primary-btn:active:not(:disabled) {
  transform: translateY(1px);
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

.error-text {
  color: #dc2626;
}

.success-text {
  color: #16a34a;
}
</style>
