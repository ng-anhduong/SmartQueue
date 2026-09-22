<template>
  <div>
    <NavBar :isStaff="true" />

    <div class="staff-main">
      <CounterDetails />
      <ServeSection />
      <StaffStatistics />
    </div>
  </div>
</template>

<script setup>
import NavBar from "@/components/TheNavBar.vue";
import CounterDetails from "@/components/staff-home/CounterDetails.vue";
import ServeSection from "@/components/staff-home/ServeSection.vue";
import StaffStatistics from "@/components/staff-home/StaffStatistics.vue";

import { ref, onMounted, onUnmounted } from "vue";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore"; 
import { useQueueStore } from '@/stores/QueueStores';

const staffID = ref("");
const branch = ref("");
const queueStore = useQueueStore();

onMounted(async () => {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) return;

  const db = getFirestore();

  // retrieve staff profile
  const docRef = doc(db, "staff", user.uid);
  const staffSnap = await getDoc(docRef);
  if (staffSnap.exists()) {
    const staffData = staffSnap.data();
    staffID.value = staffData.staffId;
    const branchId = staffData.branchId;
    const branchSnap = await getDoc(doc(db, "branches", branchId));
    if (branchSnap.exists()) {
      const branchData = branchSnap.data();
      branch.value = branchData.name; 
    }
  }
  const activeService = queueStore.staff?.activeService;
  const branchId = queueStore.staff?.branchId;

  if (branchId && activeService) {
    queueStore.startStaffListeners(branchId, activeService);
  }

});

onUnmounted(() => {
  queueStore.stopListeners();
});

</script>
