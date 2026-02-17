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
  updateDoc
} from 'firebase/firestore'
import type { Lernset } from '@/models/Lernset'
import { deleteAllVokabelnByLernsetId } from "@/repositories/VokabelnRepository";

const COLLECTION_NAME = 'Set'
const setCollection = collection(db, COLLECTION_NAME)

/**
 * Erstellt ein neues Lernset-Dokument in Firestore.
 * 
 * @param l Das Lernset-Objekt (ohne ID), das gespeichert werden soll.
 * @returns Promise mit der Referenz auf das neu angelegte Dokument.
 */
export async function createLernset(l: Lernset) {
  return await addDoc(setCollection, {
    name: l.name,
    beschreibung: l.beschreibung,
    isPublic: l.isPublic,
    ownerId: l.ownerId,
    zielspracheId: l.zielspracheId
  })
}

/**
 * Löscht ein Lernset, sofern der anfragende Benutzer der Owner ist.
 * Zusätzlich werden alle zugehörigen Vokabeln entfernt.
 * 
 * @param lernsetId Id des zu löschenden Lernsets
 * @param kontoId Id des anfragenden Benutzers
 */
export async function deleteLernset(
  lernsetId: string,
  kontoId: string
) {
  const ref = doc(db, COLLECTION_NAME, lernsetId)
  const snap = await getDoc(ref)

  if (!snap.exists()) {
    throw new Error('Lernset kann nicht gelöscht werden, weil es nicht gefunden wurde!')
  }

  if (snap.data().ownerId !== kontoId) {
    throw new Error('Lernset gehört nicht dem Benutzer!')
  }

  // Alle Vokabeln zu diesem Lernset löschen
  await deleteAllVokabelnByLernsetId(lernsetId);

  await deleteDoc(ref)
}

/**
 * Liefert alle Lernsets eines Owners in einer bestimmten Zielsprache.
 * 
 * @param kontoId Owner-Id
 * @param aktuelleSprache Id der Zielsprache, nach der gefiltert wird
 * @returns Promise<Lernset[]> - Liste der Lernsets
 */
export async function findAllLernsets(
  kontoId: string,
  aktuelleSprache: string
): Promise<Lernset[]> {
  const q = query(
    setCollection,
    where('ownerId', '==', kontoId),
    where('zielspracheId', '==', aktuelleSprache)
  );
  const snapshot = await getDocs(q)

  return snapshot.docs.map(docSnap => ({
    id: docSnap.id,
    ...(docSnap.data() as Omit<Lernset, 'id'>)
  }))
}

/**
 * Holt ein einzelnes Lernset anhand seiner Dokument-Id.
 * 
 * @param lernsetId Id des Lernsets
 * @returns Promise<Lernset | null> - Lernset mit id oder null, wenn nicht gefunden
 */
export async function findLernsetById(
  lernsetId: string
): Promise<Lernset | null> {
  const snap = await getDoc(doc(db, COLLECTION_NAME, lernsetId))

  if (!snap.exists()) return null

  return {
    id: snap.id,
    ...(snap.data() as Omit<Lernset, 'id'>)
  }
}

/**
 * Liefert nur die Ids aller Lernsets eines Owners.
 * 
 * @param kontoId Owner-Id
 * @returns Promise<string[]> - Liste der Dokument-ids
 */
export async function findAllIdsByKonto(
  kontoId: string
): Promise<string[]> {
  const q = query(setCollection, where('ownerId', '==', kontoId))
  const snapshot = await getDocs(q)

  return snapshot.docs.map(d => d.id)
}

/**
 * Liefert nur die Ids aller Lernsets eines Owners für eine bestimmte Zielsprache.
 * 
 * @param kontoId Owner-Id
 * @param spracheId Id der Zielsprache
 * @returns Promise<string[]> - Liste der Dokument-Ids
 */
export async function findAllIdsByKontoAndSprache(
  kontoId: string,
  spracheId: string
): Promise<string[]> {
  const q = query(
    setCollection,
    where('ownerId', '==', kontoId),
    where('zielspracheId', '==', spracheId)
  )

  const snapshot = await getDocs(q)
  return snapshot.docs.map(d => d.id)
}

/**
 * Aktualisiert ein bestehendes Lernset-Dokument.
 * 
 * @param l Lernset mit gültiger Id und gewünschten Änderungen
 */
export async function editLernset(
  l: Lernset
) {
  
  if (!l.id) {
    throw new Error('Lernset ID fehlt!')
  }

  const ref = doc(db, COLLECTION_NAME, l.id)

  await updateDoc(ref, {
    name: l.name,
    beschreibung: l.beschreibung,
    isPublic: l.isPublic,
    ownerId: l.ownerId,
    zielspracheId: l.zielspracheId
  })
}
