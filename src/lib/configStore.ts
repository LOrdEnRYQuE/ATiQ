"use client";

import { create } from "zustand";
import { supabase } from "./supabaseClient";

type FeatureFlagRow = { key: string; value: Record<string, unknown> };
type GlobalConfigRow = { key: string; value: unknown };

export type RemoteConfig = {
  flags: Record<string, unknown> | null;
  prompt: { active_prompt?: string; version?: string; [k: string]: unknown } | null;
};

type State = RemoteConfig & {
  loading: boolean;
  error: string | null;
};

type Actions = {
  initialize: () => Promise<void>;
};

const initialState: State = {
  flags: null,
  prompt: null,
  loading: false,
  error: null,
};

export const useConfigStore = create<State & Actions>((set) => ({
  ...initialState,
  initialize: async () => {
    if (!supabase) {
      set({ loading: false, error: null });
      return;
    }
    set({ loading: true, error: null });

    try {
      const [flagsRes, promptRes] = await Promise.all([
        supabase.from("feature_flags").select("key,value"),
        supabase
          .from("global_config")
          .select("key,value")
          .in("key", ["system_prompt", "prompt_active", "prompt_version"]),
      ]);

      const flagsMap: Record<string, unknown> = {};
      if (!flagsRes.error && flagsRes.data) {
        (flagsRes.data as FeatureFlagRow[]).forEach((row) => {
          flagsMap[row.key] = row.value;
        });
      }

      const prompt: Record<string, unknown> = {};
      if (!promptRes.error && promptRes.data) {
        (promptRes.data as GlobalConfigRow[]).forEach((row) => {
          if (row.key === "system_prompt") prompt.active_prompt = row.value;
          else prompt[row.key] = row.value;
        });
      }

      set({
        flags: Object.keys(flagsMap).length ? flagsMap : null,
        prompt: Object.keys(prompt).length ? prompt : null,
        loading: false,
        error: null,
      });

      // Realtime subscriptions
      const channel = supabase.channel("config-changes");
      channel
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "feature_flags",
          },
          (payload) => {
            set((prev) => ({
              flags: { ...(prev.flags ?? {}), [payload.new.key]: (payload.new as FeatureFlagRow).value },
            }));
          }
        )
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "feature_flags",
          },
          (payload) => {
            set((prev) => ({
              flags: { ...(prev.flags ?? {}), [payload.new.key]: (payload.new as FeatureFlagRow).value },
            }));
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "global_config",
          },
          (payload) => {
            const key = (payload.new as GlobalConfigRow).key;
            const value = (payload.new as GlobalConfigRow).value;
            set((prev) => {
              const nextPrompt: Record<string, unknown> = { ...(prev.prompt ?? {}) };
              if (key === "system_prompt") nextPrompt.active_prompt = value;
              else nextPrompt[key] = value;
              return { prompt: nextPrompt };
            });
          }
        )
        .subscribe();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "config fetch failed";
      set({ error: message, loading: false });
    }
  },
}));

export const selectConfig = (state: State) => ({ flags: state.flags, prompt: state.prompt });
export const selectConfigLoading = (state: State) => state.loading;
