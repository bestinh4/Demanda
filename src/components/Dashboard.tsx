/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Trophy, Shield, Users, Calendar } from 'lucide-react';
import { Card } from '@/src/components/ui/Card';
import { useFirestore } from '@/src/hooks/useFirestore';
import { Athlete, Team, Match } from '@/src/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from './ui/Badge';

export const Dashboard = () => {
  const { data: athletes } = useFirestore<Athlete>('athletes');
  const { data: teams } = useFirestore<Team>('teams');
  const { data: matches } = useFirestore<Match>('matches');

  const stats = [
    { label: 'Total de Atletas', value: athletes.length, icon: Users, color: 'bg-blue-500' },
    { label: 'Times Registrados', value: teams.length, icon: Shield, color: 'bg-indigo-500' },
    { label: 'Partidas Agendadas', value: matches.filter(m => m.status === 'Agendada').length, icon: Calendar, color: 'bg-emerald-500' },
    { label: 'Gols Marcados', value: athletes.reduce((acc, a) => acc + (a.stats?.goals || 0), 0), icon: Trophy, color: 'bg-amber-500' },
  ];

  const recentMatches = [...matches]
    .sort((a, b) => b.date - a.date)
    .slice(0, 5);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
        <p className="text-slate-500">Bem-vindo ao Arena Manager. Aqui está o resumo da sua liga.</p>
      </header>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-0">
            <div className="flex items-center gap-4 p-6">
              <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl text-white', stat.color)}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card title="Partidas Recentes" subtitle="Últimos jogos e próximos confrontos">
          <div className="space-y-4">
            {recentMatches.length > 0 ? (
              recentMatches.map((match) => {
                const homeTeam = teams.find(t => t.id === match.homeTeamId);
                const awayTeam = teams.find(t => t.id === match.awayTeamId);
                return (
                  <div key={match.id} className="flex items-center justify-between rounded-lg border border-slate-100 p-4 transition-colors hover:bg-slate-50">
                    <div className="flex flex-1 items-center justify-end gap-3 text-right">
                      <span className="font-semibold text-slate-900">{homeTeam?.name || 'Time A'}</span>
                      <div className="h-8 w-8 rounded-full bg-slate-100" />
                    </div>
                    <div className="mx-4 flex flex-col items-center gap-1">
                      <div className="flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-1 text-sm font-bold text-white">
                        <span>{match.homeScore}</span>
                        <span className="text-slate-500">-</span>
                        <span>{match.awayScore}</span>
                      </div>
                      <span className="text-[10px] uppercase tracking-wider text-slate-400">
                        {format(match.date, 'dd/MM HH:mm', { locale: ptBR })}
                      </span>
                    </div>
                    <div className="flex flex-1 items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-slate-100" />
                      <span className="font-semibold text-slate-900">{awayTeam?.name || 'Time B'}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="py-8 text-center text-sm text-slate-500">Nenhuma partida registrada.</p>
            )}
          </div>
        </Card>

        <Card title="Top Artilheiros" subtitle="Atletas com mais gols na temporada">
          <div className="space-y-4">
            {[...athletes]
              .sort((a, b) => (b.stats?.goals || 0) - (a.stats?.goals || 0))
              .slice(0, 5)
              .map((athlete, index) => (
                <div key={athlete.id} className="flex items-center justify-between rounded-lg border border-slate-100 p-4 transition-colors hover:bg-slate-50">
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-bold text-slate-300">#{index + 1}</span>
                    <div>
                      <p className="font-semibold text-slate-900">{athlete.name}</p>
                      <p className="text-xs text-slate-500">{athlete.position}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="success" className="px-3 py-1">
                      {athlete.stats?.goals || 0} Gols
                    </Badge>
                  </div>
                </div>
              ))}
            {athletes.length === 0 && (
              <p className="py-8 text-center text-sm text-slate-500">Nenhum atleta registrado.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

// Helper for cn in Dashboard
import { cn } from '@/src/lib/utils';
