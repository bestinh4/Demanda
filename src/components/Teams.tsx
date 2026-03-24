/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Plus, Search, Shield, Edit2, Trash2, Users } from 'lucide-react';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Badge } from '@/src/components/ui/Badge';
import { Modal } from '@/src/components/ui/Modal';
import { useFirestore } from '@/src/hooks/useFirestore';
import { useFirestoreActions } from '@/src/hooks/useFirestoreActions';
import { Team, Athlete } from '@/src/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const teamSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  coach: z.string().min(3, 'Nome do técnico deve ter pelo menos 3 caracteres'),
  logoUrl: z.string().url('URL do logo inválida').optional().or(z.literal('')),
});

type TeamFormValues = z.infer<typeof teamSchema>;

export const Teams = () => {
  const { data: teams, loading } = useFirestore<Team>('teams');
  const { data: athletes } = useFirestore<Athlete>('athletes');
  const { add, update, remove, loading: actionLoading } = useFirestoreActions<Team>('teams');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<TeamFormValues>({
    resolver: zodResolver(teamSchema),
  });

  const onSubmit = async (values: TeamFormValues) => {
    if (editingTeam) {
      await update(editingTeam.id, values);
    } else {
      await add({
        ...values,
        athletesIds: [],
        stats: { wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0 },
      });
    }
    handleCloseModal();
  };

  const handleEdit = (team: Team) => {
    setEditingTeam(team);
    reset({
      name: team.name,
      coach: team.coach,
      logoUrl: team.logoUrl || '',
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTeam(null);
    reset();
  };

  const filteredTeams = teams.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.coach.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Times</h1>
          <p className="text-slate-500">Gerencie as equipes da sua liga.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Novo Time
        </Button>
      </header>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredTeams.map((team) => {
          const teamAthletes = athletes.filter(a => a.teamId === team.id);
          return (
            <Card
              key={team.id}
              className="group relative overflow-hidden"
              title={team.name}
              subtitle={`Técnico: ${team.coach}`}
              footer={
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Users className="h-4 w-4" />
                    <span className="text-sm font-medium">{teamAthletes.length} Atletas</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(team)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50" onClick={() => remove(team.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              }
            >
              <div className="flex items-center justify-center py-6">
                <div className="relative h-24 w-24 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:scale-110 transition-transform duration-300">
                  {team.logoUrl ? (
                    <img src={team.logoUrl} alt={team.name} className="h-full w-full rounded-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <Shield className="h-12 w-12" />
                  )}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-emerald-50 p-2">
                  <p className="text-xs font-semibold text-emerald-600 uppercase">Vitórias</p>
                  <p className="text-lg font-bold text-emerald-900">{team.stats?.wins || 0}</p>
                </div>
                <div className="rounded-lg bg-amber-50 p-2">
                  <p className="text-xs font-semibold text-amber-600 uppercase">Empates</p>
                  <p className="text-lg font-bold text-amber-900">{team.stats?.draws || 0}</p>
                </div>
                <div className="rounded-lg bg-red-50 p-2">
                  <p className="text-xs font-semibold text-red-600 uppercase">Derrotas</p>
                  <p className="text-lg font-bold text-red-900">{team.stats?.losses || 0}</p>
                </div>
              </div>
            </Card>
          );
        })}
        {filteredTeams.length === 0 && !loading && (
          <div className="col-span-full py-12 text-center text-slate-500">
            Nenhum time encontrado.
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingTeam ? 'Editar Time' : 'Novo Time'}
        footer={
          <>
            <Button variant="outline" onClick={handleCloseModal}>Cancelar</Button>
            <Button onClick={handleSubmit(onSubmit)} loading={actionLoading}>
              {editingTeam ? 'Salvar Alterações' : 'Criar Time'}
            </Button>
          </>
        }
      >
        <form className="space-y-4">
          <Input
            label="Nome do Time"
            placeholder="Ex: Real Madrid"
            {...register('name')}
            error={errors.name?.message}
          />
          <Input
            label="Técnico"
            placeholder="Ex: Carlo Ancelotti"
            {...register('coach')}
            error={errors.coach?.message}
          />
          <Input
            label="URL do Logo (Opcional)"
            placeholder="https://exemplo.com/logo.png"
            {...register('logoUrl')}
            error={errors.logoUrl?.message}
          />
        </form>
      </Modal>
    </div>
  );
};
