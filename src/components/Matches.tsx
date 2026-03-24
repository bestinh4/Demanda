/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Plus, Search, Trophy, Edit2, Trash2, Calendar, MapPin, Shield } from 'lucide-react';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Select } from '@/src/components/ui/Select';
import { Badge } from '@/src/components/ui/Badge';
import { Modal } from '@/src/components/ui/Modal';
import { useFirestore } from '@/src/hooks/useFirestore';
import { useFirestoreActions } from '@/src/hooks/useFirestoreActions';
import { Match, Team, MatchStatus } from '@/src/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const matchSchema = z.object({
  homeTeamId: z.string().min(1, 'Time da casa é obrigatório'),
  awayTeamId: z.string().min(1, 'Time visitante é obrigatório'),
  homeScore: z.coerce.number().min(0),
  awayScore: z.coerce.number().min(0),
  date: z.string().min(1, 'Data é obrigatória'),
  location: z.string().min(3, 'Local deve ter pelo menos 3 caracteres'),
  status: z.nativeEnum(MatchStatus),
}).refine(data => data.homeTeamId !== data.awayTeamId, {
  message: "Os times devem ser diferentes",
  path: ["awayTeamId"],
});

type MatchFormValues = z.infer<typeof matchSchema>;

export const Matches = () => {
  const { data: matches, loading } = useFirestore<Match>('matches');
  const { data: teams } = useFirestore<Team>('teams');
  const { add, update, remove, loading: actionLoading } = useFirestoreActions<Match>('matches');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<MatchFormValues>({
    resolver: zodResolver(matchSchema) as any,
    defaultValues: {
      status: MatchStatus.SCHEDULED,
      homeScore: 0,
      awayScore: 0,
    }
  });

  const onSubmit = async (values: MatchFormValues) => {
    const matchData = {
      ...values,
      date: new Date(values.date).getTime(),
    };

    if (editingMatch) {
      await update(editingMatch.id, matchData);
    } else {
      await add({
        ...matchData,
        events: [],
      });
    }
    handleCloseModal();
  };

  const handleEdit = (match: Match) => {
    setEditingMatch(match);
    reset({
      homeTeamId: match.homeTeamId,
      awayTeamId: match.awayTeamId,
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      date: format(match.date, "yyyy-MM-dd'T'HH:mm"),
      location: match.location,
      status: match.status,
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMatch(null);
    reset();
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Partidas</h1>
          <p className="text-slate-500">Agende e gerencie os confrontos da liga.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Nova Partida
        </Button>
      </header>

      <div className="space-y-4">
        {matches.map((match) => {
          const homeTeam = teams.find(t => t.id === match.homeTeamId);
          const awayTeam = teams.find(t => t.id === match.awayTeamId);
          
          const statusVariants = {
            [MatchStatus.SCHEDULED]: 'info',
            [MatchStatus.IN_PROGRESS]: 'warning',
            [MatchStatus.FINISHED]: 'success',
            [MatchStatus.CANCELLED]: 'danger',
          };

          return (
            <Card key={match.id} className="p-0 overflow-hidden">
              <div className="flex flex-col sm:flex-row items-stretch">
                <div className="flex-1 p-6 flex items-center justify-between gap-8">
                  <div className="flex flex-1 items-center justify-end gap-4 text-right">
                    <div className="hidden sm:block">
                      <p className="font-bold text-slate-900">{homeTeam?.name || 'Time A'}</p>
                      <p className="text-xs text-slate-500">{homeTeam?.coach || 'Técnico'}</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                      {homeTeam?.logoUrl ? <img src={homeTeam.logoUrl} className="h-full w-full rounded-full object-cover" referrerPolicy="no-referrer" /> : <Shield className="h-6 w-6" />}
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-2">
                    <div className="flex items-center gap-3 rounded-xl bg-slate-900 px-6 py-2 text-2xl font-black text-white shadow-lg">
                      <span>{match.homeScore}</span>
                      <span className="text-slate-500">X</span>
                      <span>{match.awayScore}</span>
                    </div>
                    <Badge variant={statusVariants[match.status] as any}>{match.status}</Badge>
                  </div>

                  <div className="flex flex-1 items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                      {awayTeam?.logoUrl ? <img src={awayTeam.logoUrl} className="h-full w-full rounded-full object-cover" referrerPolicy="no-referrer" /> : <Shield className="h-6 w-6" />}
                    </div>
                    <div className="hidden sm:block">
                      <p className="font-bold text-slate-900">{awayTeam?.name || 'Time B'}</p>
                      <p className="text-xs text-slate-500">{awayTeam?.coach || 'Técnico'}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-6 sm:w-64 border-t sm:border-t-0 sm:border-l border-slate-100 flex flex-col justify-center gap-3">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Calendar className="h-4 w-4" />
                    {format(match.date, "PPP p", { locale: ptBR })}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <MapPin className="h-4 w-4" />
                    {match.location}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(match)}>
                      <Edit2 className="h-4 w-4 mr-2" /> Editar
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-500 hover:bg-red-50" onClick={() => remove(match.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
        {matches.length === 0 && !loading && (
          <div className="py-12 text-center text-slate-500">
            Nenhuma partida agendada.
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingMatch ? 'Editar Partida' : 'Nova Partida'}
        footer={
          <>
            <Button variant="outline" onClick={handleCloseModal}>Cancelar</Button>
            <Button onClick={handleSubmit(onSubmit) as any} loading={actionLoading}>
              {editingMatch ? 'Salvar Alterações' : 'Criar Partida'}
            </Button>
          </>
        }
      >
        <form className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Time da Casa"
              options={[
                { label: 'Selecione...', value: '' },
                ...teams.map(t => ({ label: t.name, value: t.id }))
              ]}
              {...register('homeTeamId')}
              error={errors.homeTeamId?.message}
            />
            <Select
              label="Time Visitante"
              options={[
                { label: 'Selecione...', value: '' },
                ...teams.map(t => ({ label: t.name, value: t.id }))
              ]}
              {...register('awayTeamId')}
              error={errors.awayTeamId?.message}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Gols Casa"
              type="number"
              {...register('homeScore')}
              error={errors.homeScore?.message}
            />
            <Input
              label="Gols Visitante"
              type="number"
              {...register('awayScore')}
              error={errors.awayScore?.message}
            />
          </div>

          <Input
            label="Data e Hora"
            type="datetime-local"
            {...register('date')}
            error={errors.date?.message}
          />

          <Input
            label="Local / Estádio"
            placeholder="Ex: Estádio do Maracanã"
            {...register('location')}
            error={errors.location?.message}
          />

          <Select
            label="Status"
            options={Object.values(MatchStatus).map(s => ({ label: s, value: s }))}
            {...register('status')}
            error={errors.status?.message}
          />
        </form>
      </Modal>
    </div>
  );
};
