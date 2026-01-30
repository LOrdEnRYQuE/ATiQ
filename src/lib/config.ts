import { createClient } from './supabaseClient';
import { telemetry } from './telemetry';

interface GlobalConfig {
  maintenance_mode: boolean;
  default_model: string;
  enable_repair_agent: boolean;
  enable_voice_coding: boolean;
  token_limit_per_hour: number;
  system_prompt?: string;
  system_prompt_v1?: string;
  system_prompt_v2?: string;
}

class ConfigService {
  private cache: Map<string, unknown> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  async getConfig<T = unknown>(key: string): Promise<T | null> {
    // Check cache first
    const cached = this.cache.get(key);
    const expiry = this.cacheExpiry.get(key);
    
    if (cached && expiry && Date.now() < expiry) {
      return cached as T;
    }

    try {
      const supabase = createClient();
      if (!supabase) return null;

      const { data, error } = await supabase
        .from('global_config')
        .select('value')
        .eq('key', key)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        console.warn(`Config key "${key}" not found:`, error);
        return null;
      }

      // Cache the result
      this.cache.set(key, data.value);
      this.cacheExpiry.set(key, Date.now() + this.CACHE_DURATION);

      // Log config usage
      await telemetry.featureUsed('config_fetch', { key });

      return data.value;
    } catch (error) {
      console.error(`Error fetching config "${key}":`, error);
      return null;
    }
  }

  async getAllConfig(): Promise<Partial<GlobalConfig>> {
    const configKeys = [
      'maintenance_mode',
      'default_model', 
      'enable_repair_agent',
      'enable_voice_coding',
      'token_limit_per_hour',
      'system_prompt',
      'system_prompt_v1',
      'system_prompt_v2'
    ];

    const config: Partial<GlobalConfig> = {};
    
    await Promise.all(
      configKeys.map(async (key) => {
        const value = await this.getConfig(key);
        if (value !== null) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (config as any)[key] = value;
        }
      })
    );

    return config;
  }

  async getSystemPrompt(): Promise<string> {
    // Check for A/B test assignments first
    const prompt = await this.getExperimentPrompt();
    if (prompt) return prompt;

    // Fallback to active system prompt
    const v2 = await this.getConfig<string>('system_prompt_v2');
    if (v2) return v2;

    const v1 = await this.getConfig<string>('system_prompt_v1');
    if (v1) return v1;

    // Final fallback
    return "You are an expert AI coding assistant. Help users write, debug, and improve their code.";
  }

  private async getExperimentPrompt(): Promise<string | null> {
    try {
      const supabase = createClient();
      if (!supabase) return null;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Check if user is in any active experiments
      const { data: assignments } = await supabase
        .from('experiment_assignments')
        .select(`
          variant,
          experiments!inner(
            config_key,
            status,
            variants
          )
        `)
        .eq('user_id', user.id)
        .in('experiments.status', ['active']);

      if (!assignments || assignments.length === 0) return null;

      // Find the first matching experiment for system prompts
      for (const assignment of assignments) {
        const experiment = assignment.experiments as unknown as { config_key: string; status: string; variants: Record<string, { value: string }> };
        if (experiment.config_key.startsWith('system_prompt')) {
          const variant = experiment.variants[assignment.variant];
          if (variant?.value) {
            await telemetry.featureUsed('ab_test_prompt', {
              experiment: experiment.config_key,
              variant: assignment.variant
            });
            return variant.value;
          }
        }
      }

      return null;
    } catch (error) {
      console.warn('Error checking experiment prompts:', error);
      return null;
    }
  }

  async isFeatureEnabled(feature: string): Promise<boolean> {
    const value = await this.getConfig<boolean>(feature);
    return value === true;
  }

  async getDefaultModel(): Promise<string> {
    const model = await this.getConfig<string>('default_model');
    return model || 'claude-3.5-sonnet';
  }

  async isMaintenanceMode(): Promise<boolean> {
    const maintenance = await this.getConfig<boolean>('maintenance_mode');
    return maintenance === true;
  }

  // Clear cache for testing or force refresh
  clearCache(key?: string): void {
    if (key) {
      this.cache.delete(key);
      this.cacheExpiry.delete(key);
    } else {
      this.cache.clear();
      this.cacheExpiry.clear();
    }
  }

  // Preload critical configs
  async preloadCriticalConfigs(): Promise<void> {
    const criticalKeys = [
      'maintenance_mode',
      'default_model',
      'enable_repair_agent'
    ];

    await Promise.all(
      criticalKeys.map(key => this.getConfig(key))
    );
  }
}

// Singleton instance
export const config = new ConfigService();

// React hook for config
export function useConfig<T = unknown>(key: string) {
  // This would typically use React hooks, but for simplicity here's a basic version
  // In a real implementation, you'd use useState and useEffect for reactive updates
  return {
    value: config.getConfig<T>(key),
    refresh: () => config.clearCache(key)
  };
}

// Hook for system prompt with A/B testing
export async function getSystemPromptWithTracking(): Promise<string> {
  const prompt = await config.getSystemPrompt();
  await telemetry.promptUsed('unknown', 'unknown', { length: prompt.length });
  return prompt;
}
