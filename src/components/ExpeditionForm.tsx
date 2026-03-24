/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { useFirestore } from '@/src/hooks/useFirestore';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Plus, Trash2, Save, Edit2, X, Upload, Download, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import { db } from '@/src/services/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { cn } from '@/src/lib/utils';

export const ExpeditionForm = () => {
  const { data: statuses } = useFirestore<any>('expedition_status');
  const { data: regions } = useFirestore<any>('expedition_regions');
  const { data: billing } = useFirestore<any>('expedition_billing');
  const { data: clientTypes } = useFirestore<any>('expedition_client_types');

  const [activeTab, setActiveTab] = useState('status');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isExcel = file.name.endsWith('.xls') || file.name.endsWith('.xlsx');

    if (isExcel) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // Get data as array of arrays to find the header row
          const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
          
          if (rows.length === 0) {
            toast.error('O arquivo está vazio');
            return;
          }

          // Find the header row (look for keywords in the first 10 rows)
          let headerRowIndex = -1;
          const keywords = ['status', 'qtde', 'unid', 'região', 'regiao', 'data', 'valor', 'faturamento', 'pedido'];
          
          for (let i = 0; i < Math.min(rows.length, 10); i++) {
            const row = rows[i];
            if (row && row.some(cell => typeof cell === 'string' && keywords.some(k => cell.toLowerCase().includes(k)))) {
              headerRowIndex = i;
              break;
            }
          }

          // If no header row found, assume it's the first row
          if (headerRowIndex === -1) headerRowIndex = 0;

          // Re-parse from the header row
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { range: headerRowIndex });
          await processImportData(jsonData);
        } catch (error) {
          console.error('Erro ao ler Excel:', error);
          toast.error('Erro ao processar o arquivo Excel. Tente salvar como CSV.');
        }
      };
      reader.readAsBinaryString(file);
    } else {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          if (results.data.length === 0) {
            toast.error('O arquivo está vazio');
            return;
          }
          await processImportData(results.data);
        },
        error: (error) => {
          toast.error(`Erro ao ler arquivo: ${error.message}`);
        }
      });
    }
  };

  const processImportData = async (data: any[]) => {
    try {
      const batch = writeBatch(db);
      let collectionName = '';
      
      // Smart mapping for common header variations
      const mappedData = data.map(item => {
        const newItem: any = {};
        Object.keys(item).forEach(key => {
          const normalizedKey = key.toLowerCase().trim().replace(/\s+/g, ' ');
          
          // Status Mapping
          if (['statusname', 'status', 'descrição', 'desc_status', 'desc. status', 'desc.status', 'situação', 'situacao', 'fase'].includes(normalizedKey)) newItem.statusName = item[key];
          else if (['units', 'unidades', 'qtde', 'quantidade', 'unid', 'qtd', 'unidades nf', 'unid. nf'].includes(normalizedKey)) newItem.units = item[key];
          else if (['orders', 'pedidos', 'qtde pedidos', 'pedidos', 'nº pedidos', 'num pedidos'].includes(normalizedKey)) newItem.orders = item[key];
          
          // Region Mapping
          else if (['regionname', 'região', 'regiao', 'cidade', 'rota', 'filial', 'uf'].includes(normalizedKey)) newItem.regionName = item[key];
          else if (['value', 'valor', 'total', 'soma', 'valor total', 'vlr total'].includes(normalizedKey)) newItem.value = item[key];
          
          // Billing Mapping
          else if (['date', 'data', 'emissão', 'emissao', 'dia'].includes(normalizedKey)) newItem.date = item[key];
          else if (['amount', 'faturamento', 'valor total', 'vlr_total', 'faturado'].includes(normalizedKey)) newItem.amount = item[key];
          
          // Order/Color
          else if (['order', 'ordem', 'sequencia', 'pos'].includes(normalizedKey)) newItem.order = item[key];
          else if (['color', 'cor'].includes(normalizedKey)) newItem.color = item[key];
          
          // Keep original if no mapping found
          else newItem[key] = item[key];
        });
        return newItem;
      });

      if (mappedData.length === 0) {
        toast.error('Nenhum dado encontrado na planilha.');
        return;
      }

      const headers = Object.keys(mappedData[0]);
      console.log('Detected Headers:', headers);
      
      if (headers.includes('statusName') && (headers.includes('units') || headers.includes('orders'))) {
        collectionName = 'expedition_status';
      } else if (headers.includes('regionName') && headers.includes('value')) {
        collectionName = 'expedition_regions';
      } else if (headers.includes('date') && headers.includes('amount')) {
        collectionName = 'expedition_billing';
      } else {
        const foundHeaders = Object.keys(data[0]).join(', ');
        toast.error(`Não identifiquei o tipo de dado. Colunas encontradas: ${foundHeaders}`, { 
          duration: 6000,
          description: 'Certifique-se de que a planilha tem colunas como "Status", "Qtde" ou "Região".'
        });
        return;
      }

      toast.loading(`Importando ${mappedData.length} registros...`, { id: 'import' });

      for (const item of mappedData) {
        const newDocRef = doc(collection(db, collectionName));
        const processedItem = { ...item };
        if (processedItem.units !== undefined) processedItem.units = parseInt(String(processedItem.units)) || 0;
        if (processedItem.orders !== undefined) processedItem.orders = parseInt(String(processedItem.orders)) || 0;
        if (processedItem.value !== undefined) processedItem.value = parseInt(String(processedItem.value)) || 0;
        if (processedItem.amount !== undefined) processedItem.amount = parseFloat(String(processedItem.amount)) || 0;
        if (processedItem.order !== undefined) processedItem.order = parseInt(String(processedItem.order)) || 0;

        batch.set(newDocRef, processedItem);
      }

      await batch.commit();
      toast.success('Importação concluída com sucesso!', { id: 'import' });
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      console.error('Erro na importação:', error);
      toast.error('Erro ao processar a planilha', { id: 'import' });
    }
  };

  const downloadTemplate = () => {
    let csvContent = '';
    let fileName = '';

    if (activeTab === 'status') {
      csvContent = 'statusName,units,orders,color,order\n2.5 - EM CONFERÊNCIA,830,25,#3b82f6,0';
      fileName = 'template_status.csv';
    } else if (activeTab === 'regioes') {
      csvContent = 'statusName,regionName,value\n2.5 - EM CONFERÊNCIA,TERESINA,450';
      fileName = 'template_regioes.csv';
    } else if (activeTab === 'faturamento') {
      csvContent = 'date,units,amount\n24/03/2026,42164,992998.89';
      fileName = 'template_faturamento.csv';
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddStatus = async () => {
    try {
      await addDoc(collection(db, 'expedition_status'), {
        statusName: 'Novo Status',
        units: 0,
        orders: 0,
        color: '#3b82f6',
        order: statuses.length
      });
      toast.success('Status adicionado');
    } catch (e) {
      toast.error('Erro ao adicionar status');
    }
  };

  const handleUpdateStatus = async (id: string, data: any) => {
    try {
      await updateDoc(doc(db, 'expedition_status', id), data);
      toast.success('Status atualizado');
    } catch (e) {
      toast.error('Erro ao atualizar status');
    }
  };

  const handleDeleteStatus = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'expedition_status', id));
      toast.success('Status removido');
    } catch (e) {
      toast.error('Erro ao remover status');
    }
  };

  const handleAddRegion = async () => {
    try {
      await addDoc(collection(db, 'expedition_regions'), {
        statusName: '2.5 - EM CONFERÊNCIA',
        regionName: 'Nova Região',
        value: 0
      });
      toast.success('Região adicionada');
    } catch (e) {
      toast.error('Erro ao adicionar região');
    }
  };

  const handleUpdateRegion = async (id: string, data: any) => {
    try {
      await updateDoc(doc(db, 'expedition_regions', id), data);
      toast.success('Região atualizada');
    } catch (e) {
      toast.error('Erro ao atualizar região');
    }
  };

  const handleDeleteRegion = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'expedition_regions', id));
      toast.success('Região removida');
    } catch (e) {
      toast.error('Erro ao remover região');
    }
  };

  const handleAddBilling = async () => {
    try {
      await addDoc(collection(db, 'expedition_billing'), {
        date: new Date().toLocaleDateString('pt-BR'),
        units: 0,
        amount: 0
      });
      toast.success('Faturamento adicionado');
    } catch (e) {
      toast.error('Erro ao adicionar faturamento');
    }
  };

  const handleUpdateBilling = async (id: string, data: any) => {
    try {
      await updateDoc(doc(db, 'expedition_billing', id), data);
      toast.success('Faturamento atualizado');
    } catch (e) {
      toast.error('Erro ao atualizar faturamento');
    }
  };

  const handleDeleteBilling = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'expedition_billing', id));
      toast.success('Faturamento removido');
    } catch (e) {
      toast.error('Erro ao remover faturamento');
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Alimentar Dados da Expedição</h1>
          <p className="text-slate-500 text-sm">Atualize as informações que alimentam o dashboard em tempo real.</p>
        </div>
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".csv, .xls, .xlsx"
            className="hidden"
          />
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fileInputRef.current?.click()}
            className="border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            <Upload className="w-4 h-4 mr-2" /> Importar Planilha
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={downloadTemplate}
            className="border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            <Download className="w-4 h-4 mr-2" /> Modelo CSV
          </Button>
        </div>
      </header>

      <div className="flex gap-2 border-b border-slate-200 pb-px">
        {['status', 'regioes', 'faturamento', 'clientes'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2 text-sm font-bold uppercase tracking-widest transition-colors border-b-2",
              activeTab === tab 
                ? "border-nazaria-orange text-nazaria-orange" 
                : "border-transparent text-slate-400 hover:text-slate-600"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'status' && (
        <div className="grid gap-4">
          <div className="flex justify-end">
            <Button onClick={handleAddStatus} size="sm" className="bg-nazaria-orange hover:bg-nazaria-orange/90">
              <Plus className="w-4 h-4 mr-2" /> Novo Status
            </Button>
          </div>
          {statuses.sort((a, b) => (a.order || 0) - (b.order || 0)).map((s) => (
            <Card key={s.id} className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                <div className="md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Nome do Status</label>
                  <input
                    type="text"
                    defaultValue={s.statusName}
                    onBlur={(e) => handleUpdateStatus(s.id, { statusName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-nazaria-orange outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Unidades</label>
                  <input
                    type="number"
                    defaultValue={s.units}
                    onBlur={(e) => handleUpdateStatus(s.id, { units: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-nazaria-orange outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Pedidos</label>
                  <input
                    type="number"
                    defaultValue={s.orders}
                    onBlur={(e) => handleUpdateStatus(s.id, { orders: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-nazaria-orange outline-none"
                  />
                </div>
                <div className="flex justify-end">
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteStatus(s.id)} className="text-red-500 hover:bg-red-50">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'regioes' && (
        <div className="grid gap-4">
          <div className="flex justify-end">
            <Button onClick={handleAddRegion} size="sm" className="bg-nazaria-orange hover:bg-nazaria-orange/90">
              <Plus className="w-4 h-4 mr-2" /> Nova Região
            </Button>
          </div>
          {regions.map((r) => (
            <Card key={r.id} className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Status</label>
                  <select
                    defaultValue={r.statusName}
                    onChange={(e) => handleUpdateRegion(r.id, { statusName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-nazaria-orange outline-none"
                  >
                    <option value="2.5 - EM CONFERÊNCIA">2.5 - EM CONFERÊNCIA</option>
                    <option value="03 - PEDIDO LIBERADO PARA EXPEDIÇÃO">03 - PEDIDO LIBERADO PARA EXPEDIÇÃO</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Região</label>
                  <input
                    type="text"
                    defaultValue={r.regionName}
                    onBlur={(e) => handleUpdateRegion(r.id, { regionName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-nazaria-orange outline-none"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Valor</label>
                    <input
                      type="number"
                      defaultValue={r.value}
                      onBlur={(e) => handleUpdateRegion(r.id, { value: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-nazaria-orange outline-none"
                    />
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteRegion(r.id)} className="text-red-500 hover:bg-red-50 mt-5">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'faturamento' && (
        <div className="grid gap-4">
          <div className="flex justify-end">
            <Button onClick={handleAddBilling} size="sm" className="bg-nazaria-orange hover:bg-nazaria-orange/90">
              <Plus className="w-4 h-4 mr-2" /> Novo Faturamento
            </Button>
          </div>
          {billing.map((b) => (
            <Card key={b.id} className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Data</label>
                  <input
                    type="text"
                    defaultValue={b.date}
                    onBlur={(e) => handleUpdateBilling(b.id, { date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-nazaria-orange outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Unidades NF</label>
                  <input
                    type="number"
                    defaultValue={b.units}
                    onBlur={(e) => handleUpdateBilling(b.id, { units: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-nazaria-orange outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Faturamento (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    defaultValue={b.amount}
                    onBlur={(e) => handleUpdateBilling(b.id, { amount: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-nazaria-orange outline-none"
                  />
                </div>
                <div className="flex justify-end">
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteBilling(b.id)} className="text-red-500 hover:bg-red-50">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
