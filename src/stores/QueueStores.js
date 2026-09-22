import { formatDuration } from "@/utils/formatDuration";
import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";

const STORAGE_KEY = "sq_customer_session";
const STORAGE_SELECTION_KEY = "sq_branch_service_selection";
import {
  loginStaff,
  logoutStaff,
  getStaffProfile,
  updateStaffSession,
  getAllBranches,
  getQueuePreview,
  joinQueue,
  leaveQueue,
  callNext,
  markServed,
  markNoShow,
  listenToTicket,
  listenToQueue,
  listenToWaitingTickets,
} from "@/services/QueueService";
import { sendCallNextEmail } from "@/services/EmailService";

export const useQueueStore = defineStore("queue", () => {
  // ─── Auth / Staff state ──────────────────────────────────────────
  const staff = ref(null); // { uid, staffId, name, branchId, role, activeService, activeCounter }
  const isStaffLoggedIn = computed(() => !!staff.value);

  // ─── Branch state ────────────────────────────────────────────────
  const branches = ref([]);
  const selectedBranch = ref(null); // { id, name, address, location, counters }
  const selectedService = ref(null); // 'General' | 'Account' | 'Loan'

  // ─── Queue preview (main page) ───────────────────────────────────
  const queuePreview = ref(null); // { latestCalledTicket, peopleAhead, estimatedWait }
  const previewLoading = ref(false);

  // ─── Customer ticket (queue status page) ────────────────────────
  const activeTicket = ref(null); // { ticketId, ticketNumber, branchId, serviceType, status, ... }
  const peopleAhead = ref(0);

  const estimatedWait = ref(null);

  // ─── Staff queue state (staff home page) ────────────────────────
  const waitingTickets = ref([]);
  const currentlyServing = ref(null);
  const latestCalledTicket = ref("—");
  const avgWaitTimeToday = ref(10);

  // ─── Notification state ──────────────────────────────────────────
  const notification = ref(null);
  const showNotification = ref(false);
  const showServingNotification = ref(false);
  const showNoShowModal = ref(false);

  // ─── Saved customer info (for rejoin) ───────────────────────────
  const savedCustomerName = ref(null);
  const savedCustomerEmail = ref(null);
  const savedCustomerUid = ref(null);
  const savedAuthProvider = ref(null);

  // ─── Unsubscribe functions (for cleanup) ────────────────────────
  let unsubTicket = null;
  let unsubQueue = null;
  let unsubWaiting = null;
  let unsubCustomerWaiting = null;

  // ─── Computed ────────────────────────────────────────────────────
  const nextTicket = computed(() => {
    return waitingTickets.value[0]?.ticketNumber ?? "-";
  }); // returns the ticketNumber not the object

  const peopleInQueue = computed(() => waitingTickets.value.length);

  const formattedWait = computed(() => {
    if (estimatedWait.value == null) return null;
    return formatDuration(estimatedWait.value);
  });

  // ─── Auth actions ────────────────────────────────────────────────
  async function login(email, password) {
    const profile = await loginStaff(email, password);
    staff.value = profile;
    return profile;
  }

  async function logout() {
    await logoutStaff(staff.value?.uid);
    staff.value = null;
    currentlyServing.value = null;
    stopListeners();
  }

  async function loadStaffProfile(uid) {
    const profile = await getStaffProfile(uid);
    staff.value = profile;
  }

  // ─── Setup actions ───────────────────────────────────────────────
  async function confirmSetup(serviceType, counter) {
    await updateStaffSession(staff.value.uid, serviceType, counter);
    staff.value = {
      ...staff.value,
      activeService: serviceType,
      activeCounter: counter,
    };
  }

  // ─── Branch actions ──────────────────────────────────────────────
  async function loadBranches() {
    branches.value = await getAllBranches();
  }

  async function selectBranchAndService(branchId, serviceType) {
    selectedBranch.value =
      branches.value.find((b) => b.id === branchId) ?? null;
    selectedService.value = serviceType;
    // persist selection so magic-link restores it after redirect
    sessionStorage.setItem(
      STORAGE_SELECTION_KEY,
      JSON.stringify({
        selectedBranch: selectedBranch.value,
        selectedService: selectedService.value,
      }),
    );
    await fetchQueuePreview();
  }

  async function fetchQueuePreview() {
    if (!selectedBranch.value || !selectedService.value) return;
    previewLoading.value = true;
    try {
      queuePreview.value = await getQueuePreview(
        selectedBranch.value.id,
        selectedService.value,
      );
    } finally {
      previewLoading.value = false;
    }
  }

  function listenToBranchAndService(branchId, serviceType) {
    previewLoading.value = true;

    const unsub = listenToWaitingTickets(branchId, serviceType, async () => {
      const preview = await getQueuePreview(branchId, serviceType);
      queuePreview.value = preview;
      previewLoading.value = false;
    });

    return unsub;
  }

  // ─── Customer actions ────────────────────────────────────────────

  function startCustomerWaitingListener(branchId, serviceType) {
    unsubCustomerWaiting = listenToWaitingTickets(
      branchId,
      serviceType,
      async () => {
        await refreshPeopleAhead();
      },
    );
  }

  async function joinQueueAction(
    customerName,
    customerEmail,
    customerUid = null,
    authProvider = "guest",
  ) {
    if (!selectedBranch.value?.id || !selectedService.value) {
      throw new Error(
        "Please select a branch and service before joining the queue.",
      );
    }

    const { ticketId, ticketNumber } = await joinQueue(
      selectedBranch.value.id,
      selectedService.value,
      customerName,
      customerEmail,
      customerUid,
      authProvider,
    );

    savedCustomerName.value = customerName;
    savedCustomerEmail.value = customerEmail;
    savedCustomerUid.value = customerUid;
    savedAuthProvider.value = authProvider;

    activeTicket.value = {
      ticketId,
      ticketNumber,
      branchId: selectedBranch.value.id,
      serviceType: selectedService.value,
      status: "waiting",
      customerUid,
      authProvider,
    };

    notification.value = "Successfully joined the queue";
    showNotification.value = true;
    showServingNotification.value = false;
    showNoShowModal.value = false;

    startTicketListener(ticketId);
    startQueueListener(selectedBranch.value.id, selectedService.value);
    startCustomerWaitingListener(
      selectedBranch.value.id,
      selectedService.value,
    );
    await refreshPeopleAhead();

    return { ticketId, ticketNumber };
  }

  async function rejoinQueueAction() {
    showNoShowModal.value = false;
    stopListeners();
    await joinQueueAction(
      savedCustomerName.value,
      savedCustomerEmail.value,
      savedCustomerUid.value,
      savedAuthProvider.value,
    );
  }

  async function leaveQueueAction() {
    if (!activeTicket.value) return;

    await leaveQueue(activeTicket.value.ticketId);
    stopListeners();
    clearSession();

    activeTicket.value = null;
    peopleAhead.value = 0;
    estimatedWait.value = null;
    latestCalledTicket.value = "—";
    notification.value = null;
    showNotification.value = false;
    showServingNotification.value = false;
    showNoShowModal.value = false;
  }

  // ─── Staff actions ───────────────────────────────────────────────
  async function callNextAction() {
    if (!staff.value) return null;
    const result = await callNext(
      staff.value.branchId,
      staff.value.activeService,
      staff.value.activeCounter,
    );
    if (result) {
      currentlyServing.value = result;
      // Fire-and-forget email notification to the customer.
      sendCallNextEmail({
        customerEmail: result.customerEmail,
        customerName: result.customerName,
        ticketNumber: result.ticketNumber,
        branchId: staff.value.branchId,
        branchName: selectedBranch.value?.name,
        serviceName: selectedService.value,
        branchId: staff.value.branchId,
        serviceType: staff.value.activeService,
        counter: staff.value.activeCounter,
        type: "call-next",
      });
    }
    return result;
  }

  async function markServedAction() {
    if (!currentlyServing.value) return;
    await markServed(
      currentlyServing.value.ticketId,
      staff.value.branchId,
      staff.value.activeService,
    );
    currentlyServing.value = null;
  }

  async function markNoShowAction() {
    if (!currentlyServing.value) return;
    const prev = currentlyServing.value;
    await markNoShow(currentlyServing.value.ticketId);
    currentlyServing.value = null;
    // Notify the customer they missed their turn
    sendCallNextEmail({
      customerEmail: prev.customerEmail,
      customerName: prev.customerName,
      ticketNumber: prev.ticketNumber,
      branchId: staff.value.branchId,
      branchName: selectedBranch.value?.name,
      serviceName: selectedService.value,
      serviceType: staff.value.activeService,
      counter: staff.value.activeCounter,
      type: "no-show",
    });
  }

  // ─── Realtime listeners ──────────────────────────────────────────
  function startTicketListener(ticketId) {
    unsubTicket = listenToTicket(ticketId, async (ticket) => {
      const prevStatus = activeTicket.value?.status;
      activeTicket.value = { ...activeTicket.value, ...ticket };

      if (ticket.status === "waiting") {
        refreshPeopleAhead();
      } else if (ticket.status === "noshow") {
        peopleAhead.value = 0;
        // Fetch general queue wait so the rejoin modal shows a real estimate
        try {
          const preview = await getQueuePreview(
            activeTicket.value.branchId,
            activeTicket.value.serviceType,
          );
          estimatedWait.value = preview.estimatedWait;
        } catch {
          estimatedWait.value = null;
        }
      } else {
        peopleAhead.value = 0;
        estimatedWait.value = 0;
      }

      if (prevStatus === "waiting" && ticket.status === "serving") {
        showNotification.value = false;
        showServingNotification.value = true;
      }

      if (prevStatus === "serving" && ticket.status === "noshow") {
        showServingNotification.value = false;
        showNoShowModal.value = true;
      }
    });
  }

  function startQueueListener(branchId, serviceType) {
    unsubQueue = listenToQueue(branchId, serviceType, async (queueData) => {
      latestCalledTicket.value = queueData.latestCalledTicket ?? "—";
      await refreshPeopleAhead(); // this already calls getQueuePreview which handles avg correctly
    });
  }

  function startStaffListeners(branchId, serviceType) {
    unsubWaiting = listenToWaitingTickets(branchId, serviceType, (tickets) => {
      waitingTickets.value = tickets;
    });

    unsubQueue = listenToQueue(branchId, serviceType, (queueData) => {
      latestCalledTicket.value = queueData.latestCalledTicket ?? "—";
      avgWaitTimeToday.value = queueData.avgWaitTimeToday ?? 10;
    });
  }

  async function refreshPeopleAhead() {
    if (!activeTicket.value) return;

    if (activeTicket.value.status !== "waiting") {
      peopleAhead.value = 0;
      estimatedWait.value = 0;
      return;
    }

    const preview = await getQueuePreview(
      activeTicket.value.branchId,
      activeTicket.value.serviceType,
      activeTicket.value.ticketId,
    );

    peopleAhead.value = preview.peopleAhead;
    estimatedWait.value = preview.estimatedWait;
    latestCalledTicket.value = preview.latestCalledTicket ?? "—";
  }

  function stopListeners() {
    unsubTicket?.();
    unsubQueue?.();
    unsubWaiting?.();
    unsubCustomerWaiting?.();
    unsubTicket = null;
    unsubQueue = null;
    unsubWaiting = null;
    unsubCustomerWaiting = null;
    avgWaitTimeToday.value = 10;
  }

  function dismissNotification() {
    showNotification.value = false;
  }

  function dismissServingNotification() {
    showServingNotification.value = false;
  }

  function dismissNoShowModal() {
    showNoShowModal.value = false;
  }

  // ─── sessionStorage persistence ────────────────────────────────────
  function saveSession() {
    if (!activeTicket.value) return;
    const terminal = ["served", "left"];
    if (terminal.includes(activeTicket.value.status)) {
      sessionStorage.removeItem(STORAGE_KEY);
      return;
    }
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        activeTicket: activeTicket.value,
        selectedBranch: selectedBranch.value,
        selectedService: selectedService.value,
        savedCustomerName: savedCustomerName.value,
        savedCustomerEmail: savedCustomerEmail.value,
        savedCustomerUid: savedCustomerUid.value,
        savedAuthProvider: savedAuthProvider.value,
      }),
    );
  }

  function clearSession() {
    sessionStorage.removeItem(STORAGE_KEY);
  }

  watch(activeTicket, saveSession, { deep: true });

  // Restore last selected branch/service even before ticket exists
  (function restoreSelection() {
    const raw = sessionStorage.getItem(STORAGE_SELECTION_KEY);
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      selectedBranch.value = data.selectedBranch ?? null;
      selectedService.value = data.selectedService ?? null;
    } catch {
      sessionStorage.removeItem(STORAGE_SELECTION_KEY);
    }
  })();

  // ─── Restore session on page load ────────────────────────────────
  (function restoreSession() {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      const ticket = data.activeTicket;
      if (!ticket?.ticketId) return;

      activeTicket.value = ticket;
      selectedBranch.value = data.selectedBranch ?? null;
      selectedService.value = data.selectedService ?? null;
      savedCustomerName.value = data.savedCustomerName ?? null;
      savedCustomerEmail.value = data.savedCustomerEmail ?? null;
      savedCustomerUid.value = data.savedCustomerUid ?? null;
      savedAuthProvider.value = data.savedAuthProvider ?? null;

      if (ticket.status === "noshow") {
        showNoShowModal.value = true;
        // Fetch wait estimate for the rejoin prompt
        getQueuePreview(ticket.branchId, ticket.serviceType)
          .then((preview) => { estimatedWait.value = preview.estimatedWait; })
          .catch(() => { estimatedWait.value = null; });
        return;
      }

      if (ticket.status === "serving") {
        showServingNotification.value = true;
      }

      // Re-attach real-time listeners
      startTicketListener(ticket.ticketId);
      startQueueListener(ticket.branchId, ticket.serviceType);
      startCustomerWaitingListener(ticket.branchId, ticket.serviceType);
      refreshPeopleAhead();
    } catch {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  })();

  return {
    // state
    staff,
    isStaffLoggedIn,
    branches,
    selectedBranch,
    selectedService,
    queuePreview,
    previewLoading,
    activeTicket,
    peopleAhead,
    latestCalledTicket,
    avgWaitTimeToday,
    estimatedWait,
    waitingTickets,
    currentlyServing,
    notification,
    showNotification,
    showServingNotification,
    showNoShowModal,
    // computed
    nextTicket,
    peopleInQueue,
    formattedWait,
    // actions
    login,
    logout,
    loadStaffProfile,
    confirmSetup,
    loadBranches,
    selectBranchAndService,
    fetchQueuePreview,
    joinQueueAction,
    leaveQueueAction,
    callNextAction,
    markServedAction,
    markNoShowAction,
    startStaffListeners,
    stopListeners,
    dismissNotification,
    dismissServingNotification,
    dismissNoShowModal,
    rejoinQueueAction,
    listenToBranchAndService,
  };
});
