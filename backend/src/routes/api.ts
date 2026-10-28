import { Router, Request, Response } from 'express';
import { FinancialCalculationService } from '../services/calculationService';
import { RecommendationEngine } from '../services/recommendationEngine';
import { AiAdvisoryService } from '../services/aiService';
import { ClientService } from '../services/clientService';
import { checkDatabaseHealth } from '../db/pool';
import { CustomerProfile } from '../models/types';
import { z } from 'zod';

const router = Router();

// Validation schema for incoming customer profile
const GoalInputSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Goal name is required'),
  category: z.enum(['RETIREMENT', 'EDUCATION', 'MARRIAGE', 'HOME', 'EMERGENCY', 'WEALTH', 'OTHER']).optional().default('OTHER'),
  targetAge: z.coerce.number().min(0).optional(),
  targetYears: z.coerce.number().min(0).optional().default(5),
  targetAmount: z.coerce.number().min(0).optional().default(0),
  inflationRate: z.coerce.number().min(0).optional().default(6.0),
  expectedReturnPre: z.coerce.number().min(0).optional().default(10.0),
  expectedReturnPost: z.coerce.number().min(0).optional().default(7.0),
  existingSavings: z.coerce.number().min(0).optional().default(0),
  monthlyContribution: z.coerce.number().min(0).optional().default(0),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional().default('MEDIUM'),
  planningHorizonAge: z.coerce.number().min(0).optional().default(80),
  metadata: z.record(z.any()).optional().default({})
});

const CustomerInputSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Customer name is required'),
  age: z.coerce.number().min(18, 'Age must be at least 18').max(100, 'Age must be under 100'),
  occupation: z.string().optional(),
  dependantsCount: z.coerce.number().min(0, 'Dependants cannot be negative'),
  monthlyIncome: z.coerce.number().min(0, 'Income cannot be negative'),
  monthlyExpenses: z.coerce.number().min(0, 'Expenses cannot be negative'),
  monthlyEmi: z.coerce.number().min(0, 'EMI cannot be negative').optional().default(0),
  existingSavings: z.coerce.number().min(0, 'Savings cannot be negative'),
  existingLiabilities: z.coerce.number().min(0, 'Liabilities cannot be negative').optional().default(0),
  existingInsuranceCover: z.coerce.number().min(0, 'Insurance cover cannot be negative'),
  primaryGoal: z.string().optional(),
  goalTimeline: z.coerce.number().min(0).optional().default(0),
  goals: z.array(GoalInputSchema).optional().default([]),
  riskAppetite: z.enum(['CONSERVATIVE', 'MODERATE', 'AGGRESSIVE']).optional().default('MODERATE'),
  notes: z.string().optional()
});

/**
 * Healthcheck & Configuration Status
 * Includes live database connection state and AI model availability.
 */
router.get('/health', async (_req: Request, res: Response) => {
  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
  const dbHealth = await checkDatabaseHealth();

  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: {
      connected: dbHealth.isConnected,
      storageMode: ClientService.getStorageMode(),
      message: dbHealth.message,
      host: dbHealth.host,
      port: dbHealth.port,
      database: dbHealth.database,
      version: dbHealth.version || 'PostgreSQL 17 Compatible'
    },
    aiEngineAvailable: hasGeminiKey ? 'Gemini 1.5 Flash (Live Key Detected)' : 'Deterministic Local Fallback Mode',
    service: 'Axis Max Life Customer Need Analysis Engine'
  });
});

/**
 * List all customer profiles
 */
router.get('/clients', async (_req: Request, res: Response) => {
  try {
    const clients = await ClientService.getAllClients();
    res.json(clients);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve clients', details: err.message });
  }
});

/**
 * Get single customer profile by ID
 */
router.get('/clients/:id', async (req: Request, res: Response) => {
  try {
    const clientId = String(req.params.id);
    const client = await ClientService.getClientById(clientId);
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }
    res.json(client);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve client', details: err.message });
  }
});

/**
 * Create or save customer profile
 */
router.post('/clients', async (req: Request, res: Response) => {
  try {
    console.log('[API POST /clients]: Incoming client:', req.body?.name || req.body?.full_name);
    const validated = CustomerInputSchema.parse(req.body);
    const saved = await ClientService.saveClient(validated as Partial<CustomerProfile>);
    console.log('[API POST /clients]: Saved successfully:', saved.id, saved.name);
    res.status(201).json(saved);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      console.error('[API POST /clients]: Validation error:', JSON.stringify(err.errors));
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    console.error('[API POST /clients]: Internal error:', err.message);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

/**
 * Update customer profile by ID
 */
router.put('/clients/:id', async (req: Request, res: Response) => {
  try {
    const clientId = String(req.params.id);
    const validated = CustomerInputSchema.partial().parse(req.body);
    const updated = await ClientService.updateClient(clientId, validated as Partial<CustomerProfile>);
    if (!updated) {
      return res.status(404).json({ error: 'Client not found or update failed' });
    }
    res.json(updated);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

/**
 * Delete customer profile by ID
 */
router.delete('/clients/:id', async (req: Request, res: Response) => {
  try {
    const clientId = String(req.params.id);
    const success = await ClientService.deleteClient(clientId);
    if (!success) {
      return res.status(404).json({ error: 'Client not found or already deleted' });
    }
    res.json({ message: 'Client deleted successfully', id: clientId });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete client', details: err.message });
  }
});

/**
 * Reset default demo profiles
 */
router.post('/clients/reset', async (_req: Request, res: Response) => {
  try {
    const defaults = await ClientService.resetToDefault();
    res.json({ message: 'Reset to default clients successfully', clients: defaults });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to reset clients', details: err.message });
  }
});

/**
 * Primary Analysis Endpoint:
 * Independent of persistence; recalculates all financial metrics from raw validated inputs.
 * Derives prioritized recommendations and generates AI advisor insights.
 */
router.post('/analyze', async (req: Request, res: Response) => {
  try {
    const validated = CustomerInputSchema.parse(req.body);
    const profile: CustomerProfile = {
      id: validated.id || 'temp_profile',
      name: validated.name,
      age: validated.age,
      occupation: validated.occupation || 'Professional',
      dependantsCount: validated.dependantsCount,
      monthlyIncome: validated.monthlyIncome,
      monthlyExpenses: validated.monthlyExpenses,
      monthlyEmi: validated.monthlyEmi,
      existingSavings: validated.existingSavings,
      existingLiabilities: validated.existingLiabilities,
      existingInsuranceCover: validated.existingInsuranceCover,
      primaryGoal: validated.primaryGoal,
      goalTimeline: validated.goalTimeline,
      goals: (validated.goals as any[]) || [],
      riskAppetite: validated.riskAppetite,
      notes: validated.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 1. Deterministic Financial Mathematics (Never trusts client-supplied calculated totals)
    const analysis = FinancialCalculationService.analyzeCustomer(profile);

    // 2. Prioritized Action Recommendations
    const recommendations = RecommendationEngine.generateRecommendations(profile, analysis);

    // 3. AI / Advisor Insights
    const forceDeterministic = req.query.mode === 'deterministic';
    const aiInsights = await AiAdvisoryService.generateInsights(
      profile,
      analysis,
      recommendations,
      forceDeterministic
    );

    res.json({
      customer: profile,
      analysis,
      recommendations,
      aiInsights
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    console.error('[API /analyze Error]:', err);
    res.status(500).json({ error: err.message || 'Analysis processing failed' });
  }
});

/**
 * Standalone AI Insights refresh endpoint (allows toggling live vs deterministic)
 */
router.post('/ai-insights', async (req: Request, res: Response) => {
  try {
    const { profile, analysis, recommendations, forceDeterministic } = req.body;
    if (!profile || !analysis || !recommendations) {
      return res.status(400).json({ error: 'Missing analysis context' });
    }

    const aiInsights = await AiAdvisoryService.generateInsights(
      profile,
      analysis,
      recommendations,
      Boolean(forceDeterministic)
    );

    res.json(aiInsights);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to generate AI insights' });
  }
});

export default router;
