import {
  CustomerProfile,
  FinancialAnalysis,
  ActionRecommendation,
  AiAdvisoryInsight,
  AnalysisResultResponse
} from '../types';

const API_BASE = '/api';

export interface HealthStatus {
  status: string;
  aiEngineAvailable: string;
  database?: {
    connected: boolean;
    storageMode: string;
    message: string;
    host: string;
    port: number;
    database: string;
    version?: string;
  };
}

export class ApiService {
  public static async checkHealth(): Promise<HealthStatus> {
    try {
      const res = await fetch(`${API_BASE}/health`);
      if (!res.ok) throw new Error('Healthcheck failed');
      return await res.json();
    } catch {
      return {
        status: 'offline',
        aiEngineAvailable: 'Deterministic Engine (Client Mode)',
        database: {
          connected: false,
          storageMode: 'LOCAL_BROWSER_FALLBACK',
          message: 'Backend API offline. Using client browser storage.',
          host: 'localhost',
          port: 5433,
          database: 'need_analysis_poc'
        }
      };
    }
  }

  public static async getClients(): Promise<CustomerProfile[]> {
    const res = await fetch(`${API_BASE}/clients`);
    if (!res.ok) throw new Error('Failed to load demo clients');
    return await res.json();
  }

  public static async saveClient(profile: Partial<CustomerProfile>): Promise<CustomerProfile> {
    const res = await fetch(`${API_BASE}/clients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to save client');
    }
    return await res.json();
  }

  public static async updateClient(id: string, profile: Partial<CustomerProfile>): Promise<CustomerProfile> {
    const res = await fetch(`${API_BASE}/clients/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update client');
    }
    return await res.json();
  }

  public static async deleteClient(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/clients/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete client');
  }

  public static async resetClients(): Promise<CustomerProfile[]> {
    const res = await fetch(`${API_BASE}/clients/reset`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to reset clients');
    const data = await res.json();
    return data.clients;
  }

  public static async analyzeCustomer(
    profile: CustomerProfile,
    forceDeterministic = false
  ): Promise<AnalysisResultResponse> {
    const modeQuery = forceDeterministic ? '?mode=deterministic' : '';
    const res = await fetch(`${API_BASE}/analyze${modeQuery}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile)
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Analysis failed with status ${res.status}`);
    }

    return await res.json();
  }

  public static async refreshAiInsights(
    profile: CustomerProfile,
    analysis: FinancialAnalysis,
    recommendations: ActionRecommendation[],
    forceDeterministic: boolean
  ): Promise<AiAdvisoryInsight> {
    const res = await fetch(`${API_BASE}/ai-insights`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profile,
        analysis,
        recommendations,
        forceDeterministic
      })
    });

    if (!res.ok) throw new Error('Failed to generate insights');
    return await res.json();
  }
}
