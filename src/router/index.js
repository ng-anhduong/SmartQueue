import { createRouter, createWebHistory } from "vue-router";
import { doc, getDoc, getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { useQueueStore } from "@/stores/QueueStores";

import MainPage from "@/views/MainPage.vue";
import StaffMain from "@/views/StaffMain.vue";
import CustomerMain from "@/views/CustomerMain.vue";
import CustomerDetails from "@/views/CustomerDetails.vue";
import StaffLogin from "@/views/StaffLogin.vue";
import StaffSetup from "@/views/StaffSetup.vue";
import AnalyticsPage from "@/views/AnalyticsPage.vue";

const routes = [
  {
    path: "/",
    name: "main",
    component: MainPage,
  },

  {
    path: "/analytics/:branchId",
    name: "analytics",
    component: AnalyticsPage,
  },

  {
    path: "/customer-details",
    name: "customer-details",
    component: CustomerDetails,
  },
  
  {
    path: "/customer-main",
    name: "customer-main",
    component: CustomerMain,
  },

  {
    path: "/staff-login",
    name: "staff-login",
    component: StaffLogin,
  },

  {
    path: "/staff-setup",
    name: "staff-setup",
    component: StaffSetup,
    meta: { requiresStaff: true }
  },

  {
    path: "/staff-main",
    name: "staff-main",
    component: StaffMain,
    meta: { requiresStaff: true }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

async function getUserRole(uid) {
  const db = getFirestore();

  const staffSnap = await getDoc(doc(db, "staff", uid));
  if (staffSnap.exists()) return "staff";

  const customerSnap = await getDoc(doc(db, "customers", uid));
  if (customerSnap.exists()) return "customer";

  return null;
}

// route guard - prevent access after logout
router.beforeEach(async (to, from, next) => {
  const store = useQueueStore();
  const auth = getAuth();
  const user = auth.currentUser;

  // restore session if store empty
  if (user) {
    const role = await getUserRole(user.uid);

    if (role === "staff" && !store.staff) {
      await store.loadStaffProfile(user.uid);
    }

    if (to.meta.requiresStaff && role !== "staff") {
      return next({ name: "staff-login" });
    }
  } else {
    if (to.meta.requiresStaff) {
      return next({ name: "staff-login" });
    }
  }

  next();
});

export default router;
