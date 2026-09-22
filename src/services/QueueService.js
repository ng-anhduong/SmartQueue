import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  setDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  Timestamp,
  deleteField,
} from "firebase/firestore";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { db, auth } from "@/firebase";

// ─── Helpers ────────────────────────────────────────────────────────────────

function getTodayDate() {
  // to be deleted
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getQueueDocId(branchId, serviceType) {
  return `${branchId}_${serviceType}`;
}

function getTodayStart() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return Timestamp.fromDate(start);
}

function getTicketPrefix(serviceType) {
  const prefixes = { General: "G", Account: "A", Loan: "L" };
  return prefixes[serviceType] ?? "X";
}

function formatTicketNumber(prefix, number) {
  return `${prefix}${String(number).padStart(3, "0")}`;
}

function getResetDailyFields() {
  return {
    currentNumber: 0,
    latestCalledTicket: "—",

    totalWaitMinutesToday: 0,
    waitSampleCountToday: 0,
    avgWaitTimeToday: 0,

    totalServiceMinutesToday: 0,
    serviceSampleCountToday: 0,
    avgServiceTimeToday: 0,
    servedCountToday: 0,
    lastResetDate: getTodayDate(),
  };
}

function getQueueDataWithDailyReset(queueData = {}) {
  const today = getTodayDate();

  if (queueData.lastResetDate !== today) {
    return {
      ...queueData,
      ...getResetDailyFields(),
    };
  }

  return queueData;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export async function loginStaff(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email, password);

  const uid = credential.user.uid;

  const snap = await getDoc(doc(db, "staff", uid));
  if (!snap.exists()) throw new Error("Staff profile not found.");

  return {
    uid,
    ...snap.data(),
  };
}

export async function logoutStaff(uid) {
  if (uid) {
    await updateDoc(doc(db, "staff", uid), {
      activeService: deleteField(),
      activeCounter: deleteField(),
    });
  }

  await signOut(auth);
}

// ─── Staff ───────────────────────────────────────────────────────────────────

export async function getStaffProfile(uid) {
  const snap = await getDoc(doc(db, "staff", uid));
  if (!snap.exists()) throw new Error("Staff profile not found.");
  return { uid, ...snap.data() };
}

export async function updateStaffSession(uid, serviceType, counter) {
  await updateDoc(doc(db, "staff", uid), {
    activeService: serviceType,
    activeCounter: counter,
  });
}

// ─── Branches ────────────────────────────────────────────────────────────────

export async function getAllBranches() {
  const snap = await getDocs(collection(db, "branches"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getBranch(branchId) {
  const snap = await getDoc(doc(db, "branches", branchId));
  if (!snap.exists()) throw new Error("Branch not found.");
  return { id: snap.id, ...snap.data() };
}

// ─── Queue preview ───────────────────────────────────────────────────────────

export async function getQueuePreview(
  branchId,
  serviceType,
  activeTicketId = null,
) {
  const queueDocId = getQueueDocId(branchId, serviceType);
  const queueSnap = await getDoc(doc(db, "queues", queueDocId));

  const q = query(
    collection(db, "tickets"),
    where("branchId", "==", branchId),
    where("serviceType", "==", serviceType),
    where("status", "==", "waiting"),
    where("joinedAt", ">=", getTodayStart()),
    orderBy("joinedAt", "asc"),
  );

  const ticketsSnap = await getDocs(q);
  const waitingTickets = ticketsSnap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));

  let peopleAhead = waitingTickets.length;

  if (activeTicketId) {
    const activeIndex = waitingTickets.findIndex(
      (t) => t.id === activeTicketId,
    );
    peopleAhead = activeIndex >= 0 ? activeIndex : waitingTickets.length;
  }

  const rawQueueData = queueSnap.exists() ? queueSnap.data() : {};
  const queueData = getQueueDataWithDailyReset(rawQueueData);

  const avgServiceTime = queueData.avgServiceTimeToday ?? null;
  const branchSnap = await getDoc(doc(db, "branches", branchId));
  const counters = branchSnap.data()?.counters?.[serviceType] ?? 1;

  const estimatedWait = avgServiceTime
    ? Math.ceil((peopleAhead * avgServiceTime) / counters)
    : Math.ceil((peopleAhead * 10) / counters);

  return {
    latestCalledTicket: queueData.latestCalledTicket ?? "—",
    peopleAhead,
    estimatedWait,
    avgServiceTimeToday: queueData.avgServiceTimeToday ?? 10,
    avgWaitTimeToday: queueData.avgWaitTimeToday ?? 10,
  };
}

// ─── Join queue ──────────────────────────────────────────────────────────────

export async function joinQueue(
  branchId,
  serviceType,
  customerName,
  customerEmail,
  customerUid = null,
  authProvider = "guest",
) {
  const queueDocId = getQueueDocId(branchId, serviceType);
  const queueDocRef = doc(db, "queues", queueDocId);
  const prefix = getTicketPrefix(serviceType);

  let ticketNumber;

  await runTransaction(db, async (transaction) => {
    const queueSnap = await transaction.get(queueDocRef);

    if (queueSnap.exists()) {
      const rawQueueData = queueSnap.data();
      const queueData = getQueueDataWithDailyReset(rawQueueData);

      const currentNumber = queueData.currentNumber ?? 0;
      const newNumber = currentNumber + 1;
      ticketNumber = formatTicketNumber(prefix, newNumber);
      transaction.set(
        queueDocRef,
        {
          ...queueData,
          branchId,
          serviceType,
          currentNumber: newNumber,
        },
        { merge: true },
      );
    } else {
      const newNumber = 1;
      ticketNumber = formatTicketNumber(prefix, newNumber);

      transaction.set(queueDocRef, {
        branchId,
        serviceType,
        currentNumber: newNumber,
        latestCalledTicket: "—",
        ...getResetDailyFields(),
      });
    }
  });

  const ticketRef = await addDoc(collection(db, "tickets"), {
    branchId,
    serviceType,
    ticketNumber,
    customerName,
    customerEmail,
    customerUid,
    authProvider,
    status: "waiting",
    joinedAt: serverTimestamp(),
    calledAt: null,
    servedAt: null,
    counter: null,
  });

  return {
    ticketId: ticketRef.id,
    ticketNumber,
  };
}

// ─── Leave queue ─────────────────────────────────────────────────────────────

export async function leaveQueue(ticketId) {
  await updateDoc(doc(db, "tickets", ticketId), {
    status: "left",
  });
}

// ─── Staff actions ───────────────────────────────────────────────────────────

export async function callNext(branchId, serviceType, counter) {
  // Only call today's waiting tickets
  const q = query(
    collection(db, "tickets"),
    where("branchId", "==", branchId),
    where("serviceType", "==", serviceType),
    where("status", "==", "waiting"),
    where("joinedAt", ">=", getTodayStart()),
    orderBy("joinedAt", "asc"),
  );
  const snap = await getDocs(q);

  if (snap.empty) return null;

  const nextTicket = snap.docs[0];
  const ticketData = nextTicket.data();

  const calledAtDate = new Date();
  const joinedAtDate = ticketData.joinedAt?.toDate?.();
  const waitMs = joinedAtDate ? calledAtDate - joinedAtDate : null;
  const waitMinutes = waitMs != null ? waitMs / 60000 : null;

  await updateDoc(doc(db, "tickets", nextTicket.id), {
    status: "serving",
    calledAt: serverTimestamp(),
    counter,
  });

  const queueDocId = getQueueDocId(branchId, serviceType);
  const queueRef = doc(db, "queues", queueDocId);
  const queueSnap = await getDoc(queueRef);

  const rawQueueData = queueSnap.exists() ? queueSnap.data() : {};
  const queueData = getQueueDataWithDailyReset(rawQueueData);
  const updateData = {
    latestCalledTicket: ticketData.ticketNumber,
  };

  if (waitMinutes != null) {
    const newTotalWait = (queueData.totalWaitMinutesToday ?? 0) + waitMinutes;
    const newWaitCount = (queueData.waitSampleCountToday ?? 0) + 1;

    updateData.totalWaitMinutesToday = newTotalWait;
    updateData.waitSampleCountToday = newWaitCount;
    updateData.avgWaitTimeToday = Math.round(newTotalWait / newWaitCount);
  }

  if (queueData.lastResetDate !== rawQueueData.lastResetDate) {
    Object.assign(updateData, {
      totalWaitMinutesToday: updateData.totalWaitMinutesToday ?? 0,
      waitSampleCountToday: updateData.waitSampleCountToday ?? 0,
      avgWaitTimeToday: updateData.avgWaitTimeToday ?? 0,

      totalServiceMinutesToday: queueData.totalServiceMinutesToday ?? 0,
      serviceSampleCountToday: queueData.serviceSampleCountToday ?? 0,
      avgServiceTimeToday: queueData.avgServiceTimeToday ?? 0,

      servedCountToday: queueData.servedCountToday ?? 0,
      lastResetDate: queueData.lastResetDate,
    });
  }

  await setDoc(queueRef, updateData, { merge: true });
  return {
    ticketId: nextTicket.id,
    ticketNumber: ticketData.ticketNumber,
    customerEmail: ticketData.customerEmail,
    customerName: ticketData.customerName,
    counter,
  };
}

export async function markServed(ticketId, branchId, serviceType) {
  const ticketRef = doc(db, "tickets", ticketId);
  const ticketSnap = await getDoc(ticketRef);
  const ticketData = ticketSnap.data();

  const servedAt = new Date();
  const calledAt = ticketData.calledAt?.toDate();
  const serviceMs = calledAt ? servedAt - calledAt : null;

  await updateDoc(ticketRef, {
    status: "served",
    servedAt: serverTimestamp(),
  });

  const queueRef = doc(db, "queues", getQueueDocId(branchId, serviceType));
  const queueSnap = await getDoc(queueRef);

  const rawQueueData = queueSnap.exists() ? queueSnap.data() : {};
  const queueData = getQueueDataWithDailyReset(rawQueueData);

  const updateData = {
    latestCalledTicket: "—",
  };

  if (serviceMs != null) {
    const serviceMinutes = serviceMs / 60000;

    const newTotalService =
      (queueData.totalServiceMinutesToday ?? 0) + serviceMinutes;
    const newServiceCount = (queueData.serviceSampleCountToday ?? 0) + 1;

    updateData.totalServiceMinutesToday = newTotalService;
    updateData.serviceSampleCountToday = newServiceCount;
    updateData.avgServiceTimeToday = Math.round(
      newTotalService / newServiceCount,
    );
    updateData.servedCountToday = (queueData.servedCountToday ?? 0) + 1;
  }

  if (queueData.lastResetDate !== rawQueueData.lastResetDate) {
    Object.assign(updateData, {
      totalWaitMinutesToday: queueData.totalWaitMinutesToday ?? 0,
      waitSampleCountToday: queueData.waitSampleCountToday ?? 0,
      avgWaitTimeToday: queueData.avgWaitTimeToday ?? 0,

      totalServiceMinutesToday:
        updateData.totalServiceMinutesToday ??
        queueData.totalServiceMinutesToday ??
        0,
      serviceSampleCountToday:
        updateData.serviceSampleCountToday ??
        queueData.serviceSampleCountToday ??
        0,
      avgServiceTimeToday:
        updateData.avgServiceTimeToday ?? queueData.avgServiceTimeToday ?? 0,

      servedCountToday:
        updateData.servedCountToday ?? queueData.servedCountToday ?? 0,
      lastResetDate: queueData.lastResetDate,
    });
  }

  await setDoc(queueRef, updateData, { merge: true });
}

export async function markNoShow(ticketId) {
  const ticketRef = doc(db, "tickets", ticketId);
  const ticketSnap = await getDoc(ticketRef);
  const ticketData = ticketSnap.data();

  await updateDoc(ticketRef, {
    status: "noshow",
  });

  const queueRef = doc(
    db,
    "queues",
    getQueueDocId(ticketData.branchId, ticketData.serviceType),
  );

  await setDoc(
    queueRef,
    {
      latestCalledTicket: "—",
    },
    { merge: true },
  );
}

// ─── Realtime listeners ──────────────────────────────────────────────────────

export function listenToTicket(ticketId, callback) {
  return onSnapshot(doc(db, "tickets", ticketId), (snap) => {
    if (snap.exists()) callback({ ticketId: snap.id, ...snap.data() });
  });
}

export function listenToQueue(branchId, serviceType, callback) {
  const queueDocId = getQueueDocId(branchId, serviceType);

  return onSnapshot(doc(db, "queues", queueDocId), (snap) => {
    const rawQueueData = snap.exists() ? snap.data() : {};
    const queueData = getQueueDataWithDailyReset(rawQueueData);
    callback(queueData);
  });
}

export function listenToWaitingTickets(branchId, serviceType, callback) {
  // Only listen to today's waiting tickets
  const q = query(
    collection(db, "tickets"),
    where("branchId", "==", branchId),
    where("serviceType", "==", serviceType),
    where("status", "==", "waiting"),
    where("joinedAt", ">=", getTodayStart()),
    orderBy("joinedAt", "asc"),
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}
