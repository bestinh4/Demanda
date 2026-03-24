/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LayoutDashboard, LogIn } from 'lucide-react';
import { Button } from '@/src/components/ui/Button';
import { auth } from '@/src/services/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { toast } from 'sonner';

export const Login = () => {
  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast.success('Login realizado com sucesso!');
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Erro ao realizar login.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-xl animate-in fade-in zoom-in duration-500">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600">
            <LayoutDashboard className="h-10 w-10 text-white" />
          </div>
          <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900 uppercase">Nazária <span className="text-blue-600 font-light">Logística</span></h1>
          <p className="mt-2 text-slate-500">Acompanhamento Demanda de Pedidos em Tempo Real.</p>
        </div>

        <div className="space-y-4 pt-4">
          <Button
            onClick={handleLogin}
            className="w-full h-12 text-lg font-bold"
            variant="primary"
          >
            <LogIn className="mr-3 h-6 w-6" />
            Entrar com Google
          </Button>
          <p className="text-center text-xs text-slate-400">
            Ao entrar, você concorda com nossos termos de serviço e política de privacidade.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="space-y-1">
            <p className="text-xl font-bold text-blue-600">100%</p>
            <p className="text-[10px] uppercase tracking-wider text-slate-400">Cloud Based</p>
          </div>
          <div className="space-y-1">
            <p className="text-xl font-bold text-blue-600">Real-time</p>
            <p className="text-[10px] uppercase tracking-wider text-slate-400">Stats</p>
          </div>
          <div className="space-y-1">
            <p className="text-xl font-bold text-blue-600">Easy</p>
            <p className="text-[10px] uppercase tracking-wider text-slate-400">Management</p>
          </div>
        </div>
      </div>
    </div>
  );
};
