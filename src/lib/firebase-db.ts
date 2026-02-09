import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  Query,
  QueryConstraint,
} from "firebase/firestore";
import { db } from "./firebase";

/**
 * Add a document to Firestore
 */
export const addDocument = async (
  collectionName: string,
  data: Record<string, any>
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, collectionName), {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding document:", error);
    throw error;
  }
};

/**
 * Get a single document from Firestore
 */
export const getDocument = async (
  collectionName: string,
  docId: string
): Promise<Record<string, any> | null> => {
  try {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error("Error getting document:", error);
    throw error;
  }
};

/**
 * Get all documents from a collection
 */
export const getDocuments = async (
  collectionName: string
): Promise<Record<string, any>[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, collectionName));
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting documents:", error);
    throw error;
  }
};

/**
 * Query documents from Firestore
 */
export const queryDocuments = async (
  collectionName: string,
  constraints: QueryConstraint[]
): Promise<Record<string, any>[]> => {
  try {
    const q = query(collection(db, collectionName), ...constraints);
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error querying documents:", error);
    throw error;
  }
};

/**
 * Update a document in Firestore
 */
export const updateDocument = async (
  collectionName: string,
  docId: string,
  data: Record<string, any>
): Promise<void> => {
  try {
    const docRef = doc(db, collectionName, docId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error("Error updating document:", error);
    throw error;
  }
};

/**
 * Delete a document from Firestore
 */
export const deleteDocument = async (
  collectionName: string,
  docId: string
): Promise<void> => {
  try {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting document:", error);
    throw error;
  }
};
