/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Plus, Search, MoreVertical, Edit2, Trash2, UserPlus } from 'lucide-react';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Select } from '@/src/components/ui/Select';
import { Badge } from '@/src/components/ui/Badge';
import { Modal } from '@/src/components/ui/Modal';
import { useFirestore } from '@/src/hooks/useFirestore';
import { useFirestoreActions } from '@/src/hooks/useFirestoreActions';
import { Athlete, PlayerPosition, Team } from '@/src/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const athleteSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  position: z.nativeEnum(PlayerPosition),
  teamId: z.string().optional(),
});

type AthleteFormValues = z.infer<typeof athleteSchema>;

export const Athletes = () => {
  const { data: athletes, loading } = useFirestore<Athlete>('athletes');
  const { data: teams } = useFirestore<Team>('teams');
  const { add, update, remove, loading: actionLoading } = useFirestoreActions<Athlete>('athletes');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAthlete, setEditingAthlete] = useState<Athlete | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<AthleteFormValues>({
    resolver: zodResolver(athleteSchema),
    defaultValues: {
      position: PlayerPosition.MIDFIELDER,
    }
  });

  const onSubmit = async (values: AthleteFormValues) => {
    if (editingAthlete) {
      await update(editingAthlete.id, values);
    } else {
      await add({
        ...values,
        stats: { goals: 0, assists: 0, matchesPlayed: 0 },
      });
    }
    handleCloseModal();
  };

  const handleEdit = (athlete: Athlete) => {
    setEditingAthlete(athlete);
    reset({
      name: athlete.name,
      email: athlete.email,
      position: athlete.position,
      teamId: athlete.teamId || '',
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAthlete(null);
    reset();
  };

  const filteredAthletes = athletes.filter(a => 
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Atletas</h1>
          <p className="text-slate-500">Gerencie os jogadores da sua liga.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Novo Atleta
        </Button>
      </header>

      <Card className="overflow-hidden">
        <div className="border-b border-slate-100 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Buscar por nome ou email..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4">Nome</th>
                <th className="px-6 py-4">Posição</th>
                <th className="px-6 py-4">Time</th>
                <th className="px-6 py-4">Gols</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAthletes.map((athlete) => (
                <tr key={athlete.id} className="transition-colors hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                        {athlete.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{athlete.name}</p>
                        <p className="text-xs text-slate-500">{athlete.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="info">{athlete.position}</Badge>
                  </td>
                  <td className="px-6 py-4">
                    {athlete.teamId ? (
                      <span className="font-medium text-slate-700">
                        {teams.find(t => t.id === athlete.teamId)?.name || 'Time não encontrado'}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Sem time</span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900">
                    {athlete.stats?.goals || 0}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(athlete)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50" onClick={() => remove(athlete.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredAthletes.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    Nenhum atleta encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingAthlete ? 'Editar Atleta' : 'Novo Atleta'}
        footer={
          <>
            <Button variant="outline" onClick={handleCloseModal}>Cancelar</Button>
            <Button onClick={handleSubmit(onSubmit)} loading={actionLoading}>
              {editingAthlete ? 'Salvar Alterações' : 'Criar Atleta'}
            </Button>
          </>
        }
      >
        <form className="space-y-4">
          <Input
            label="Nome Completo"
            placeholder="Ex: Cristiano Ronaldo"
            {...register('name')}
            error={errors.name?.message}
          />
          <Input
            label="Email"
            placeholder="exemplo@email.com"
            {...register('email')}
            error={errors.email?.message}
          />
          <Select
            label="Posição"
            options={Object.values(PlayerPosition).map(p => ({ label: p, value: p }))}
            {...register('position')}
            error={errors.position?.message}
          />
          <Select
            label="Time (Opcional)"
            options={[
              { label: 'Sem Time', value: '' },
              ...teams.map(t => ({ label: t.name, value: t.id }))
            ]}
            {...register('teamId')}
            error={errors.teamId?.message}
          />
        </form>
      </Modal>
    </div>
  );
};
