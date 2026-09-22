<template>
  <div class="analytics-page">
    <div class="analytics-head">
      <button @click="router.go(-1)" id="back-button">⟵ Back</button>
      <h2 id="branch-name">{{ branch.name }} Branch</h2>
    </div>

    <div ref="mapEl" class="map-container"></div>

    <div class="hours">
      <p id="hours-header">Opening Hours</p>
      <div class="hours-table">
        <span>Monday - Friday</span>
        <span>8:30 am - 4:00 pm</span>

        <span>Saturday</span>
        <span>8.30 am - 12:00 pm</span>
      </div>
    </div>
    <br />
  </div>
</template>

<script>
import { nextTick } from "vue";
import { useRouter } from "vue-router";
import { useQueueStore } from "@/stores/QueueStores.js";

export default {
  setup() {
    const router = useRouter();
    return { router };
  },
  data() {
    return {
      branch: { name: "" },
      map: null,
    };
  },
  async mounted() {
    window.scrollTo(0, 0);
    await nextTick();

    const store = useQueueStore();
    if (!store.branches.length) await store.loadBranches();

    const branchId = this.$route.params.branchId;
    this.branch = store.branches.find((b) => b.id === branchId);

    if (!this.branch || !this.$refs.mapEl) return;

    this.map = new google.maps.Map(this.$refs.mapEl, {
      center: {
        lat: this.branch.location.lat,
        lng: this.branch.location.lng,
      },
      zoom: 16,
    });

    new google.maps.Marker({
      position: {
        lat: this.branch.location.lat,
        lng: this.branch.location.lng,
      },
      map: this.map,
    });
  },
  beforeUnmount() {
    this.map = null;
  },
};
</script>

<style scoped>
.analytics-head {
  position: relative;
  display: flex;
  align-items: center;
  height: 60px;
  margin-top: 9px;
}

#back-button {
  font-family: "Inter", sans-serif;
  font-size: 14px;
  color: #0a1f44;
  background: #f3f4f6;
  border: none;
  cursor: pointer;
  padding: 8px 16px;
  border-radius: 20px;
  margin-left: 20px;
  transition: background 0.2s;
}

#back-button:hover {
  background: #e5e7eb;
}

#branch-name {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-family: "Inter", sans-serif;
  font-size: 30px;
  color: #0a1f44;
}

.map-container {
  max-width: 980px;
  height: 400px;
  border-radius: 8px;
  overflow: hidden;
  margin: 9px auto;
}

.hours {
  font-family: "Inter", sans-serif;
  font-size: 17px;
  color: #4f545f;
  font-weight: 500;
  text-align: center;
  margin-top: 40px;
}

.hours-table {
  display: grid;
  grid-template-columns: max-content max-content;
  column-gap: 40px;
  row-gap: 10px;
  justify-content: center;
  align-items: center;
}

.hours-table span:nth-child(odd) {
  text-align: left;
}

.hours-table span:nth-child(even) {
  text-align: left;
}
</style>
