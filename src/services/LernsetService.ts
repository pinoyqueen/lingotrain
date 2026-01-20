// src/services/LernsetService.ts
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

const setCollection = collection(db, 'Set')

/* ======================
   CREATE
====================== */
export async function createLernset(l: Lernset) {
  return await addDoc(setCollection, {
    name: l.name,
    beschreibung: l.beschreibung,
    isPublic: l.isPublic,
    ownerId: l.ownerId,
    zielspracheId: l.zielspracheId
  })
}

/* ======================
   DELETE (inkl. Owner-Check)
====================== */
export async function deleteLernset(
  lernsetId: string,
  kontoId: string
) {
  const ref = doc(db, 'Set', lernsetId)
  const snap = await getDoc(ref)

  if (!snap.exists()) {
    throw new Error('Lernset kann nicht gelöscht werden, weil es nicht gefunden wurde!')
  }

  if (snap.data().ownerId !== kontoId) {
    throw new Error('Lernset gehört nicht dem Benutzer!')
  }

  await deleteDoc(ref)
}

/* ======================
   FIND ALL (by owner)
====================== */
export async function findAllLernsets(
  kontoId: string
): Promise<Lernset[]> {
  const q = query(setCollection, where('ownerId', '==', kontoId))
  const snapshot = await getDocs(q)

  return snapshot.docs.map(docSnap => ({
    id: docSnap.id,
    ...(docSnap.data() as Omit<Lernset, 'id'>)
  }))
}

/* ======================
   FIND BY ID
====================== */
export async function findLernsetById(
  lernsetId: string
): Promise<Lernset | null> {
  const snap = await getDoc(doc(db, 'Set', lernsetId))

  if (!snap.exists()) return null

  return {
    id: snap.id,
    ...(snap.data() as Omit<Lernset, 'id'>)
  }
}

/* ======================
   FIND ALL IDS BY KONTO
====================== */
export async function findAllIdsByKonto(
  kontoId: string
): Promise<string[]> {
  const q = query(setCollection, where('ownerId', '==', kontoId))
  const snapshot = await getDocs(q)

  return snapshot.docs.map(d => d.id)
}

/* ======================
   FIND ALL IDS BY KONTO + SPRACHE
====================== */
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

/* ======================
   EDIT
====================== */
export async function editLernset(
  ownerId: string,
  l: Lernset
) {
  
  if (!l.id) {
    throw new Error('Lernset ID fehlt!')
  }

  const ref = doc(db, 'Set', l.id)

  await updateDoc(ref, {
    name: l.name,
    beschreibung: l.beschreibung,
    isPublic: l.isPublic,
    ownerId: l.ownerId,
    zielspracheId: l.zielspracheId
  })
}
