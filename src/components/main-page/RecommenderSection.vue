<template>
  <section class="recommender-section">
    <h2>Recommended for you</h2>
    <p v-if="usingLabel" class="using-label">
      Using: <span class="using-highlight">{{ usingLabel }}</span>
    </p>
    <p v-else class="using-label using-placeholder">
      Select a service and location above to see recommendations
    </p>

    <div v-if="searchDone" class="mode-toggle">
      <span class="mode-label">Travel mode:</span>
      <button
        v-for="mode in travelModes"
        :key="mode.value"
        :class="['mode-chip', { active: travelMode === mode.value }]"
        @click="travelMode = mode.value"
      >
        {{ mode.label }}
      </button>
    </div>

    <div class="cards-container">
      <div v-if="!searchDone" class="empty-state">
        <div class="dots">
          <span class="dot"></span>
          <span class="dot"></span>
          <span class="dot"></span>
        </div>
      </div>

      <template v-else>
        <div class="section-header">
          <div class="top3-flag">Top 3</div>
          <p class="reminder">
            Choosing a branch will fill the form above (branch + service)
          </p>
          <p v-if="allTravelUnavailable" class="travel-note">
            Travel times are currently unavailable. Branches are ranked by queue
            wait only
          </p>
        </div>

        <div
          v-for="branch in top3Branches"
          :key="branch.id"
          class="branch-card"
        >
          <div class="branch-left">
            <div class="branch-name">
              <b>{{ branch.name }}</b>
            </div>
            <div class="branch-details">
              <div class="branch-icon">
                <img
                  :src="branchIcon"
                  alt="Bank icon"
                  class="branch-icon-img"
                />
              </div>
              <div class="branch-info">
                <p class="total-time" v-if="branch.hasTravelData">
                  🕐 ~
                  <strong>
                    {{
                      formatDuration(
                        branch.travelMinutes + branch.estimatedWait,
                      )
                    }}
                    total
                  </strong>
                </p>
                <p class="travel-unavailable" v-else>
                  🕐 <strong>Travel time unavailable</strong>
                </p>

                <p>
                  {{ branch.serviceLabel }}:
                  {{ formatDuration(branch.estimatedWait) + " wait" }}
                </p>
                <p>People Ahead: {{ branch.peopleAhead }}</p>

                <p class="time-breakdown" v-if="branch.hasTravelData">
                  ({{ travelModes.find((m) => m.value === travelMode)?.icon }}
                  {{ formatDuration(branch.travelMinutes) }} travel +
                  {{ formatDuration(branch.estimatedWait) }} wait)
                </p>
              </div>
            </div>
          </div>

          <div class="button-options">
            <button class="action-button use-button" @click="useBranch(branch)">
              Use This Branch
            </button>
            <router-link
              :to="{
                name: 'analytics',
                params: { branchId: branch.id },
                query: { service: props.selectedService },
              }"
              class="action-button details-button"
            >
              Branch Details
            </router-link>
          </div>
        </div>

        <template v-if="remainingBranches.length > 0">
          <template v-if="expand">
            <p class="all-branches-note">
              All branches — ranked by available travel time and queue wait
            </p>
            <div class="section-divider" />

            <div
              v-for="branch in remainingBranches"
              :key="branch.id"
              class="branch-card"
            >
              <div class="branch-left">
                <div class="branch-name">
                  <b>{{ branch.name }}</b>
                </div>
                <div class="branch-details">
                  <div class="branch-icon">
                    <img
                      :src="branchIcon"
                      alt="Bank icon"
                      class="branch-icon-img"
                    />
                  </div>
                  <div class="branch-info">
                    <p class="total-time" v-if="branch.hasTravelData">
                      🕐 ~
                      <strong>
                        {{
                          formatDuration(
                            branch.travelMinutes + branch.estimatedWait,
                          )
                        }}
                        total
                      </strong>
                    </p>
                    <p class="travel-unavailable" v-else>
                      🕐 <strong>Travel time unavailable</strong>
                    </p>

                    <p>
                      {{ branch.serviceLabel }}:
                      {{ formatDuration(branch.estimatedWait) + " wait" }}
                    </p>
                    <p>People Ahead: {{ branch.peopleAhead }}</p>

                    <p class="time-breakdown" v-if="branch.hasTravelData">
                      ({{
                        travelModes.find((m) => m.value === travelMode)?.icon
                      }}
                      {{ formatDuration(branch.travelMinutes) }} travel +
                      {{ formatDuration(branch.estimatedWait) }} wait)
                    </p>
                  </div>
                </div>
              </div>

              <div class="button-options">
                <button
                  class="action-button use-button"
                  @click="useBranch(branch)"
                >
                  Use This Branch
                </button>
                <router-link
                  :to="{
                    name: 'analytics',
                    params: { branchId: branch.id },
                    query: { service: props.selectedService },
                  }"
                  class="action-button details-button"
                >
                  Branch Details
                </router-link>
              </div>
            </div>
          </template>

          <button class="expand-button" @click="expand = !expand">
            {{ expand ? "Collapse" : "Expand" }}
            <span class="arrow">{{ expand ? "∧" : ">" }}</span>
          </button>
        </template>
      </template>
    </div>

    <p class="disclaimer">
      Travel times are estimates provided by Google Maps and may vary based on
      real-time conditions
    </p>
  </section>
</template>

<script setup>
import branchIcon from "@/assets/icons/abc-bank-logo.png";
import { useQueueStore } from "@/stores/QueueStores";
import {
  getQueuePreview,
  listenToWaitingTickets,
} from "@/services/QueueService";
import { formatDuration } from "@/utils/formatDuration";
import { ref, computed, onMounted, onUnmounted, watch } from "vue";

// ─── Store & Props ───────────────────────────────────────────────────────────
const store = useQueueStore();

const props = defineProps({
  usingLabel: String,
  userLat: Number,
  userLng: Number,
  selectedService: String,
});

const emit = defineEmits(["useBranch"]);

// ─── Refs ────────────────────────────────────────────────────────────────────
const expand = ref(false);
const recommendedBranches = ref([]);
const cachedPreviews = ref([]);
const travelMode = ref("TRANSIT");
let branchListeners = [];

const travelModes = [
  { value: "TRANSIT", label: "🚌 Public Transport", icon: "🚌" },
  { value: "WALKING", label: "🚶 Walking", icon: "🚶" },
  { value: "DRIVING", label: "🚗 Driving", icon: "🚗" },
];

// ─── Computed ────────────────────────────────────────────────────────────────
const searchDone = computed(() => !!props.usingLabel);
const top3Branches = computed(() => recommendedBranches.value.slice(0, 3));
const remainingBranches = computed(() => recommendedBranches.value.slice(3));

const allTravelUnavailable = computed(
  () =>
    searchDone.value &&
    recommendedBranches.value.length > 0 &&
    recommendedBranches.value.every((branch) => !branch.hasTravelData),
);

// ─── Watches ─────────────────────────────────────────────────────────────────

// Refetch and restart listeners when location or service changes
watch(
  () => [props.userLat, props.userLng, props.selectedService],
  async ([lat, lng, service]) => {
    stopBranchListeners();

    if (lat == null || lng == null || !service) {
      recommendedBranches.value = [];
      cachedPreviews.value = [];
      return;
    }

    expand.value = false;
    travelMode.value = "TRANSIT";

    const travelTimes = await getTravelTimes(lat, lng, "TRANSIT");

    const output = await Promise.all(
      store.branches.map(async (branch, index) => {
        const preview = await getQueuePreview(branch.id, service);
        const travelMinutes = travelTimes[index];
        return buildBranchRecommendation(
          branch,
          service,
          preview,
          travelMinutes,
        );
      }),
    );

    cachedPreviews.value = output.map((branch) => ({ ...branch }));
    recommendedBranches.value = sortRecommendedBranches(output);

    startBranchListeners(service);
  },
  { immediate: true },
);

// Rerank when travel mode changes
watch(travelMode, async (mode) => {
  if (props.userLat == null || props.userLng == null || !props.selectedService)
    return;
  await rerank(props.userLat, props.userLng, mode);
});

// ─── Lifecycle ───────────────────────────────────────────────────────────────
onMounted(async () => {
  await store.loadBranches();
});

onUnmounted(() => {
  stopBranchListeners();
});

// ─── Listener management ─────────────────────────────────────────────────────
function startBranchListeners(service) {
  stopBranchListeners();

  store.branches.forEach((branch) => {
    const unsub = listenToWaitingTickets(branch.id, service, async () => {
      const preview = await getQueuePreview(branch.id, service);
      const index = cachedPreviews.value.findIndex((b) => b.id === branch.id);
      if (index === -1) return;

      const updated = [...cachedPreviews.value];
      updated[index] = {
        ...updated[index],
        estimatedWait: preview?.estimatedWait ?? 0,
        peopleAhead: preview?.peopleAhead ?? 0,
        sortValue: updated[index].hasTravelData
          ? (preview?.estimatedWait ?? 0) + updated[index].travelMinutes
          : (preview?.estimatedWait ?? 0),
      };

      cachedPreviews.value = updated;
      recommendedBranches.value = sortRecommendedBranches(updated);
    });

    branchListeners.push(unsub);
  });
}

function stopBranchListeners() {
  branchListeners.forEach((unsub) => unsub());
  branchListeners = [];
}

// ─── Functions ───────────────────────────────────────────────────────────────
async function rerank(lat, lng, mode) {
  const travelTimes = await getTravelTimes(lat, lng, mode);

  const updated = cachedPreviews.value.map((branch, index) => {
    const travelMinutes = travelTimes[index];
    const hasTravelData = travelMinutes != null;

    return {
      ...branch,
      travelMinutes,
      hasTravelData,
      sortGroup: hasTravelData ? 0 : 1,
      sortValue: hasTravelData
        ? branch.estimatedWait + travelMinutes
        : branch.estimatedWait,
    };
  });

  recommendedBranches.value = sortRecommendedBranches(updated);
}

function sortRecommendedBranches(branches) {
  return [...branches].sort((a, b) => {
    if (a.sortGroup !== b.sortGroup) return a.sortGroup - b.sortGroup;
    return a.sortValue - b.sortValue;
  });
}

function buildBranchRecommendation(branch, service, preview, travelMinutes) {
  const peopleAhead = preview?.peopleAhead ?? 0;
  const estimatedWait = preview?.estimatedWait ?? 0;
  const hasTravelData = travelMinutes != null;

  return {
    id: branch.id,
    name: branch.name,
    address: branch.address,
    serviceLabel: getServiceType(service),
    estimatedWait,
    peopleAhead,
    travelMinutes,
    hasTravelData,
    sortGroup: hasTravelData ? 0 : 1,
    sortValue: hasTravelData ? estimatedWait + travelMinutes : estimatedWait,
  };
}

function getTravelTimes(lat, lng, mode) {
  return new Promise((resolve) => {
    const service = new google.maps.DistanceMatrixService();

    const request = {
      origins: [{ lat, lng }],
      destinations: store.branches.map((branch) => ({
        lat: branch.location.lat,
        lng: branch.location.lng,
      })),
      travelMode: google.maps.TravelMode[mode],
    };

    if (mode === "TRANSIT") {
      request.transitOptions = {
        departureTime: new Date(),
        modes: [google.maps.TransitMode.BUS, google.maps.TransitMode.RAIL],
      };
    }

    service.getDistanceMatrix(request, (response, status) => {
      if (status !== "OK") {
        resolve(store.branches.map(() => null));
        return;
      }

      const times = response.rows[0].elements.map((element) =>
        element.status === "OK" ? Math.ceil(element.duration.value / 60) : null,
      );

      resolve(times);
    });
  });
}

function getServiceType(service) {
  const labels = {
    General: "General Services",
    Account: "Account Services",
    Loan: "Loan Services",
  };
  return labels[service] ?? service;
}

function useBranch(branch) {
  emit("useBranch", {
    branchId: branch.id,
    service: props.selectedService,
  });
}
</script>

<style scoped>
.recommender-section {
  padding: 10px clamp(24px, 9vw, 375px);
  margin-top: 30px;
}

.recommender-section h2 {
  margin: 0 0 8px;
  font-family: "Inter", sans-serif;
  font-size: clamp(16px, 2vw, 22px);
  font-weight: 700;
  color: #1f2937;
}

.using-label {
  margin: 0;
  font-size: 16px;
  font-family: "Inter", sans-serif;
  color: #6b7280;
}

.using-highlight {
  color: #4169e1;
}

.mode-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 10px 0 0 0;
  flex-wrap: wrap;
}

.mode-label {
  font-family: "Inter", sans-serif;
  font-size: 14px;
  color: #6b7280;
}

.mode-chip {
  padding: 4px 14px;
  border-radius: 20px;
  border: 1px solid #d1d5db;
  background: white;
  font-family: "Inter", sans-serif;
  font-size: 13px;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s ease;
}

.mode-chip.active {
  background: #0a1f44;
  color: white;
  border-color: #0a1f44;
}

.mode-chip:hover:not(.active) {
  background: #f3f4f6;
}

.cards-container {
  width: 100%;
  margin: 16px 0 55px 0;
  background: rgba(255, 255, 255, 0.8);
  padding: 22px 26px;
  border-radius: 8px;
  box-sizing: border-box;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}

.dots {
  display: flex;
  flex-direction: row;
  gap: 8px;
  align-items: center;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #d1d5db;
}

.section-header {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  margin-bottom: 4px;
}

.top3-flag {
  display: inline-flex;
  align-items: center;
  min-width: 120px;
  font-family: "Inter", sans-serif;
  background: #4169e1;
  color: #fff;
  font-size: 16px;
  padding: 6px 18px;
  border-radius: 4px;
  line-height: 1;
  clip-path: polygon(0 0, 88% 0, 100% 50%, 88% 100%, 0 100%);
}

.reminder {
  font-family: "Inter", sans-serif;
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.branch-card {
  width: 100%;
  margin: 12px 0 0 0;
  background: #ffffff;
  padding: 16px 20px;
  border-radius: 8px;
  box-sizing: border-box;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.branch-left {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.branch-name {
  font-family: "Inter", sans-serif;
  font-size: 18px;
  font-weight: 500;
  color: #111827;
  margin: 0;
}

.branch-details {
  display: flex;
  align-items: center;
  gap: 18px;
}

.branch-icon {
  flex-shrink: 0;
  width: 45px;
  height: 45px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.branch-icon-img {
  width: 42px;
  height: 42px;
  object-fit: contain;
}

.branch-info p {
  font-family: "Inter", sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: #111827;
  margin: 0 0 4px;
}

.total-time {
  font-size: 14px !important;
  color: #111827 !important;
}

.time-breakdown {
  font-size: 12px !important;
  color: #4f545f !important;
  margin-top: 2px !important;
}

.slower-label {
  color: #4f545f;
  font-size: 12px;
}

.button-options {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.action-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  height: 32px;
  padding: 0 18px;
  border-radius: 4px;
  font-family: "Inter", sans-serif;
  font-size: 14px;
  font-weight: 400;
  cursor: pointer;
  transition:
    background 0.2s ease,
    transform 0.15s ease,
    opacity 0.2s ease;
  text-decoration: none;
  line-height: 1;
}

.use-button {
  border: 0;
  background: #0a1f44;
  color: #ffffff;
}

.use-button:hover {
  background: #102a5c;
}

.use-button:active {
  transform: translateY(1px);
}

.details-button {
  border: 1px solid #0a1f44;
  background: #ffffff;
  color: #0a1f44;
}

.details-button:hover {
  background: #f8fafc;
}

.details-button:active {
  transform: translateY(1px);
}

.all-branches-note {
  font-family: "Inter", sans-serif;
  font-size: 14px;
  color: #6b7280;
  margin: 25px 0 6px;
}

.section-divider {
  width: 100%;
  height: 1px;
  background: #e5e7eb;
  margin: 6px 0 18px;
  display: block;
}

.expand-button {
  margin-top: 20px;
  padding: 0;
  border: none;
  background: transparent;
  color: #4169e1;
  font-family: "Inter", sans-serif;
  font-size: 14px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.expand-button:hover {
  text-decoration: underline;
}

.arrow {
  font-size: 14px;
  line-height: 1;
}

.disclaimer {
  font-family: "Inter", sans-serif;
  font-size: 12px;
  color: #6b7280;
  text-align: center;
}

.travel-unavailable,
.travel-note {
  margin: 0;
  font-size: 14px;
  line-height: 1.4;
  font-family: "Inter", sans-serif;
  color: #b45309;
}

.travel-note {
  margin-bottom: 10px;
}
</style>
