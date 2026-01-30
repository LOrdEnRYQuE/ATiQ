"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { Editor } from "@monaco-editor/react";
import { Save, Play, Pause, RotateCcw, GitBranch, BarChart3, Plus, Trash2 } from "lucide-react";

interface PromptConfig {
  id: string;
  key: string;
  value: string;
  description: string;
  version: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Experiment {
  id: string;
  name: string;
  description: string;
  config_key: string;
  variants: Record<string, { value: string; weight: number }>;
  status: 'draft' | 'active' | 'paused' | 'completed';
  start_date: string;
  end_date: string;
  created_at: string;
}

export default function PromptLab() {
  const [prompts, setPrompts] = useState<PromptConfig[]>([]);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<PromptConfig | null>(null);
  const [editorValue, setEditorValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showNewExperiment, setShowNewExperiment] = useState(false);
  const [newExperiment, setNewExperiment] = useState({
    name: "",
    description: "",
    config_key: "",
    variants: { A: { value: "", weight: 50 }, B: { value: "", weight: 50 } }
  });

  const supabase = createClient();

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    try {
      const { data: promptData } = await supabase
        .from('global_config')
        .select('*')
        .like('key', 'system_prompt%')
        .order('created_at', { ascending: false });

      const { data: experimentData } = await supabase
        .from('experiments')
        .select('*')
        .order('created_at', { ascending: false });

      setPrompts(promptData || []);
      setExperiments(experimentData || []);
      
      if (promptData && promptData.length > 0) {
        setSelectedPrompt(promptData[0]);
        setEditorValue(promptData[0].value);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePrompt = async () => {
    if (!selectedPrompt) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('global_config')
        .update({ 
          value: editorValue,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedPrompt.id);

      if (error) throw error;

      // Update local state
      setPrompts(prev => prev.map(p => 
        p.id === selectedPrompt.id 
          ? { ...p, value: editorValue, updated_at: new Date().toISOString() }
          : p
      ));

      alert('Prompt saved successfully!');
    } catch (error) {
      console.error('Error saving prompt:', error);
      alert('Error saving prompt');
    } finally {
      setSaving(false);
    }
  };

  const createNewVersion = async () => {
    if (!selectedPrompt) return;

    const newVersion = prompt('Enter new version number (e.g., 1.1.0):');
    if (!newVersion) return;

    try {
      const newKey = `system_prompt_v${newVersion}`;
      const { error } = await supabase
        .from('global_config')
        .insert({
          key: newKey,
          value: editorValue,
          description: `Version ${newVersion} of system prompt`,
          version: newVersion,
          is_active: false
        });

      if (error) throw error;

      await fetchData();
      alert('New version created!');
    } catch (error) {
      console.error('Error creating version:', error);
      alert('Error creating version');
    }
  };

  const createExperiment = async () => {
    try {
      const { error } = await supabase
        .from('experiments')
        .insert({
          name: newExperiment.name,
          description: newExperiment.description,
          config_key: newExperiment.config_key,
          variants: newExperiment.variants,
          status: 'draft'
        });

      if (error) throw error;

      await fetchData();
      setShowNewExperiment(false);
      setNewExperiment({
        name: "",
        description: "",
        config_key: "",
        variants: { A: { value: "", weight: 50 }, B: { value: "", weight: 50 } }
      });
      alert('Experiment created!');
    } catch (error) {
      console.error('Error creating experiment:', error);
      alert('Error creating experiment');
    }
  };

  const toggleExperiment = async (experimentId: string, status: 'active' | 'paused') => {
    try {
      const { error } = await supabase
        .from('experiments')
        .update({ 
          status,
          start_date: status === 'active' ? new Date().toISOString() : null,
          end_date: status === 'paused' ? new Date().toISOString() : null
        })
        .eq('id', experimentId);

      if (error) throw error;

      setExperiments(prev => prev.map(e => 
        e.id === experimentId ? { ...e, status } : e
      ));
    } catch (error) {
      console.error('Error toggling experiment:', error);
    }
  };

  const deleteExperiment = async (experimentId: string) => {
    if (!confirm('Are you sure you want to delete this experiment?')) return;

    try {
      const { error } = await supabase
        .from('experiments')
        .delete()
        .eq('id', experimentId);

      if (error) throw error;

      setExperiments(prev => prev.filter(e => e.id !== experimentId));
    } catch (error) {
      console.error('Error deleting experiment:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
          <GitBranch className="w-8 h-8 text-purple-400" />
          Prompt Engineering Lab
        </h1>
        <p className="text-gray-400">Version, test, and deploy AI prompts without code changes</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Prompt Editor */}
        <div className="lg:col-span-2 space-y-6">
          {/* Prompt Selector */}
          <div className="bg-[#111] border border-[#222] rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Select Prompt</h3>
              <button
                onClick={createNewVersion}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-lg hover:bg-purple-500/20 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                New Version
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {prompts.map((prompt) => (
                <button
                  key={prompt.id}
                  onClick={() => {
                    setSelectedPrompt(prompt);
                    setEditorValue(prompt.value);
                  }}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    selectedPrompt?.id === prompt.id
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-[#333] hover:border-[#555]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{prompt.key}</span>
                    {prompt.is_active && (
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">Active</span>
                    )}
                  </div>
                  <span className="text-sm text-gray-400">v{prompt.version}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Editor */}
          <div className="bg-[#111] border border-[#222] rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Editor</h3>
              <button
                onClick={savePrompt}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 transition-colors"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
            <div className="border border-[#333] rounded-lg overflow-hidden">
              <Editor
                height="400px"
                language="markdown"
                theme="vs-dark"
                value={editorValue}
                onChange={(value: string | undefined) => setEditorValue(value || "")}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                }}
              />
            </div>
          </div>
        </div>

        {/* Experiments */}
        <div className="space-y-6">
          <div className="bg-[#111] border border-[#222] rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                A/B Tests
              </h3>
              <button
                onClick={() => setShowNewExperiment(true)}
                className="p-2 bg-purple-500/10 border border-purple-500/20 rounded-lg hover:bg-purple-500/20 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {experiments.map((experiment) => (
                <div key={experiment.id} className="p-3 bg-[#0a0a0a] rounded-lg border border-[#333]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{experiment.name}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleExperiment(
                          experiment.id, 
                          experiment.status === 'active' ? 'paused' : 'active'
                        )}
                        className={`p-1 rounded ${experiment.status === 'active' ? 'text-green-400' : 'text-gray-400'}`}
                      >
                        {experiment.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => deleteExperiment(experiment.id)}
                        className="p-1 rounded text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-400 mb-2">{experiment.description}</p>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs rounded ${
                      experiment.status === 'active' ? 'bg-green-500/20 text-green-400' :
                      experiment.status === 'paused' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {experiment.status}
                    </span>
                    <span className="text-xs text-gray-500">
                      {Object.keys(experiment.variants).length} variants
                    </span>
                  </div>
                </div>
              ))}
              
              {experiments.length === 0 && (
                <div className="text-center text-gray-400 py-8">
                  No experiments yet. Create one to start A/B testing!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* New Experiment Modal */}
      {showNewExperiment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-8 z-50">
          <div className="bg-[#111] border border-[#222] rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">Create A/B Test</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Name</label>
                <input
                  type="text"
                  value={newExperiment.name}
                  onChange={(e) => setNewExperiment(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#333] rounded-lg focus:border-purple-500 outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={newExperiment.description}
                  onChange={(e) => setNewExperiment(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#333] rounded-lg focus:border-purple-500 outline-none h-20"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Config Key</label>
                <select
                  value={newExperiment.config_key}
                  onChange={(e) => setNewExperiment(prev => ({ ...prev, config_key: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#333] rounded-lg focus:border-purple-500 outline-none"
                >
                  <option value="">Select a prompt</option>
                  {prompts.map((prompt) => (
                    <option key={prompt.id} value={prompt.key}>{prompt.key}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setShowNewExperiment(false)}
                className="px-4 py-2 border border-[#333] rounded-lg hover:bg-[#0a0a0a] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createExperiment}
                disabled={!newExperiment.name || !newExperiment.config_key}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 transition-colors"
              >
                Create Experiment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
