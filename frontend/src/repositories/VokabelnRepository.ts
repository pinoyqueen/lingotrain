import { db } from './firebase'
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  writeBatch
} from 'firebase/firestore'
import type { Vokabeln } from '@/models/Vokabeln'

const COLLECTION_NAME = 'Vokabeln'
const vokabelnCollection = collection(db, COLLECTION_NAME)

/* ======================
   CREATE
====================== */
export async function createVokabeln(v: Vokabeln) {
  return await addDoc(vokabelnCollection, {
    vokabel: v.vokabel,
    uebersetzung: v.uebersetzung,
    beschreibung: v.beschreibung,
    isWort: v.isWort,
    setId: v.setId
  })
}

/* ======================
   DELETE
====================== */
export async function deleteVokabel(
  vokabelnId: string
) {
  const ref = doc(db, COLLECTION_NAME, vokabelnId)
  const snap = await getDoc(ref)

  if (!snap.exists()) {
    throw new Error('Vokabeln kann nicht gelöscht werden, weil es nicht gefunden wurde!')
  }

  await deleteDoc(ref)
}

/* ======================
   ALLE VOKABELNEINTRÄGE LÖSCHEN, DIE ZU EINEM BESTIMMTEN LERNSET GEHÖREN
====================== */
export async function deleteAllVokabelnByLernsetId(lernsetId: string) {
    const q = query(
      vokabelnCollection,
      where("setId", "==", lernsetId)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) return;

    const batch = writeBatch(db);

    snapshot.forEach(docSnap => {
      batch.delete(docSnap.ref);
    });

    await batch.commit();
  }


/* ======================
   FIND ALL 
====================== */
export async function findAllVokabelnByLernsetId(lernsetId: string): Promise<Vokabeln[]> {
  const q = query(vokabelnCollection, where('setId', '==', lernsetId))
  const snapshot = await getDocs(q)

  return snapshot.docs.map(docSnap => ({
    id: docSnap.id,
    ...(docSnap.data() as Omit<Vokabeln, 'id'>)
  }))
}

/* ======================
   EDIT
====================== */
export async function editVokabeln(v: Vokabeln) {
  
  if (!v.id) {
    throw new Error('Lernset ID fehlt!')
  }

  const ref = doc(db, COLLECTION_NAME, v.id)

  await updateDoc(ref, {
    vokabel: v.vokabel,
    uebersetzung: v.uebersetzung,
    beschreibung: v.beschreibung,
    isWort: v.isWort,
    setId: v.setId
  })
}


