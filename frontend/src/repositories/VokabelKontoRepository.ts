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
  writeBatch,
  limit,
  DocumentReference,
  DocumentSnapshot,
  QueryDocumentSnapshot,
  type DocumentData
} from 'firebase/firestore'
import type { VokabelKonto } from '@/models/VokabelKonto'
import { VOKABELN_STATUS, type VokabelnStatus } from '@/models/VokabelnStatus'
import type { Vokabeln } from '@/models/Vokabeln'

const VOKABELN_COLLECTION = 'Vokabeln'
const VK_COLLECTION = 'VokabelKonto'
const vokabelnCollection = collection(db, VOKABELN_COLLECTION)
const vkCollection = collection(db, VK_COLLECTION)

/* ======================
   CREATE
====================== */
export async function create(vk: VokabelKonto) {
    console.log("VK created")
    const vokabelRef = doc(db, VOKABELN_COLLECTION, vk.vokabelId)
    return await addDoc(vkCollection, {
        vokabelId: vk.vokabelId,
        kontoId: vk.kontoId,
        status: vk.status,
        lernsetId: vk.lernsetId,
        vokabelRef
    })
}

/* ======================
   STATUS AKTUALISIEREN
====================== */
export async function updateStatus(kontoId: string, vokabelId: string, status: VokabelnStatus): Promise<void> {
    const q = query(vkCollection,
        where('vokabelId', '==', vokabelId),
        where('kontoId', '==', kontoId),
        limit(1)
    )
    
    
    const snap = await getDocs(q)
    const doc0 = snap.docs[0]

    if (!doc0) {
        throw new Error('VokabelKonto nicht gefunden')
    }

    await updateDoc(doc0.ref, { status })

}

export async function getAllVokabelnForTraining(lernsetId: string, kontoId: string): Promise<Vokabeln[]> {
    const q = query(
        vkCollection,
        where('kontoId', '==', kontoId),
        where('lernsetId', '==', lernsetId),
        where('status', 'in', [VOKABELN_STATUS.NICHT_GELERNT, VOKABELN_STATUS.FALSCH])
    )

    const snap = await getDocs(q)

    // wenn alles gelernt -> Status zurücksetzen
    if(snap.empty) {
        await resetAndReload(kontoId, lernsetId)
        return getAllVokabelnForTraining(lernsetId, kontoId)
    }

    const vokTasks = snap.docs.map(async (vkDoc) => {
        const data = vkDoc.data() as any
        const ref: DocumentReference | undefined = data?.vokabelRef
        const vokabelId: string | undefined = data?.vokabelId

        let vSnap: DocumentSnapshot | null = null

        if (ref) {
            vSnap = await getDoc(ref)
        } else if (vokabelId) {
            vSnap = await getDoc(doc(db, VOKABELN_COLLECTION, vokabelId))
        }

        if (!vSnap || !vSnap.exists())  return null

        return mapVokabelDoc(vSnap)
    })

    const resolved = await Promise.all(vokTasks)
    return resolved.filter(Boolean) as Vokabeln[]
    
}
async function resetAndReload(kontoId: string, lernsetId: string): Promise<void> {
    const qAll = query(
        vkCollection,
        where('kontoId', '==', kontoId),
        where('lernsetId', '==', lernsetId)
    )

    const snap = await getDocs(qAll)

    if (snap.empty) return

    const batch = writeBatch(db)
    snap.docs.forEach((d) => {
        batch.update(d.ref, {status: VOKABELN_STATUS.NICHT_GELERNT})
    })
    await batch.commit()

}

export async function deleteVK(kontoId: string, vokabelId: string): Promise<void> {
    const q = query(
        vkCollection,
        where('vokabelId', '==', vokabelId),
        where('kontoId', '==', kontoId),
        limit(1)
    )

    const snap = await getDocs(q)
    const doc0 = snap.docs[0]

    if (!doc0)
        throw new Error('Vokabelkonto nicht gefunden')

    await deleteDoc(doc0.ref)
}

function mapVokabelDoc(docSnap: DocumentSnapshot): Vokabeln {
    const d = docSnap.data() as any
    
    return {
        id: docSnap.id,
        vokabel: d?.vokabel ?? '',
        uebersetzung: d?.uebersetzung ?? undefined,
        beschreibung: d?.beschreibung ?? undefined,
        setId: d?.setId ?? undefined,
        isWort: Boolean(d?.isWort),
    }

}

