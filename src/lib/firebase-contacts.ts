/**
 * Firebase Contacts Functions
 * CRUD operations for contacts sub-collection under users
 * Path: users/{userDocId}/contacts
 */

import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  where,
} from "firebase/firestore";
import { db } from "./firebase";
import { queryDocuments } from "./firebase-db";

// ==================== TYPE ====================

export interface ContactData {
  id: string;
  avatarName: string;
  bankAccounts: {
    accountNumber: string;
    bankLogo: string;
    bankName: string;
  }[];
  description: string;
  name: string;
  phoneNumber: string;
  userId: string;
}

// ==================== HELPERS ====================

/**
 * Get the Firestore document ID for a user by their auth UID
 */
const getUserDocId = async (uid: string): Promise<string> => {
  const users = await queryDocuments("users", [where("uid", "==", uid)]);
  if (users.length === 0) {
    throw new Error("User document not found");
  }
  return users[0].id;
};

// ==================== CRUD ====================

/**
 * Get all contacts for a user
 * Path: users/{userDocId}/contacts
 */
export const getContacts = async (uid: string): Promise<ContactData[]> => {
  try {
    const userDocId = await getUserDocId(uid);
    const contactsRef = collection(db, "users", userDocId, "contacts");
    const snapshot = await getDocs(contactsRef);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      avatarName: doc.data().avatarName || "",
      bankAccounts: doc.data().bankAccounts || [],
      description: doc.data().description || "",
      name: doc.data().name || "",
      phoneNumber: doc.data().phoneNumber || "",
      userId: doc.data().userId || "",
    }));
  } catch (error) {
    console.error("Error fetching contacts:", error);
    throw error;
  }
};

/**
 * Add a new contact
 * Path: users/{userDocId}/contacts
 */
export const addContact = async (
  uid: string,
  data: Omit<ContactData, "id">
): Promise<string> => {
  try {
    const userDocId = await getUserDocId(uid);
    const contactsRef = collection(db, "users", userDocId, "contacts");
    const docRef = await addDoc(contactsRef, {
      ...data,
      createdAt: new Date(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding contact:", error);
    throw error;
  }
};

/**
 * Update an existing contact
 * Path: users/{userDocId}/contacts/{contactId}
 */
export const updateContact = async (
  uid: string,
  contactId: string,
  data: Partial<Omit<ContactData, "id">>
): Promise<void> => {
  try {
    const userDocId = await getUserDocId(uid);
    const contactRef = doc(db, "users", userDocId, "contacts", contactId);
    await updateDoc(contactRef, {
      ...data,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error("Error updating contact:", error);
    throw error;
  }
};

/**
 * Delete a contact
 * Path: users/{userDocId}/contacts/{contactId}
 */
export const deleteContact = async (
  uid: string,
  contactId: string
): Promise<void> => {
  try {
    const userDocId = await getUserDocId(uid);
    const contactRef = doc(db, "users", userDocId, "contacts", contactId);
    await deleteDoc(contactRef);
  } catch (error) {
    console.error("Error deleting contact:", error);
    throw error;
  }
};
