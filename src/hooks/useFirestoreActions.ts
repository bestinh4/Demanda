/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '@/src/services/firebase';
import { toast } from 'sonner';

export function useFirestoreActions<T>(collectionPath: string) {
  const [loading, setLoading] = useState(false);

  const add = async (data: any) => {
    setLoading(true);
    try {
      const docRef = await addDoc(collection(db, collectionPath), {
        ...data,
        createdAt: Date.now(),
      });
      toast.success('Registro criado com sucesso!');
      return docRef.id;
    } catch (error) {
      console.error('Error adding document:', error);
      toast.error('Erro ao criar registro.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const update = async (id: string, data: any) => {
    setLoading(true);
    try {
      await updateDoc(doc(db, collectionPath, id), data);
      toast.success('Registro atualizado com sucesso!');
    } catch (error) {
      console.error('Error updating document:', error);
      toast.error('Erro ao atualizar registro.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id: string) => {
    setLoading(true);
    try {
      await deleteDoc(doc(db, collectionPath, id));
      toast.success('Registro removido com sucesso!');
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Erro ao remover registro.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { add, update, remove, loading };
}
