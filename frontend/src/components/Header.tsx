import React from 'react';
import { ShieldCheck, Share2, Printer, Users, RefreshCw } from 'lucide-react';
import { CustomerProfile } from '../types';

interface HeaderProps {
  currentCustomer: CustomerProfile;
  clients: CustomerProfile[];
  onSelectCustomer: (customer: CustomerProfile) => void;
  onOpenClientManager: () => void;
  onOpenExportModal: () => void;
  onPrint: () => void;
  isLiveAi: boolean;
  onResetDefaults: () => void;
  dbStatus?: { connected: boolean; storageMode: string };
}

export const Header: React.FC<HeaderProps> = ({
  currentCustomer,
  clients,
  onSelectCustomer,
  onOpenClientManager,
  onOpenExportModal,
  onPrint,
  isLiveAi,
  onResetDefaults,
  dbStatus
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      {/* Top Banner for Axis Max Life */}
      <div className="bg-gradient-to-r from-axis-deepBurgundy via-axis-burgundy to-max-blue text-white px-4 py-2 sm:px-6 flex flex-wrap items-center justify-between text-xs font-medium">
        <div className="flex items-center space-x-3">
          <span className="bg-white/20 px-2 py-0.5 rounded text-[11px] font-semibold tracking-wider uppercase">
            Bancassurance Advisory Suite
          </span>
          <span className="hidden md:inline text-white/80">
            Axis Bank Priority Banking &bull; Axis Max Life Financial Need Analysis
          </span>
        </div>
        <div className="flex items-center space-x-3">
          {/* Database indicator */}
          <div className="hidden sm:flex items-center space-x-1.5 bg-black/25 px-2.5 py-0.5 rounded-full border border-white/10 text-[11px]">
            <span className={`w-2 h-2 rounded-full ${dbStatus?.connected ? 'bg-emerald-400' : 'bg-slate-300'}`} />
            <span>
              {dbStatus?.connected ? 'PostgreSQL 17' : 'Local / In-Memory'}
            </span>
          </div>

          <div className="flex items-center space-x-1.5 bg-black/25 px-2.5 py-0.5 rounded-full border border-white/10">
            <span className={`w-2 h-2 rounded-full ${isLiveAi ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span className="text-[11px]">
              {isLiveAi ? 'Live AI Copilot (Gemini)' : 'Deterministic Analysis Engine'}
            </span>
          </div>
          <button
            onClick={onResetDefaults}
            title="Reset to factory sample clients"
            className="text-white/70 hover:text-white flex items-center space-x-1 hover:underline text-[11px]"
          >
            <RefreshCw className="w-3 h-3" />
            <span className="hidden sm:inline">Reset Defaults</span>
          </button>
        </div>
      </div>

      {/* Main Navigation & Quick Switcher */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-axis-burgundy flex items-center justify-center text-white shadow-md">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                Customer Need Analysis Tool
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-100 text-amber-900 border border-amber-200">
                POC v2.4
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Explainable HLV Protection, Liquidity Gap & Goal-Based Advisory
            </p>
          </div>
        </div>

        {/* Client Switcher & Actions */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Quick Select Client Dropdown */}
          <div className="relative">
            <select
              value={currentCustomer.id}
              onChange={(e) => {
                const selected = clients.find(c => c.id === e.target.value);
                if (selected) onSelectCustomer(selected);
              }}
              className="text-xs font-semibold bg-slate-100 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 hover:border-axis-burgundy focus:outline-hidden focus:ring-2 focus:ring-axis-burgundy/20 cursor-pointer shadow-xs pr-8"
            >
              {clients.map(c => (
                <option key={c.id} value={c.id}>
                  👤 {c.name} {c.id === 'client_rahul_mehta' ? '(Benchmark)' : ''}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={onOpenClientManager}
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-xs transition"
          >
            <Users className="w-3.5 h-3.5 text-slate-500" />
            <span>Manage Clients</span>
          </button>

          <button
            onClick={onOpenExportModal}
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 shadow-xs transition"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Copy for WhatsApp / Email</span>
          </button>

          <button
            onClick={onPrint}
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-xs transition"
            title="Export Report to PDF"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Print / PDF</span>
          </button>
        </div>
      </div>
    </header>
  );
};
