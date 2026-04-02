/**
 * Zipminator Model Router (Phase 2 Scaffold)
 * Handles dynamic routing across multi-LLM providers based on user subscription tier.
 */

export type SubscriptionTier = 'free' | 'premium' | 'enterprise';

export interface ModelProvider {
  name: string;
  weight: number;
  costCoefficient: number;
  capabilities: ('fast' | 'reasoning' | 'deep-research')[];
}

const FREE_TIER_PROVIDERS: Record<string, ModelProvider> = {
  'gemini-3-flash': { name: 'Gemini 3 Flash', weight: 1.0, costCoefficient: 0, capabilities: ['fast'] },
  'kimiki-fast':    { name: 'Kimiki', weight: 0.8, costCoefficient: 0, capabilities: ['fast'] },
  'sonnet-tier0':   { name: 'Sonnet (Free tier)', weight: 0.9, costCoefficient: 0, capabilities: ['fast', 'reasoning'] }
};

const PREMIUM_TIER_PROVIDERS: Record<string, ModelProvider> = {
  'claude-code':    { name: 'Claude Code ($200 cap)', weight: 1.0, costCoefficient: 1.5, capabilities: ['deep-research', 'reasoning'] },
  'deepseek-max':   { name: 'Deepseek Max', weight: 0.9, costCoefficient: 1.2, capabilities: ['deep-research'] },
  'glm-advanced':   { name: 'GLM Advanced', weight: 0.85, costCoefficient: 1.0, capabilities: ['reasoning'] },
  'ruflo-gh':       { name: 'Ruflo (GH integration)', weight: 0.95, costCoefficient: 1.8, capabilities: ['reasoning', 'deep-research'] }
};

/**
 * Routes a query to the optimal model based on tier and task required capabilities.
 */
export class ModelRouter {
  
  static routeQuery(tier: SubscriptionTier, taskType: 'fast' | 'reasoning' | 'deep-research') {
    const pool = tier === 'free' ? FREE_TIER_PROVIDERS : PREMIUM_TIER_PROVIDERS;
    
    // Filter by required capability
    const candidates = Object.values(pool).filter(p => p.capabilities.includes(taskType));
    
    if (candidates.length === 0) {
      // Fallback
      return pool[Object.keys(pool)[0]];
    }

    // Sort by weight/cost trade-off (simplified version)
    return candidates.sort((a, b) => b.weight - a.weight)[0];
  }
}
