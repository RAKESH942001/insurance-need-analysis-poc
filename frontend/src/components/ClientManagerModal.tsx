import React from 'react';
import { CustomerProfile } from '../types';
import { X, UserPlus, Trash2, CheckCircle2, RotateCcw, User } from 'lucide-react';

interface ClientManagerModalProps {
  clients: CustomerProfile[];
  currentClientId: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectClient: (client: CustomerProfile) => void;
  onDeleteClient: (id: string) => void;
  onCreateNewClient: () => void;
  onResetDefaults: () => void;
}

export const ClientManagerModal: React.FC<ClientManagerModalProps> = ({
  clients,
  currentClientId,
  isOpen,
  onClose,
  onSelectClient,
  onDeleteClient,
  onCreateNewClient,
  onResetDefaults
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-axis-burgundy text-white flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Client Portfolio Management
              </h3>
              <p className="text-xs text-slate-500">
                Load, create, or manage demo interview profiles
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action bar */}
        <div className="p-3 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between gap-2">
          <button
            onClick={() => {
              onCreateNewClient();
              onClose();
            }}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-axis-burgundy text-white rounded-lg text-xs font-semibold hover:bg-axis-deepBurgundy shadow-xs transition"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ Create New Customer</span>
          </button>

          <button
            onClick={onResetDefaults}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition"
            title="Restore original sample clients"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Restore Factory Demo Clients</span>
          </button>
        </div>

        {/* Client List */}
        <div className="p-4 overflow-y-auto space-y-2.5">
          {clients.map((c) => {
            const isSelected = c.id === currentClientId;
            return (
              <div
                key={c.id}
                className={`p-3.5 rounded-xl border transition flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'border-axis-burgundy bg-rose-50/30 ring-1 ring-axis-burgundy/20'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-slate-900">{c.name}</span>
                    {c.id === 'client_rahul_mehta' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        Benchmark Profile
                      </span>
                    )}
                    {isSelected && (
                      <span className="flex items-center space-x-1 text-[11px] font-bold text-emerald-600">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Active</span>
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 flex flex-wrap gap-x-3">
                    <span>Age: {c.age}</span>
                    <span>Income: ₹{c.monthlyIncome.toLocaleString('en-IN')}/mo</span>
                    <span>Expenses: ₹{c.monthlyExpenses.toLocaleString('en-IN')}/mo</span>
                    <span>Liabilities: ₹{c.existingLiabilities.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {!isSelected && (
                    <button
                      onClick={() => {
                        onSelectClient(c);
                        onClose();
                      }}
                      className="px-3 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition"
                    >
                      Load Profile
                    </button>
                  )}
                  {c.id !== 'client_rahul_mehta' && (
                    <button
                      onClick={() => onDeleteClient(c.id)}
                      title="Delete client"
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold hover:bg-slate-300 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
