import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  documentId
} from "firebase/firestore"

import type { Abzeichen } from "@/models/Abzeichen"
import { db } from "./firebase"; 

const ABZEICHEN_COLLECTIION = "Abzeichen"
const abzeichenCollection = collection(db, ABZEICHEN_COLLECTIION)

/**
 * Lädt mehrere Abzeichen anhand einer Liste von IDs
 */
export async function findByIds(ids: string[]): Promise<Abzeichen[]> {
    if (!ids || ids.length === 0) {
        return []
    }

    const q = query(
        abzeichenCollection,
        where(documentId(), "in", ids)
    )

    const snapshot = await getDocs(q)

    return snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
    } as Abzeichen))
}

/**
 * Lädt ein einzelnes Abzeichen anhand seiner ID
 */
export async function findById(id: string): Promise<Abzeichen | null> {
    const docRef = doc(abzeichenCollection, id)
    const snapshot = await getDoc(docRef)

    if (!snapshot.exists()) {
        return null
    }

    return {
        id: snapshot.id,
        ...snapshot.data()
    } as Abzeichen
}

/**
 * Lädt alle Abzeichen
 */
export async function findAll(): Promise<Abzeichen[]> {
    const snapshot = await getDocs(abzeichenCollection)

    return snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
    } as Abzeichen))
}
