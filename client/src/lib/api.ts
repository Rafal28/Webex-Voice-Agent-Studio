import type { Agent, InsertAgent, Evaluation, InsertEvaluation } from "@shared/schema";

const API_BASE = "/api";

export const agentsApi = {
  create: async (data: InsertAgent): Promise<Agent> => {
    const res = await fetch(`${API_BASE}/agents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  getAll: async (): Promise<Agent[]> => {
    const res = await fetch(`${API_BASE}/agents`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  getById: async (id: number): Promise<Agent> => {
    const res = await fetch(`${API_BASE}/agents/${id}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
};

export const evaluationsApi = {
  create: async (data: InsertEvaluation): Promise<Evaluation> => {
    const res = await fetch(`${API_BASE}/evaluations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  getByAgent: async (agentId: number): Promise<Evaluation[]> => {
    const res = await fetch(`${API_BASE}/evaluations/agent/${agentId}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
};

export interface TTSRequest {
  text: string;
  voice: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";
  model?: "tts-1" | "tts-1-hd";
}

export interface TTSResponse {
  audio: string;
  contentType: string;
}

export const ttsApi = {
  generate: async (data: TTSRequest): Promise<TTSResponse> => {
    const res = await fetch(`${API_BASE}/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to generate speech");
    }
    return res.json();
  },
};
