<template>
  <section class="recommender-section">
    <h2>Need help picking a branch?</h2>
    <p>
      Let SmartQueue recommend the best branches based on your current location
      and service
    </p>
    <div class="loc-card">
      <div class="field">
        <label>Service Type:</label>
        <select v-model="selectedService">
          <option disabled value="">Select Service Type</option>
          <option
            v-for="service in services"
            :key="service.value"
            :value="service.value"
          >
            {{ service.label }}
          </option>
        </select>
      </div>

      <div class="field">
        <label>Location:</label>
        <div class="current-loc">
          <button class="loc-button" type="button" @click="useCurrentLocation">
            Use Current Location
          </button>
          <div class="feedback-slot">
            <p v-if="locationLabel" class="feedback-text location-success">
              {{ locationLabel }}
            </p>
            <p v-if="locationError" class="feedback-text location-error">
              {{ locationError }}
            </p>
          </div>
          <div class="or">Or</div>
          <input
            class="text-input"
            v-model="Address"
            type="text"
            inputmode="numeric"
            pattern="[0-9]*"
            placeholder="Enter 6-digit postal code"
            maxlength="6"
            @input="onPostalInput"
          />
          <div class="feedback-slot">
            <p v-if="postalError" class="feedback-text location-error">
              {{ postalError }}
            </p>
          </div>
        </div>
      </div>

      <p class="note">
        Branches will be ranked by estimated travel time and queue wait
      </p>

      <button
        class="search-button"
        type="button"
        :disabled="!selectedService || (!hasGpsInput && !Address)"
        @click="findBestBranches"
      >
        Find Best Branches
      </button>
    </div>
  </section>
</template>

<script setup>
import { ref } from "vue";
import { useQueueStore } from "@/stores/QueueStores";

const store = useQueueStore();
const emit = defineEmits(["locationConfirmed"]);

const services = [
  { value: "General", label: "General Services" },
  { value: "Account", label: "Account Services" },
  { value: "Loan", label: "Loan Services" },
];

const selectedService = ref("");
const Address = ref("");
const hasGpsInput = ref(false);
const userLat = ref(null);
const userLng = ref(null);
const locationLabel = ref("");
const locationError = ref("");
const postalError = ref("");

async function useCurrentLocation() {
  if (!navigator.geolocation) {
    locationError.value = "Geolocation is not supported by your browser.";
    return;
  }
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      userLat.value = position.coords.latitude;
      userLng.value = position.coords.longitude;
      hasGpsInput.value = true;
      Address.value = "";
      locationError.value = "";
      postalError.value = "";

      try {
        const res = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${userLat.value},${userLng.value}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`,
        );
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          locationLabel.value = data.results[0].formatted_address;
        } else {
          locationLabel.value = "Current location retrieved";
        }
      } catch {
        locationLabel.value = "Current location retrieved";
      }
    },
    () => {
      locationError.value =
        "Unable to retrieve location. Please enter manually";
      hasGpsInput.value = false;
      locationLabel.value = "";
    },
  );
}

function onPostalInput(event) {
  Address.value = event.target.value.replace(/\D/g, "").slice(0, 6);

  if (Address.value) {
    hasGpsInput.value = false;
    locationLabel.value = "";
  }

  postalError.value = "";
}

async function getCoordinatesFromPostal(postal) {
  const res = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${postal},Singapore&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`,
  );
  const data = await res.json();
  if (!data.results || data.results.length === 0) {
    throw new Error("Postal code not found");
  }
  return {
    lat: data.results[0].geometry.location.lat,
    lng: data.results[0].geometry.location.lng,
    address: data.results[0].formatted_address,
  };
}

async function findBestBranches() {
  postalError.value = "";

  emit("locationConfirmed", {
    lat: null,
    lng: null,
    usingLabel: "",
    selectedService: "",
  });

  if (hasGpsInput.value) {
    const label = `${services.find((s) => s.value === selectedService.value)?.label} — ${locationLabel.value || "Current Location"}`;
    emit("locationConfirmed", {
      lat: userLat.value,
      lng: userLng.value,
      usingLabel: label,
      selectedService: selectedService.value,
    });
    return;
  }

  if (!/^\d{6}$/.test(Address.value)) {
    postalError.value = "Please enter a valid 6-digit postal code";
    return;
  }

  try {
    const coords = await getCoordinatesFromPostal(Address.value);
    userLat.value = coords.lat;
    userLng.value = coords.lng;
    const label = `${services.find((s) => s.value === selectedService.value)?.label} — ${coords.address}`;
    emit("locationConfirmed", {
      lat: coords.lat,
      lng: coords.lng,
      usingLabel: label,
      selectedService: selectedService.value,
    });
  } catch {
    postalError.value = "Postal code not found. Please try another";
  }
}
</script>

<style scoped>
.recommender-section {
  padding: 10px clamp(24px, 9vw, 375px);
}

.recommender-section h2 {
  margin: 0 0 8px;
  font-family: "Inter", sans-serif;
  font-size: clamp(16px, 2vw, 22px);
  font-weight: 700;
  color: #1f2937;
}

.recommender-section > p {
  margin: 0;
  font-family: "Inter", sans-serif;
  font-size: 16px;
  color: #6b7280;
}

.loc-card {
  width: 100%;
  margin: 16px 0 0 0;
  background: rgba(255, 255, 255, 0.8);
  padding: 22px 26px;
  border-radius: 8px;
  box-sizing: border-box;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 10px;
}

label {
  margin: 0;
  font-family: "Inter", sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: #111827;
}

.current-loc {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 0;
}

.feedback-slot {
  height: 18px;
  overflow: visible;
}

.feedback-text {
  margin: 0;
  font-size: 14px;
  line-height: 1.4;
  font-family: "Inter", sans-serif;
}

.location-success {
  color: #16a34a;
}

.location-error {
  color: #dc2626;
}

.or {
  display: flex;
  align-items: center;
  text-align: center;
  gap: 10px;
  margin: 6px 0;
  color: #6b7280;
  font-size: 14px;
  font-family: "Inter", sans-serif;
}

.or:before,
.or:after {
  content: "";
  flex: 1;
  height: 1px;
  background: #d1d5db;
}

select,
.text-input {
  width: 100%;
  height: 32px;
  padding: 0 10px;
  border: 1px solid #d9d9d9;
  background: #ffffff;
  color: #111827;
  font-family: "Inter", sans-serif;
  font-size: 14px;
  border-radius: 4px;
  box-sizing: border-box;
  outline: none;
  text-align: center;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

select:focus,
.text-input:focus {
  border-color: #4169e1;
  box-shadow: 0 0 0 2px rgba(65, 105, 225, 0.12);
}

.loc-button {
  width: 100%;
  height: 32px;
  border: 0;
  border-radius: 4px;
  background: #4169e1;
  color: #ffffff;
  font-family: "Inter", sans-serif;
  font-size: 14px;
  font-weight: 400;
  cursor: pointer;
  transition:
    background 0.2s ease,
    transform 0.15s ease,
    opacity 0.2s ease;
}

.loc-button:hover {
  background: #3659c9;
}

.loc-button:active {
  transform: translateY(1px);
}

.recommender-section p.note {
  margin: 8px 0 0;
  font-size: 14px;
  color: #6b7280;
  font-family: "Inter", sans-serif;
}

.search-button {
  display: block;
  height: 32px;
  margin: 8px auto 0;
  padding: 0 18px;
  border: 0;
  border-radius: 4px;
  background: #0a1f44;
  color: #ffffff;
  font-family: "Inter", sans-serif;
  font-size: 14px;
  font-weight: 400;
  cursor: pointer;
  transition:
    background 0.2s ease,
    transform 0.15s ease,
    opacity 0.2s ease;
}

.search-button:hover:not(:disabled) {
  background: #102a5c;
}

.search-button:active:not(:disabled) {
  transform: translateY(1px);
}

.search-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
