'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, 
  UploadCloud, 
  CheckCircle2, 
  AlertTriangle, 
  FileSpreadsheet, 
  Download, 
  Sliders, 
  ShieldCheck, 
  DollarSign, 
  TrendingUp, 
  Calculator, 
  Copy, 
  Check, 
  RotateCcw,
  Sparkles,
  Info
} from 'lucide-react';
import { CFDIInvoice, MonthlyTaxSummary } from '../lib/types';
import { extractCFDIsFromZip, parseMultipleXMLFiles } from '../lib/zipExtractor';
import { 
  computeMonthlyDeclaration, 
  evaluateDeductibility, 
  HistoricalBalances 
} from '../lib/taxCalculator';
import { 
  loadHistoricalBalances, 
  saveHistoricalBalances, 
  DEFAULT_BALANCES_2026 
} from '../lib/storage';
import { exportWorkpaperExcel, exportMarkdownReport, downloadTextFile } from '../lib/reportExporter';

export default function Home() {
  const [year, setYear] = useState<number>(2026);
  const [month, setMonth] = useState<number>(9);
  const [activeTab, setActiveTab] = useState<'summary' | 'issued' | 'received' | 'sat_guide' | 'settings'>('summary');
  
  // Historical balances
  const [historical, setHistorical] = useState<HistoricalBalances>(DEFAULT_BALANCES_2026);
  const [isEditingBalances, setIsEditingBalances] = useState(false);

  // Invoices state
  const [issuedInvoices, setIssuedInvoices] = useState<CFDIInvoice[]>([]);
  const [receivedInvoices, setReceivedInvoices] = useState<CFDIInvoice[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Load balances from storage on mount
  useEffect(() => {
    setHistorical(loadHistoricalBalances());
  }, []);

  // Handle issued upload
  const handleIssuedUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsProcessing(true);

    try {
      let parsed: CFDIInvoice[] = [];
      const file = files[0];
      if (file.name.toLowerCase().endsWith('.zip')) {
        parsed = await extractCFDIsFromZip(file);
      } else {
        parsed = await parseMultipleXMLFiles(Array.from(files));
      }

      setIssuedInvoices(parsed);
    } catch (err) {
      console.error('Error processing issued files:', err);
      alert('Error al procesar las facturas emitidas.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle received upload
  const handleReceivedUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsProcessing(true);

    try {
      let parsed: CFDIInvoice[] = [];
      const file = files[0];
      if (file.name.toLowerCase().endsWith('.zip')) {
        parsed = await extractCFDIsFromZip(file);
      } else {
        parsed = await parseMultipleXMLFiles(Array.from(files));
      }

      // Automatically evaluate deductibility for each received invoice
      const evaluated = parsed.map(inv => {
        const evalResult = evaluateDeductibility(inv);
        return {
          ...inv,
          isDeductible: evalResult.isDeductible,
          deductibilityReason: evalResult.reason,
        };
      });

      setReceivedInvoices(evaluated);
    } catch (err) {
      console.error('Error processing received files:', err);
      alert('Error al procesar las facturas recibidas.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Toggle deductibility of an individual invoice
  const toggleDeductibility = (uuid: string) => {
    setReceivedInvoices(prev =>
      prev.map(inv => {
        if (inv.uuid === uuid) {
          const nextState = !inv.isDeductible;
          return {
            ...inv,
            isDeductible: nextState,
            deductibilityReason: nextState
              ? 'Deducción reclasificada manualmente como autorizada'
              : 'Gasto reclasificado manualmente como personal / no deducible',
          };
        }
        return inv;
      })
    );
  };

  // Compute monthly tax declaration reactive summary
  const summary: MonthlyTaxSummary = useMemo(() => {
    return computeMonthlyDeclaration(
      issuedInvoices,
      receivedInvoices,
      year,
      month,
      historical
    );
  }, [issuedInvoices, receivedInvoices, year, month, historical]);

  // Copy to clipboard helper
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Save modified historical balances
  const handleSaveBalances = (e: React.FormEvent) => {
    e.preventDefault();
    saveHistoricalBalances(historical);
    setIsEditingBalances(false);
  };

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Top Header */}
      <header className="bg-slate-900 text-white border-b border-slate-800 shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 text-white p-2 rounded-lg shadow">
              <Calculator className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">SAT Fiscal Toolkit</h1>
              <p className="text-xs text-slate-400">
                Persona Física • Servicios Profesionales y Actividad Empresarial (Art. 106 LISR)
              </p>
            </div>
          </div>

          {/* Period selector & badges */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700">
              <select
                aria-label="Seleccionar mes"
                value={month}
                onChange={e => setMonth(parseInt(e.target.value, 10))}
                className="bg-transparent text-sm font-semibold text-white px-2 py-1 outline-none cursor-pointer"
              >
                {monthNames.map((name, idx) => (
                  <option key={name} value={idx + 1} className="bg-slate-800 text-white">
                    {name}
                  </option>
                ))}
              </select>
              <span className="text-slate-500 font-bold mx-1">/</span>
              <select
                aria-label="Seleccionar año"
                value={year}
                onChange={e => setYear(parseInt(e.target.value, 10))}
                className="bg-transparent text-sm font-semibold text-white px-2 py-1 outline-none cursor-pointer"
              >
                <option value={2026} className="bg-slate-800 text-white">2026</option>
                <option value={2025} className="bg-slate-800 text-white">2025</option>
              </select>
            </div>

            <div className="hidden sm:flex items-center text-xs bg-emerald-950 text-emerald-300 border border-emerald-800 px-3 py-1.5 rounded-full font-medium">
              <ShieldCheck className="h-4 w-4 mr-1.5 text-emerald-400" />
              100% Client-Side (Privacidad Absoluta)
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Upload Dropzones */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Card: Facturas Emitidas */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:border-blue-400 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-slate-900">Ingresos Emitidos (Issued)</h3>
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700">
                {issuedInvoices.length} {issuedInvoices.length === 1 ? 'CFDI' : 'CFDIs'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Arrastra el ZIP descargado del SAT o selecciona archivos XML emitidos en {monthNames[month - 1]}.
            </p>
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-lg p-6 hover:bg-slate-50 cursor-pointer transition-colors">
              <UploadCloud className="h-8 w-8 text-blue-500 mb-2" />
              <span className="text-sm font-medium text-slate-700">Seleccionar ZIP o XMLs Emitidos</span>
              <span className="text-xs text-slate-400 mt-1">Soporta CFDI 4.0 y Pagos 2.0</span>
              <input
                type="file"
                multiple
                accept=".zip,.xml"
                onChange={handleIssuedUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Card: Facturas Recibidas */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:border-emerald-400 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-emerald-600" />
                <h3 className="font-semibold text-slate-900">Gastos Recibidos (Received)</h3>
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                {receivedInvoices.length} {receivedInvoices.length === 1 ? 'CFDI' : 'CFDIs'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Arrastra el ZIP o los XMLs de compras y gastos. Se clasificarán automáticamente en deducibles o personales.
            </p>
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-lg p-6 hover:bg-slate-50 cursor-pointer transition-colors">
              <UploadCloud className="h-8 w-8 text-emerald-500 mb-2" />
              <span className="text-sm font-medium text-slate-700">Seleccionar ZIP o XMLs Recibidos</span>
              <span className="text-xs text-slate-400 mt-1">Clasificación inteligente de deducciones</span>
              <input
                type="file"
                multiple
                accept=".zip,.xml"
                onChange={handleReceivedUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200 mb-6">
          <button
            onClick={() => setActiveTab('summary')}
            className={`flex items-center space-x-2 px-4 py-2.5 font-medium text-sm rounded-t-lg transition-colors ${
              activeTab === 'summary'
                ? 'bg-white text-blue-600 border-t-2 border-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Calculator className="h-4 w-4" />
            <span>Determinación Fiscal</span>
          </button>

          <button
            onClick={() => setActiveTab('sat_guide')}
            className={`flex items-center space-x-2 px-4 py-2.5 font-medium text-sm rounded-t-lg transition-colors ${
              activeTab === 'sat_guide'
                ? 'bg-white text-blue-600 border-t-2 border-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span>Guía de Llenado SAT</span>
          </button>

          <button
            onClick={() => setActiveTab('issued')}
            className={`flex items-center space-x-2 px-4 py-2.5 font-medium text-sm rounded-t-lg transition-colors ${
              activeTab === 'issued'
                ? 'bg-white text-blue-600 border-t-2 border-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <TrendingUp className="h-4 w-4" />
            <span>Ingresos ({issuedInvoices.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('received')}
            className={`flex items-center space-x-2 px-4 py-2.5 font-medium text-sm rounded-t-lg transition-colors ${
              activeTab === 'received'
                ? 'bg-white text-blue-600 border-t-2 border-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Auditoría de Gastos ({receivedInvoices.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center space-x-2 px-4 py-2.5 font-medium text-sm rounded-t-lg transition-colors ${
              activeTab === 'settings'
                ? 'bg-white text-blue-600 border-t-2 border-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Sliders className="h-4 w-4" />
            <span>Saldos Acumulados</span>
          </button>
        </div>

        {/* Tab 1: Determinacion Fiscal (Summary) */}
        {activeTab === 'summary' && (
          <div className="space-y-6">
            {/* Top KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <span className="text-xs font-semibold text-slate-500 uppercase">Ingresos Cobrados Mes</span>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  MXN {summary.ingresosCobradosMes.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </p>
                <span className="text-xs text-slate-400 mt-1 block">
                  Acumulado: MXN {summary.ingresosAcumuladosTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <span className="text-xs font-semibold text-slate-500 uppercase">Deducciones Autorizadas</span>
                <p className="text-2xl font-bold text-emerald-600 mt-1">
                  MXN {summary.deduccionesAutorizadasMes.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </p>
                <span className="text-xs text-amber-600 mt-1 block font-medium">
                  Gastos personales: MXN {summary.gastosNoDeduciblesMes.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <span className="text-xs font-semibold text-slate-500 uppercase">ISR a Pagar (Art. 106)</span>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  MXN {summary.isrPagarMes.toFixed(2)}
                </p>
                <span className="text-xs text-slate-500 mt-1 block">
                  Impuesto: MXN {summary.impuestoDeterminadoArt106.toFixed(2)} • Ret: MXN {summary.retencionesIsrTotal.toFixed(2)}
                </span>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <span className="text-xs font-semibold text-slate-500 uppercase">IVA Definitivo a Pagar</span>
                <p className="text-2xl font-bold text-indigo-600 mt-1">
                  MXN {summary.ivaPagarFinal.toFixed(2)}
                </p>
                <span className="text-xs text-emerald-600 mt-1 block font-semibold">
                  Saldo a Favor disponible: MXN {summary.saldoFavorIvaRemanenteParaSiguienteMes.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Side-by-side Breakdowns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Card ISR */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                  <h3 className="font-semibold text-slate-900 text-base">Cálculo de ISR Provisional (Art. 106 LISR)</h3>
                  <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded font-medium">Acumulativo {month} Meses</span>
                </div>

                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-600">Total Ingresos Acumulados</span>
                    <span className="font-semibold text-slate-900">MXN {summary.ingresosAcumuladosTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-600">Total Deducciones Acumuladas</span>
                    <span className="font-semibold text-slate-900">MXN {summary.deduccionesAcumuladasTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50 bg-slate-50 px-2 rounded">
                    <span className="font-medium text-slate-700">Base Gravable Acumulada</span>
                    <span className="font-bold text-slate-900">MXN {summary.baseGravableAcumulada.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-600">Impuesto Determinado (Tarifa Art. 106)</span>
                    <span className="font-semibold text-slate-900">MXN {summary.impuestoDeterminadoArt106.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-600">Retenciones ISR Acumuladas (Personas Morales)</span>
                    <span className="font-semibold text-emerald-600">- MXN {summary.retencionesIsrTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-600">Pagos Provisionales de ISR Previos</span>
                    <span className="font-semibold text-emerald-600">- MXN {summary.pagosProvisionalesPrevios.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between py-2 bg-blue-50 px-3 rounded-lg mt-2">
                    <span className="font-bold text-blue-900">ISR Provisional a Pagar</span>
                    <span className="font-bold text-blue-900 text-base">MXN {summary.isrPagarMes.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Card IVA */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                  <h3 className="font-semibold text-slate-900 text-base">Determinación de IVA Definitivo</h3>
                  <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded font-medium">Flujo de Efectivo</span>
                </div>

                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-600">IVA Trasladado / Causado (16%)</span>
                    <span className="font-semibold text-slate-900">MXN {summary.ivaCausadoMes.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-600">IVA Acreditable (Gastos Deducibles Pagados)</span>
                    <span className="font-semibold text-emerald-600">- MXN {summary.ivaAcreditableMes.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-600">IVA Retenido por Personas Morales</span>
                    <span className="font-semibold text-emerald-600">- MXN {summary.retencionesIvaMes.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50 bg-slate-50 px-2 rounded">
                    <span className="font-medium text-slate-700">IVA Neto del Periodo</span>
                    <span className={`font-bold ${summary.ivaNetoPrevioAcreditamiento < 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                      {summary.ivaNetoPrevioAcreditamiento < 0
                        ? `A Favor: MXN ${summary.saldoFavorIvaMes.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
                        : `A Cargo: MXN ${summary.ivaCargoMes.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-600">Acreditamiento de Saldo a Favor Anterior</span>
                    <span className="font-semibold text-emerald-600">- MXN {summary.saldoFavorIvaAnteriorAplicado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between py-2 bg-indigo-50 px-3 rounded-lg mt-2">
                    <span className="font-bold text-indigo-900">IVA Definitivo a Pagar</span>
                    <span className="font-bold text-indigo-900 text-base">MXN {summary.ivaPagarFinal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Export Toolbar */}
            <div className="bg-slate-900 text-white rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
              <div>
                <h4 className="font-bold text-base">Descargar Papeles de Trabajo</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Archivos listos para auditoría contable o respaldo de declaración mensual.
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => exportWorkpaperExcel(summary, issuedInvoices, receivedInvoices)}
                  className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>Descargar Excel (.xlsx)</span>
                </button>
                <button
                  onClick={() => {
                    const md = exportMarkdownReport(summary, issuedInvoices, receivedInvoices);
                    downloadTextFile(md, `Declaracion_Fiscal_${year}_${String(month).padStart(2, '0')}.md`);
                  }}
                  className="flex items-center space-x-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>Reporte Markdown</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Guia de Llenado SAT */}
        {activeTab === 'sat_guide' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Valores Exactos para Captura en el Portal del SAT</h3>
              <p className="text-xs text-slate-500 mt-1">
                Haz clic en el icono de copiar al lado de cada campo para pegarlo directamente en el formulario del SAT (sin decimales, redondeado según regla fiscal).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Sección ISR */}
              <div className="border border-blue-200 rounded-lg p-5 bg-blue-50/30">
                <h4 className="font-bold text-blue-950 text-sm mb-4 border-b border-blue-200 pb-2">
                  ISR Personas Físicas — Actividad Empresarial y Profesional
                </h4>
                <div className="space-y-3">
                  {[
                    { label: 'Total de ingresos efectivamente cobrados del periodo', val: Math.round(summary.ingresosCobradosMes).toString() },
                    { label: 'Total de ingresos acumulables al periodo', val: Math.round(summary.ingresosAcumuladosTotal).toString() },
                    { label: 'Total de deducciones autorizadas del periodo', val: Math.round(summary.deduccionesAutorizadasMes).toString() },
                    { label: 'Total de deducciones autorizadas acumuladas', val: Math.round(summary.deduccionesAcumuladasTotal).toString() },
                    { label: 'Base gravable acumulada', val: Math.round(summary.baseGravableAcumulada).toString() },
                    { label: 'Impuesto retenido a personas físicas por personas morales', val: Math.round(summary.retencionesIsrTotal).toString() },
                    { label: 'Pagos provisionales efectuados con anterioridad', val: Math.round(summary.pagosProvisionalesPrevios).toString() },
                    { label: 'Cantidad a cargo / a pagar de ISR', val: Math.round(summary.isrPagarMes).toString() },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white p-2.5 rounded border border-slate-200 text-xs">
                      <span className="text-slate-700 font-medium">{item.label}</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-slate-900 text-sm">MXN {item.val}</span>
                        <button
                          onClick={() => copyToClipboard(item.val, `isr-${idx}`)}
                          className="p-1 text-slate-400 hover:text-blue-600 rounded hover:bg-slate-100"
                          title="Copiar valor"
                        >
                          {copiedField === `isr-${idx}` ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sección IVA */}
              <div className="border border-indigo-200 rounded-lg p-5 bg-indigo-50/30">
                <h4 className="font-bold text-indigo-950 text-sm mb-4 border-b border-indigo-200 pb-2">
                  IVA Personas Físicas — Actividad Empresarial y Profesional
                </h4>
                <div className="space-y-3">
                  {[
                    { label: 'Total de actos o actividades gravados a la tasa del 16%', val: Math.round(summary.ingresosCobradosMes).toString() },
                    { label: 'Total de actos o actividades pagados gravados al 16%', val: Math.round(summary.deduccionesAutorizadasMes).toString() },
                    { label: 'IVA acreditable del periodo', val: Math.round(summary.ivaAcreditableMes).toString() },
                    { label: 'IVA retenido al contribuyente por personas morales', val: Math.round(summary.retencionesIvaMes).toString() },
                    { label: 'Saldo a favor del periodo (si aplica)', val: Math.round(summary.saldoFavorIvaMes).toString() },
                    { label: 'Acreditamiento de saldo a favor de periodos anteriores', val: Math.round(summary.saldoFavorIvaAnteriorAplicado).toString() },
                    { label: 'Cantidad a pagar de IVA', val: Math.round(summary.ivaPagarFinal).toString() },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white p-2.5 rounded border border-slate-200 text-xs">
                      <span className="text-slate-700 font-medium">{item.label}</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-slate-900 text-sm">MXN {item.val}</span>
                        <button
                          onClick={() => copyToClipboard(item.val, `iva-${idx}`)}
                          className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-100"
                          title="Copiar valor"
                        >
                          {copiedField === `iva-${idx}` ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Facturas Emitidas */}
        {activeTab === 'issued' && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Facturas Emitidas (Ingresos)</h3>
                <p className="text-xs text-slate-500">Comprobantes tipo Ingreso timbrados en el mes.</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded bg-blue-100 text-blue-800">
                {issuedInvoices.length} facturas
              </span>
            </div>

            {issuedInvoices.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-sm">
                No has cargado facturas emitidas. Sube un archivo ZIP o XML en la sección superior.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                    <tr>
                      <th className="py-3 px-4">Fecha</th>
                      <th className="py-3 px-4">Receptor / Cliente</th>
                      <th className="py-3 px-4">Método</th>
                      <th className="py-3 px-4 text-right">Subtotal</th>
                      <th className="py-3 px-4 text-right">IVA 16%</th>
                      <th className="py-3 px-4 text-right">Ret. ISR</th>
                      <th className="py-3 px-4 text-right">Ret. IVA</th>
                      <th className="py-3 px-4 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {issuedInvoices.map((inv, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                          {inv.fecha.slice(0, 10)}
                        </td>
                        <td className="py-3 px-4 max-w-xs truncate">
                          <span className="font-semibold text-slate-900 block">{inv.receptorNombre || 'Público en General'}</span>
                          <span className="text-slate-400 font-mono text-[10px]">{inv.receptorRfc}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700">
                            {inv.metodoPago}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-medium">
                          MXN {inv.subtotal.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-600">
                          MXN {inv.ivaTrasladado16.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-emerald-600 font-medium">
                          {inv.isrRetenido > 0 ? `MXN ${inv.isrRetenido.toFixed(2)}` : '-'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-emerald-600 font-medium">
                          {inv.ivaRetenido > 0 ? `MXN ${inv.ivaRetenido.toFixed(2)}` : '-'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                          MXN {inv.total.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Facturas Recibidas y Auditoria de Gastos */}
        {activeTab === 'received' && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Auditoría Interactiva de Deducciones (Gastos)</h3>
                <p className="text-xs text-slate-500">
                  Usa el interruptor de cada fila para incluir o excluir una factura del cálculo fiscal en tiempo real.
                </p>
              </div>
              <div className="flex items-center space-x-2 text-xs">
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                  {receivedInvoices.filter(i => i.isDeductible).length} Deducibles
                </span>
                <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-semibold">
                  {receivedInvoices.filter(i => !i.isDeductible).length} Personales
                </span>
              </div>
            </div>

            {receivedInvoices.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-sm">
                No has cargado facturas recibidas. Sube un archivo ZIP o XML en la sección superior.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                    <tr>
                      <th className="py-3 px-4 text-center">¿Deducible?</th>
                      <th className="py-3 px-4">Fecha</th>
                      <th className="py-3 px-4">Proveedor / Emisor</th>
                      <th className="py-3 px-4">Motivo / Criterio</th>
                      <th className="py-3 px-4 text-right">Subtotal</th>
                      <th className="py-3 px-4 text-right">IVA 16%</th>
                      <th className="py-3 px-4 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {receivedInvoices.map((inv, idx) => (
                      <tr key={idx} className={inv.isDeductible ? 'hover:bg-slate-50' : 'bg-slate-50/60 opacity-80'}>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => toggleDeductibility(inv.uuid)}
                            className={`px-3 py-1 rounded-full font-bold text-[11px] transition-colors shadow-sm ${
                              inv.isDeductible
                                ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                            }`}
                          >
                            {inv.isDeductible ? 'SÍ' : 'NO'}
                          </button>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                          {inv.fecha.slice(0, 10)}
                        </td>
                        <td className="py-3 px-4 max-w-xs truncate">
                          <span className="font-semibold text-slate-900 block">{inv.emisorNombre || 'Proveedor'}</span>
                          <span className="text-slate-400 font-mono text-[10px]">{inv.emisorRfc}</span>
                        </td>
                        <td className="py-3 px-4 max-w-sm">
                          <span className={`inline-block px-2 py-0.5 rounded text-[11px] ${
                            inv.isDeductible 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {inv.deductibilityReason}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-medium">
                          MXN {inv.subtotal.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-600">
                          MXN {inv.ivaTrasladado16.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                          MXN {inv.total.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Configuracion de Saldos Acumulados */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm max-w-3xl mx-auto space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900">Saldos Acumulados Anteriores (Enero - Mes Previo)</h3>
              <p className="text-xs text-slate-500 mt-1">
                Estos valores provienen de tus declaraciones previas presentadas ante el SAT y son indispensables para calcular el ISR acumulativo (Art. 106 LISR) y el acreditamiento de saldos a favor de IVA.
              </p>
            </div>

            <form onSubmit={handleSaveBalances} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Ingresos Acumulados Anteriores (MXN)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={historical.previousIncome}
                    onChange={e => setHistorical({ ...historical, previousIncome: parseFloat(e.target.value) || 0 })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Deducciones Acumuladas Anteriores (MXN)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={historical.previousDeductions}
                    onChange={e => setHistorical({ ...historical, previousDeductions: parseFloat(e.target.value) || 0 })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Retenciones ISR Acumuladas Previas (MXN)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={historical.previousWithheldIsr}
                    onChange={e => setHistorical({ ...historical, previousWithheldIsr: parseFloat(e.target.value) || 0 })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Pagos Provisionales ISR Previos (MXN)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={historical.previousProvisionalPayments}
                    onChange={e => setHistorical({ ...historical, previousProvisionalPayments: parseFloat(e.target.value) || 0 })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono outline-none focus:border-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-medium text-slate-700 mb-1">
                    Saldo a Favor de IVA Anterior Acreditable (MXN)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={historical.previousVatFavorableBalance}
                    onChange={e => setHistorical({ ...historical, previousVatFavorableBalance: parseFloat(e.target.value) || 0 })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setHistorical(DEFAULT_BALANCES_2026)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                >
                  Restablecer Valores Predeterminados
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-colors shadow"
                >
                  Guardar en Navegador
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}

