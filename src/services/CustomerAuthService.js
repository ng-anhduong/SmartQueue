import { auth, db } from "@/firebase";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  isSignInWithEmailLink,
  sendSignInLinkToEmail,
  signInWithEmailLink,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

export const PENDING_EMAIL_KEY = "sq_pending_email";
export const PENDING_NAME_KEY = "sq_pending_name";

async function upsertCustomerProfile(user, fallbackName = "", provider = "password") {
  const customerRef = doc(db, "customers", user.uid);
  const existing = await getDoc(customerRef);

  const resolvedName =
    fallbackName ||
    user.displayName ||
    user.email?.split("@")[0] ||
    "Customer";

  const payload = {
    uid: user.uid,
    email: user.email ?? "",
    name: resolvedName,
    provider,
    lastLoginAt: serverTimestamp(),
  };

  if (existing.exists()) {
    await setDoc(customerRef, payload, { merge: true });
  } else {
    await setDoc(
      customerRef,
      {
        ...payload,
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );
  }

  return {
    uid: user.uid,
    email: user.email ?? "",
    name: resolvedName,
    provider,
  };
}

export async function signInWithGoogleCustomer(fallbackName = "") {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  const profile = await upsertCustomerProfile(result.user, fallbackName, "google");

  return {
    user: result.user,
    profile,
  };
}

export async function signOutCustomer() {
  await signOut(auth);
}

export async function sendMagicLink(email, displayName = "", branchId = "", serviceType = "") {
  const actionCodeSettings = {
    url: `${window.location.origin}/customer-details?email=${encodeURIComponent(email)}&branchId=${encodeURIComponent(
      branchId || ""
    )}&serviceType=${encodeURIComponent(serviceType || "")}`,
    handleCodeInApp: true,
  };

  // Store pending data so we can finish sign-in after the link click
  localStorage.setItem(PENDING_EMAIL_KEY, email);
  if (displayName) localStorage.setItem(PENDING_NAME_KEY, displayName);

  await sendSignInLinkToEmail(auth, email, actionCodeSettings);
}

export async function completeMagicLink(url, fallbackEmail = "") {
  if (!isSignInWithEmailLink(auth, url)) return null;

  let email = localStorage.getItem(PENDING_EMAIL_KEY) || fallbackEmail;
  let branchId = "";
  let serviceType = "";
  if (!email) {
    email = "";
  }
  try {
    const params = new URL(url).searchParams;
    email = email || params.get("email") || "";
    branchId = params.get("branchId") || "";
    serviceType = params.get("serviceType") || "";
  } catch {
    /* ignore */
  }

  const displayName = localStorage.getItem(PENDING_NAME_KEY) || "";

  if (!email) {
    throw new Error("No pending email found for sign-in. Please enter your email again.");
  }

  const result = await signInWithEmailLink(auth, email, url);
  const profile = await upsertCustomerProfile(result.user, displayName, "email-link");

  // clean up
  localStorage.removeItem(PENDING_EMAIL_KEY);
  localStorage.removeItem(PENDING_NAME_KEY);

  return {
    user: result.user,
    profile,
    branchId,
    serviceType,
  };
}
