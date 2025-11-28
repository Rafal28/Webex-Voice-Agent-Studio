import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAgentSchema, insertEvaluationSchema } from "@shared/schema";
import { fromError } from "zod-validation-error";
import OpenAI from "openai";
import { z } from "zod";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ttsRequestSchema = z.object({
  text: z.string().min(1).max(4096),
  voice: z.enum(["alloy", "echo", "fable", "onyx", "nova", "shimmer"]),
  model: z.enum(["tts-1", "tts-1-hd"]).default("tts-1"),
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  app.post("/api/agents", async (req, res) => {
    try {
      const data = insertAgentSchema.parse(req.body);
      const agent = await storage.createAgent(data);
      res.json(agent);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: fromError(error).toString() });
      }
      res.status(500).json({ error: "Failed to create agent" });
    }
  });

  app.get("/api/agents", async (_req, res) => {
    try {
      const agents = await storage.getAllAgents();
      res.json(agents);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch agents" });
    }
  });

  app.get("/api/agents/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid agent ID" });
      }
      const agent = await storage.getAgent(id);
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }
      res.json(agent);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch agent" });
    }
  });

  app.post("/api/evaluations", async (req, res) => {
    try {
      const data = insertEvaluationSchema.parse(req.body);
      const evaluation = await storage.createEvaluation(data);
      res.json(evaluation);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: fromError(error).toString() });
      }
      res.status(500).json({ error: "Failed to create evaluation" });
    }
  });

  app.get("/api/evaluations/agent/:agentId", async (req, res) => {
    try {
      const agentId = parseInt(req.params.agentId);
      if (isNaN(agentId)) {
        return res.status(400).json({ error: "Invalid agent ID" });
      }
      const evaluations = await storage.getEvaluationsByAgent(agentId);
      res.json(evaluations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch evaluations" });
    }
  });

  app.post("/api/tts", async (req, res) => {
    try {
      if (!process.env.OPENAI_API_KEY) {
        return res.status(503).json({ 
          error: "Text-to-speech is not configured. Please add your OpenAI API key." 
        });
      }

      const data = ttsRequestSchema.parse(req.body);
      
      const mp3 = await openai.audio.speech.create({
        model: data.model,
        voice: data.voice,
        input: data.text,
      });

      const buffer = Buffer.from(await mp3.arrayBuffer());
      const base64Audio = buffer.toString("base64");

      res.json({ 
        audio: base64Audio,
        contentType: "audio/mpeg"
      });
    } catch (error: any) {
      console.error("TTS Error:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ error: fromError(error).toString() });
      }
      if (error.status === 401) {
        return res.status(401).json({ error: "Invalid OpenAI API key" });
      }
      res.status(500).json({ error: "Failed to generate speech" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
