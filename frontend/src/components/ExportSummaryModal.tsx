import React, { useState } from 'react';
import { AnalysisResultResponse } from '../types';
import { X, Copy, Check, MessageSquare, Mail, Printer, Download } from 'lucide-react';

interface ExportSummaryModalProps {
  data: AnalysisResultResponse;
  isOpen: boolean;
  onClose: () => void;
  onPrint: () => void;
}

export const ExportSummaryModal: React.FC<ExportSummaryModalProps> = ({
  data,
  isOpen,
  onClose,
  onPrint
}) => {
  const [copiedType, setCopiedType] = useState<'whatsapp' | 'email' | null>(null);
  const [format, setFormat] = useState<'whatsapp' | 'email'>('whatsapp');

  if (!isOpen) return null;

  const { customer, analysis, recommendations } = data;

  const formatINR = (val: number) => `₹${Math.round(val).toLocaleString('en-IN')}`;

  const whatsAppText = `*AXIS MAX LIFE FINANCIAL NEED ANALYSIS SUMMARY*
👤 *Client:* ${customer.name} (Age: ${customer.age}, Dependants: ${customer.dependantsCount})
📅 *Date:* ${new Date().toLocaleDateString('en-IN')}

*1. CASH FLOW & COMMITMENTS*
• Monthly Income: *${formatINR(analysis.monthlyIncome)}*
• Living Expenses: *${formatINR(analysis.monthlyExpenses)}*
• Debt / EMIs: *${formatINR(analysis.monthlyEmi)}*
• Total Monthly Commitments: *${formatINR(analysis.monthlyCommitments)}*
• Net Monthly Surplus: *${formatINR(analysis.monthlySurplus)}* (Savings Rate: ${analysis.savingsRatePercent}%)

*2. EMERGENCY LIQUIDITY HEALTH*
• 6-Month Emergency Target: *${formatINR(analysis.emergencyFundTarget)}*
• Current Liquid Reserves: *${formatINR(analysis.currentSavings)}* (${analysis.currentSavingsCoverageMonths} Months Runway)
• Emergency Shortfall: *${formatINR(analysis.emergencyFundGap)}*

*3. HUMAN LIFE VALUE & LIFE PROTECTION*
• Gross Capital Protection Need: *${formatINR(analysis.protectionNeed.totalGrossNeed)}* (10x Annual Income)
• Declared Existing Life Cover: *${formatINR(analysis.protectionNeed.existingCover)}*
• *Illustrative Protection Gap: ${formatINR(analysis.protectionNeed.illustrativeProtectionGap)}*

*4. PRIORITIZED STRATEGIC ACTION PLAN*
${recommendations.map((r, i) => `${i + 1}. *[${r.urgency}]* ${r.title}\n   Action: ${r.recommendedAction}`).join('\n\n')}

*Advisor:* Priya Nair | Axis Bank Fort Mumbai
_Disclaimer: Illustrative financial planning summary. Formal underwriting subject to Axis Max Life terms._`;

  const emailText = `Subject: Confidential Financial Need Analysis Summary for ${customer.name} - Axis Max Life

Dear ${customer.name},

Thank you for meeting with us today to evaluate your family's financial roadmap. Below is an executive summary of the need analysis conducted on ${new Date().toLocaleDateString('en-IN')}:

1. CASH FLOW & MONTHLY COMMITMENTS
• Monthly In-hand Income: ${formatINR(analysis.monthlyIncome)}
• Living Expenses: ${formatINR(analysis.monthlyExpenses)}
• Ongoing EMIs / Debt Service: ${formatINR(analysis.monthlyEmi)}
• Total Monthly Commitments: ${formatINR(analysis.monthlyCommitments)}
• Monthly Net Surplus: ${formatINR(analysis.monthlySurplus)} (Savings Rate: ${analysis.savingsRatePercent}%)

2. EMERGENCY BUFFER & RUNWAY
• 6-Month Emergency Target: ${formatINR(analysis.emergencyFundTarget)}
• Current Liquid Reserves: ${formatINR(analysis.currentSavings)} (${analysis.currentSavingsCoverageMonths} months runway)
• Emergency Buffer Shortfall: ${formatINR(analysis.emergencyFundGap)}

3. HUMAN LIFE VALUE & LIFE PROTECTION NEED
• Illustrative Capital Need: ${formatINR(analysis.protectionNeed.totalGrossNeed)}
  - Income Replacement (10x Annual Income): ${formatINR(analysis.protectionNeed.incomeReplacementAmount)}
  - Declared Outstanding Debt: ${formatINR(analysis.protectionNeed.liabilitiesCoverAmount)}
  - Declared Milestone Goals: ${formatINR(analysis.protectionNeed.milestoneGoalsAmount)}
• Declared Existing Life Insurance Cover: ${formatINR(analysis.protectionNeed.existingCover)}
• Net Illustrative Life Protection Gap: ${formatINR(analysis.protectionNeed.illustrativeProtectionGap)}

4. STRATEGIC NEXT STEPS IN URGENCY ORDER
${recommendations.map((r, i) => `Step ${i + 1} (${r.urgency}): ${r.title}\n- Action: ${r.recommendedAction}\n- Rationale: ${r.reasonWhy}`).join('\n\n')}

Please review this summary at your convenience. I will follow up tomorrow to schedule our proposal structuring discussion.

Warm regards,

Priya Nair
Senior Bancassurance Relationship Manager
Axis Bank & Axis Max Life Insurance Co. Ltd.
Disclaimer: This analysis is an illustrative advisory framework based on client-provided figures and does not constitute a formal policy contract.`;

  const handleCopy = (text: string, type: 'whatsapp' | 'email') => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  const handleDownloadTxt = () => {
    const content = format === 'whatsapp' ? whatsAppText : emailText;
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `Need_Analysis_${customer.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Share & Export Customer Summary
            </h3>
            <p className="text-xs text-slate-500">
              Export via WhatsApp, Email, TXT download or Print-to-PDF
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Format Selector */}
        <div className="flex border-b border-slate-200 bg-white text-xs font-semibold">
          <button
            onClick={() => setFormat('whatsapp')}
            className={`flex-1 py-3 px-4 flex items-center justify-center space-x-2 border-b-2 transition ${
              format === 'whatsapp'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                : 'border-transparent text-slate-600 hover:bg-slate-50'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            <span>WhatsApp Formatted Layout</span>
          </button>
          <button
            onClick={() => setFormat('email')}
            className={`flex-1 py-3 px-4 flex items-center justify-center space-x-2 border-b-2 transition ${
              format === 'email'
                ? 'border-axis-burgundy text-axis-burgundy bg-rose-50/40'
                : 'border-transparent text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Mail className="w-4 h-4 text-axis-burgundy" />
            <span>Formal Email Format</span>
          </button>
        </div>

        {/* Text Area Content */}
        <div className="p-5 overflow-y-auto">
          <textarea
            readOnly
            value={format === 'whatsapp' ? whatsAppText : emailText}
            className="w-full h-72 p-3 font-mono text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden resize-none leading-relaxed"
          />
        </div>

        {/* Actions Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                onClose();
                onPrint();
              }}
              className="inline-flex items-center space-x-1.5 px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-white transition"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Print to PDF</span>
            </button>

            <button
              onClick={handleDownloadTxt}
              className="inline-flex items-center space-x-1.5 px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-white transition"
              title="Download clean text file"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Download (.txt)</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleCopy(format === 'whatsapp' ? whatsAppText : emailText, format)}
              className={`inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white shadow-xs transition ${
                copiedType === format
                  ? 'bg-emerald-600'
                  : format === 'whatsapp' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-axis-burgundy hover:bg-axis-deepBurgundy'
              }`}
            >
              {copiedType === format ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy {format === 'whatsapp' ? 'WhatsApp Message' : 'Email Draft'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
