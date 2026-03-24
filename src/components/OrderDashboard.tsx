/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { useFirestore } from '@/src/hooks/useFirestore';
import { 
  Package, 
  ShoppingCart, 
  Truck, 
  Clock, 
  MapPin, 
  Layers,
  Box,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Users
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

// Mock Data as fallback
const defaultSummary = [
  { statusName: '2.5 - EM CONFERÊNCIA', units: 830, orders: 25, color: '#FF7900', order: 0 },
  { statusName: '03 - PEDIDO LIBERADO PARA EXPEDIÇÃO', units: 437, orders: 8, color: '#000040', order: 1 },
  { statusName: '05 - PEDIDO FATURADO', units: 6143, orders: 274, color: '#f59e0b', order: 2 },
  { statusName: '06 - PEDIDO DESPACHADO', units: 419005, orders: 12597, color: '#6366f1', order: 3 },
];

const defaultClientType = [
  { name: 'INDEPENDENTE', value: 100, color: '#FF7900' },
];

const defaultBilling = [
  { date: '24/03/2026', units: 42164, amount: 992998.89 },
];

const StatCard = ({ title, value, subValue, icon: Icon, color }: any) => (
  <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">{title}</p>
        <h3 className="text-2xl font-black text-slate-900 font-mono">{value.toLocaleString()}</h3>
        {subValue !== undefined && (
          <p className="text-[10px] font-bold text-slate-400 mt-1 flex items-center gap-1">
            <ShoppingCart className="w-3 h-3" /> {subValue.toLocaleString()} Pedidos
          </p>
        )}
      </div>
      <div className={cn("p-3 rounded-xl shadow-lg shadow-slate-100", color)}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </div>
);

const DataTable = ({ title, data, columns, totalLabel, isCurrency }: any) => (
  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex flex-col h-full">
    <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
      <h4 className="text-[10px] font-black text-slate-700 uppercase tracking-[0.15em] flex items-center gap-2">
        <Layers className="w-4 h-4 text-nazaria-orange" /> {title}
      </h4>
    </div>
    <div className="overflow-x-auto flex-1">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="bg-slate-50/50 text-slate-400 font-bold border-b border-slate-100">
            {columns.map((col: any) => (
              <th key={col.key} className="px-4 py-3 uppercase text-[9px] tracking-[0.15em]">{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {data.map((row: any, i: number) => (
            <tr key={i} className="hover:bg-nazaria-orange/5 transition-colors">
              {columns.map((col: any) => (
                <td key={col.key} className={cn(
                  "px-4 py-3 font-bold",
                  col.key === 'value' || col.key === 'units' || col.key === 'amount' ? "font-mono text-nazaria-orange text-right" : "text-slate-600"
                )}>
                  {col.key === 'amount' 
                    ? `R$ ${row[col.key].toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` 
                    : typeof row[col.key] === 'number' ? row[col.key].toLocaleString() : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <div className="bg-nazaria-blue text-white font-black px-4 py-3 flex justify-between items-center">
      <span className="uppercase text-[9px] tracking-[0.2em]">{totalLabel || 'Total Geral'}</span>
      <span className="font-mono text-sm">
        {isCurrency 
          ? `R$ ${data.reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
          : data.reduce((acc: number, curr: any) => acc + (curr.value || curr.units || 0), 0).toLocaleString()}
      </span>
    </div>
  </div>
);

const CustomPieChart = ({ title, data, icon: Icon }: any) => (
  <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col h-full">
    <div className="flex items-center gap-2 mb-6">
      <Icon className="w-4 h-4 text-nazaria-orange" />
      <h4 className="text-[10px] font-black text-slate-700 uppercase tracking-[0.15em]">{title}</h4>
    </div>
    <div className="flex-1 min-h-[180px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={75}
            paddingAngle={8}
            dataKey="value"
            animationBegin={0}
            animationDuration={1500}
          >
            {data.map((entry: any, index: number) => (
              <Cell key={`cell-${index}`} fill={entry.color || '#FF7900'} stroke="none" />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 'bold' }}
          />
          <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}/>
        </PieChart>
      </ResponsiveContainer>
    </div>
  </div>
);

export const OrderDashboard = () => {
  const { data: dbStatus } = useFirestore<any>('expedition_status');
  const { data: dbRegions } = useFirestore<any>('expedition_regions');
  const { data: dbBilling } = useFirestore<any>('expedition_billing');
  const { data: dbClientTypes } = useFirestore<any>('expedition_client_types');

  const statusData = dbStatus.length > 0 ? dbStatus.sort((a, b) => (a.order || 0) - (b.order || 0)) : defaultSummary;
  const billingData = dbBilling.length > 0 ? dbBilling : defaultBilling;
  const clientTypeData = dbClientTypes.length > 0 ? dbClientTypes : defaultClientType;

  const totalUnits = statusData.reduce((acc, curr) => acc + curr.units, 0);
  const totalOrders = statusData.reduce((acc, curr) => acc + curr.orders, 0);

  const currentDate = new Date().toLocaleString('pt-BR', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-900">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="bg-white p-2 rounded-2xl shadow-xl shadow-slate-100 border border-slate-100 h-20 w-40 flex items-center justify-center">
            <img 
              src="./logo.png" 
              alt="Nazária Logo" 
              className="h-full w-auto object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-nazaria-blue uppercase">
              Nazária <span className="text-nazaria-orange font-light">Logística</span>
            </h1>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-[0.3em] flex items-center gap-2 mt-1">
              <Layers className="w-3 h-3 text-nazaria-orange" /> Acompanhamento Demanda de Expedição
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 bg-nazaria-blue px-6 py-3 rounded-2xl border border-white/10 shadow-lg">
          <Clock className="w-4 h-4 text-nazaria-orange" />
          <span className="text-sm font-black text-white font-mono tracking-wider">{currentDate}</span>
        </div>
      </header>

      {/* Summary Table & Stats */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 mb-10">
        <div className="xl:col-span-2">
          <DataTable 
            title="Status da Expedição" 
            data={statusData.map(s => ({ status: s.statusName, units: s.units, orders: s.orders }))} 
            columns={[
              { key: 'status', label: 'Status' },
              { key: 'units', label: 'Unidades' },
              { key: 'orders', label: 'Pedidos' }
            ]}
          />
        </div>
        <div className="grid grid-cols-1 gap-6">
          <StatCard 
            title="Total Unidades" 
            value={totalUnits} 
            icon={Box} 
            color="bg-nazaria-orange" 
          />
          <StatCard 
            title="Total Pedidos" 
            value={totalOrders} 
            icon={ShoppingCart} 
            color="bg-nazaria-blue" 
          />
        </div>
        <CustomPieChart title="Percentual Tipo Cliente" data={clientTypeData} icon={Users} />
      </div>

      {/* Region Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        <DataTable 
          title="Status 2.5 - Em Conferência" 
          data={dbRegions.filter(r => r.statusName === '2.5 - EM CONFERÊNCIA')} 
          columns={[
            { key: 'regionName', label: 'Região' },
            { key: 'value', label: 'Unidades' }
          ]}
        />
        <DataTable 
          title="Status 3 - Liberado para Expedição" 
          data={dbRegions.filter(r => r.statusName === '03 - PEDIDO LIBERADO PARA EXPEDIÇÃO')} 
          columns={[
            { key: 'regionName', label: 'Região' },
            { key: 'value', label: 'Unidades' }
          ]}
        />
        <DataTable 
          title="Faturamento do Dia" 
          data={billingData} 
          columns={[
            { key: 'date', label: 'Data Fat.' },
            { key: 'units', label: 'Unidades NF' },
            { key: 'amount', label: 'Faturamento' }
          ]}
          isCurrency
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm flex flex-col h-full justify-center items-center text-center">
          <div className="bg-blue-50 p-8 rounded-full mb-6">
            <TrendingUp className="w-16 h-16 text-blue-200" />
          </div>
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Unidades STATUS 2.5</h4>
          <p className="text-slate-300 text-[10px] mt-4 font-bold italic uppercase">Aguardando processamento de série histórica</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm flex flex-col h-full justify-center items-center text-center">
          <div className="bg-slate-50 p-8 rounded-full mb-6">
            <MapPin className="w-16 h-16 text-slate-200" />
          </div>
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Unidades STATUS 3</h4>
          <p className="text-slate-300 text-[10px] mt-4 font-bold italic uppercase">Aguardando processamento de série histórica</p>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-16 pt-10 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-6 text-slate-400 text-[9px] font-black uppercase tracking-[0.3em]">
        <div className="flex items-center gap-4">
          <div className="w-12 h-8 bg-white rounded-lg flex items-center justify-center border border-slate-100 p-1">
            <img src="./logo.png" alt="N" className="h-full w-auto object-contain" referrerPolicy="no-referrer" />
          </div>
          <p>© 2026 Nazária Distribuidora Farmacêutica - Expedição</p>
        </div>
        <div className="flex gap-8">
          <span className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-nazaria-orange shadow-lg shadow-nazaria-orange/20" /> Sistema Operacional</span>
          <span className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-200" /> Sincronizado</span>
        </div>
      </footer>
    </div>
  );
};

