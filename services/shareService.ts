// services/shareService.ts
import {
  addDoc,
  collection,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getDeviceId } from "@/utils/device";

export async function createShareFromLocal() {
  const raw = localStorage.getItem("redeem_app_data");
  if (!raw) throw new Error("No local data");

  const { redeemCode, userList } = JSON.parse(raw);
  const deviceId = getDeviceId();

  const ref = await addDoc(collection(db, "shares"), {
    redeemCode,
    userList,
    ownerDeviceId: deviceId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return ref.id;
}

export async function getShareById(id: string) {
  const snap = await getDoc(doc(db, "shares", id));
  if (!snap.exists()) throw new Error("Share not found");
  return { id: snap.id, ...snap.data() };
}

export async function updateShareIfOwner(
  shareId: string,
  data: { redeemCode: string; userList: any[] }
) {
  const deviceId = getDeviceId();
  const ref = doc(db, "shares", shareId);
  const snap = await getDoc(ref);

  if (!snap.exists()) throw new Error("Share not found");

  if (snap.data().ownerDeviceId !== deviceId) {
    throw new Error("Permission denied");
  }

  await updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}
