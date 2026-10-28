import React, { useState } from 'react';
import { AiAdvisoryInsight } from '../types';
import { Sparkles, MessageSquare, HelpCircle, ShieldCheck, RefreshCw, Cpu } from 'lucide-react';

interface AiAdvisorCopilotProps {
  insights: AiAdvisoryInsight;
  onRefresh: (forceDeterministic: boolean) => void;
  isLoading: boolean;
}

export const AiAdvisorCopilot: React.FC<AiAdvisorCopilotProps> = ({
  insights,
  onRefresh,
  isLoading
}) => {
  const [activeTab, setActiveTab] = useState<'pitch' | 'points' | 'objections'>('pitch');

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Copilot Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-slate-900 via-slate-800 to-axis-deepBurgundy text-white flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/10 text-amber-300 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-bold text-white">
                Responsible AI Advisor Copilot
              </h2>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                insights.isLiveAi
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
              }`}>
                {insights.isLiveAi ? 'Live Gemini 1.5' : 'Deterministic Rule Engine'}
              </span>
            </div>
            <p className="text-[11px] text-white/70">
              {insights.aiEngine} &bull; Generated {new Date(insights.generatedAt).toLocaleTimeString()}
            </p>
          </div>
        </div>

        {/* Engine Switcher Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onRefresh(!insights.isLiveAi)}
            disabled={isLoading}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition disabled:opacity-50"
            title="Switch between live LLM and deterministic local rule synthesis"
          >
            <Cpu className="w-3.5 h-3.5 text-amber-300" />
            <span>{insights.isLiveAi ? 'Force Deterministic Mode' : 'Test Live Gemini AI'}</span>
          </button>

          <button
            onClick={() => onRefresh(false)}
            disabled={isLoading}
            title="Refresh Copilot Commentary"
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 text-xs font-semibold text-slate-600 bg-slate-50">
        <button
          onClick={() => setActiveTab('pitch')}
          className={`flex-1 py-2.5 px-3 text-center border-b-2 transition flex items-center justify-center space-x-1.5 ${
            activeTab === 'pitch'
              ? 'border-axis-burgundy text-axis-burgundy bg-white'
              : 'border-transparent hover:text-slate-900'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Advisor Meeting Script</span>
        </button>
        <button
          onClick={() => setActiveTab('points')}
          className={`flex-1 py-2.5 px-3 text-center border-b-2 transition flex items-center justify-center space-x-1.5 ${
            activeTab === 'points'
              ? 'border-axis-burgundy text-axis-burgundy bg-white'
              : 'border-transparent hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Discussion Points</span>
        </button>
        <button
          onClick={() => setActiveTab('objections')}
          className={`flex-1 py-2.5 px-3 text-center border-b-2 transition flex items-center justify-center space-x-1.5 ${
            activeTab === 'objections'
              ? 'border-axis-burgundy text-axis-burgundy bg-white'
              : 'border-transparent hover:text-slate-900'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Objection Handling ({insights.clientObjectionsAndResponses?.length || 0})</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="p-4 sm:p-5 space-y-4 text-xs">
        {/* Executive Summary Callout */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
          <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block">
            Executive Brief for Relationship Manager
          </span>
          <p className="text-slate-800 leading-relaxed font-medium">
            {insights.executiveSummary}
          </p>
        </div>

        {/* TAB 1: Advisor Meeting Pitch */}
        {activeTab === 'pitch' && (
          <div className="space-y-3">
            <div className="p-4 bg-rose-50/40 rounded-xl border border-rose-100 space-y-2">
              <span className="font-bold text-axis-burgundy uppercase tracking-wider text-[10px] block">
                Verbatim Customer Opening Dialogue:
              </span>
              <p className="text-slate-900 leading-relaxed italic text-xs font-serif">
                {insights.advisorTalkingScript}
              </p>
            </div>
            <p className="text-[11px] text-slate-500">
              💡 Tip: Frame the conversation around asset protection and family milestone insulation rather than pitching policy features directly.
            </p>
          </div>
        )}

        {/* TAB 2: Discussion Points */}
        {activeTab === 'points' && (
          <div className="space-y-2.5">
            <span className="font-bold text-slate-700 block text-xs">
              Tailored Customer-Specific Talking Points:
            </span>
            <div className="space-y-2">
              {insights.keyDiscussionPoints.map((pt, idx) => (
                <div
                  key={idx}
                  className="flex items-start space-x-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-800"
                >
                  <span className="w-5 h-5 rounded-full bg-axis-burgundy text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <p className="leading-relaxed">{pt}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: Objections */}
        {activeTab === 'objections' && (
          <div className="space-y-3">
            {insights.clientObjectionsAndResponses.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2 shadow-2xs"
              >
                <div className="flex items-start space-x-2 text-slate-900 font-bold">
                  <span className="text-red-500 font-mono">Q:</span>
                  <span>{item.objection}</span>
                </div>
                <div className="flex items-start space-x-2 text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-150 leading-relaxed">
                  <span className="text-emerald-600 font-bold font-mono">A:</span>
                  <span>{item.suggestedResponse}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* IRDAI Regulatory Guardrail Footer */}
        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 flex items-start space-x-2 text-amber-900 text-[11px]">
          <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <p className="leading-normal">{insights.complianceSuitabilityNotice}</p>
        </div>
      </div>
    </div>
  );
};

