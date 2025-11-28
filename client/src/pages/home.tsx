import { Link } from "wouter";
import { motion } from "framer-motion";
import { Mic, BarChart2, ArrowRight, Radio, Layers, Bot } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { agentsApi } from "@/lib/api";
import heroBg from "@assets/generated_images/Abstract_sound_waves_visualization_010bae0d.png";

export default function Home() {
  const { data: agents = [] } = useQuery({
    queryKey: ["agents"],
    queryFn: agentsApi.getAll,
  });

  const latestAgent = agents.length > 0 ? agents[agents.length - 1] : null;

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden font-sans">
      <div className="absolute inset-0 z-0 opacity-20">
        <img 
          src={heroBg} 
          alt="Background" 
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-20 flex flex-col items-center justify-center min-h-screen">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 max-w-3xl"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
            <Bot className="w-4 h-4" />
            <span>Next-Gen Voice Agents</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-display font-bold mb-6 tracking-tight leading-tight">
            Webex AI <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">Podcaster</span>
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Design personalized voice agents for the Webex ecosystem. 
            Build custom personas and evaluate speech quality in real-time.
          </p>
          {agents.length > 0 && (
            <p className="text-sm text-muted-foreground mt-4" data-testid="text-agent-count">
              {agents.length} agent{agents.length !== 1 ? 's' : ''} created
            </p>
          )}
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl">
          <Link href="/build">
            <motion.div 
              whileHover={{ scale: 1.02, translateY: -5 }}
              whileTap={{ scale: 0.98 }}
              className="group cursor-pointer relative overflow-hidden rounded-3xl border border-white/10 bg-card/50 backdrop-blur-sm p-8 hover:bg-card/80 transition-all duration-300 shadow-lg hover:shadow-primary/20 hover:border-primary/50"
              data-testid="card-build-mode"
            >
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                <Layers className="w-32 h-32 -mt-10 -mr-10" />
              </div>
              
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20">
                <Mic className="w-7 h-7 text-white" />
              </div>
              
              <h2 className="text-2xl font-display font-bold mb-3 group-hover:text-primary transition-colors">Build Agent</h2>
              <p className="text-muted-foreground mb-8">
                Configure voice, language, gender, and LLM backend to create a unique podcasting persona.
              </p>
              
              <div className="flex items-center text-sm font-medium text-primary group-hover:translate-x-1 transition-transform">
                Start Building <ArrowRight className="w-4 h-4 ml-2" />
              </div>
            </motion.div>
          </Link>

          <Link href={latestAgent ? `/evaluate?agentId=${latestAgent.id}` : "/build"}>
            <motion.div 
              whileHover={{ scale: 1.02, translateY: -5 }}
              whileTap={{ scale: 0.98 }}
              className="group cursor-pointer relative overflow-hidden rounded-3xl border border-white/10 bg-card/50 backdrop-blur-sm p-8 hover:bg-card/80 transition-all duration-300 shadow-lg hover:shadow-purple-500/20 hover:border-purple-500/50"
              data-testid="card-evaluate-mode"
            >
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                <Radio className="w-32 h-32 -mt-10 -mr-10" />
              </div>
              
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-400 flex items-center justify-center mb-6 shadow-lg shadow-purple-500/20">
                <BarChart2 className="w-7 h-7 text-white" />
              </div>
              
              <h2 className="text-2xl font-display font-bold mb-3 group-hover:text-purple-400 transition-colors">Evaluate</h2>
              <p className="text-muted-foreground mb-8">
                Test text-to-speech quality attributes, naturalness, and analyze agent responses.
              </p>
              
              <div className="flex items-center text-sm font-medium text-purple-400 group-hover:translate-x-1 transition-transform">
                {latestAgent ? `Evaluate ${latestAgent.name}` : "Create an Agent First"} <ArrowRight className="w-4 h-4 ml-2" />
              </div>
            </motion.div>
          </Link>
        </div>
      </div>
    </div>
  );
}
