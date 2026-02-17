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

/**
 * Erstellt eine neue Vokabel in Firestore.
 * 
 * @param v Vokabel-Objekt, das gespeichert werden soll
 * @returns Promise mit dem Dokument-Ref der neuen Vokabel
 */
export async function createVokabeln(v: Vokabeln) {
  return await addDoc(vokabelnCollection, {
    vokabel: v.vokabel,
    uebersetzung: v.uebersetzung,
    beschreibung: v.beschreibung,
    isWort: v.isWort,
    setId: v.setId
  })
}

/**
 * Löscht eine einzelne Vokabel anhand ihrer Id.
 * @param vokabelnId Id der zu löschenden Vokabel
 */
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


/**
 * Löscht alle Vokabeln, die zu einem bestimmten Lernset gehören.
 * 
 * @param lernsetId Id des zugehörigen Lernsets
 * @returns Promise<void>
 */
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


/**
 * Holt alle Vokabeln, die einem bestimmten Lernset zugeordnet sind.
 * 
 * @param lernsetId Id des Lernsets
 * @returns Promise<Vokabeln[]> - Liste der Vokabeln
 */
export async function findAllVokabelnByLernsetId(lernsetId: string): Promise<Vokabeln[]> {
  const q = query(vokabelnCollection, where('setId', '==', lernsetId))
  const snapshot = await getDocs(q)

  return snapshot.docs.map(docSnap => ({
    id: docSnap.id,
    ...(docSnap.data() as Omit<Vokabeln, 'id'>)
  }))
}

/**
 * Aktualisiert eine existierende Vokabel.
 * 
 * @param v Vokabeln-Objekt mit gültiger Id und den neuen Werten.
 */
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


