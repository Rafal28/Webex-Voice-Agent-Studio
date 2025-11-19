import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Mic, Play, Pause, Send, Download, Settings2, Volume2, RefreshCw, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

export default function Evaluate() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [inputText, setInputText] = useState("Welcome to the Webex AI Podcaster evaluation. I am ready to assist you.");
  const [generatedAudio, setGeneratedAudio] = useState(true); // Mock state
  
  // Evaluation Metrics
  const [ratings, setRatings] = useState({
    naturalness: 75,
    clarity: 85,
    intonation: 60,
    speed: 50
  });

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
      {/* Header */}
      <header className="border-b border-white/10 bg-background/50 backdrop-blur-md h-16 flex items-center px-6 justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
             <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-cyan-300 flex items-center justify-center">
                <Mic className="w-4 h-4 text-black" />
             </div>
             <div>
               <h1 className="font-display font-bold leading-none">Agent Alpha-1</h1>
               <span className="text-xs text-muted-foreground">GPT-4o • Alloy Voice • English</span>
             </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
           <Button variant="outline" size="sm" className="border-white/10 bg-white/5 hover:bg-white/10">
             <Settings2 className="w-4 h-4 mr-2" /> Settings
           </Button>
           <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
             <Download className="w-4 h-4 mr-2" /> Export Report
           </Button>
        </div>
      </header>

      <main className="flex-1 grid lg:grid-cols-12 gap-0 overflow-hidden">
        
        {/* LEFT: Chat / Input Area */}
        <div className="lg:col-span-7 flex flex-col border-r border-white/10 bg-card/20 p-6 overflow-y-auto">
           <div className="flex-1 space-y-6">
              {/* Agent Message Bubble */}
              <div className="flex gap-4 max-w-2xl">
                 <Avatar className="h-10 w-10 border border-primary/50">
                    <AvatarImage src="https://github.com/shadcn.png" />
                    <AvatarFallback className="bg-primary text-black font-bold">AI</AvatarFallback>
                 </Avatar>
                 <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">Agent Alpha-1</div>
                    <div className="p-4 rounded-2xl rounded-tl-none bg-white/5 border border-white/10 text-lg leading-relaxed">
                       {inputText}
                    </div>
                    {generatedAudio && (
                       <div className="flex items-center gap-3 pt-1">
                          <Button 
                            size="sm" 
                            variant="secondary" 
                            className="rounded-full h-8 px-4 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20"
                            onClick={() => setIsPlaying(!isPlaying)}
                          >
                            {isPlaying ? <Pause className="w-3 h-3 mr-2" /> : <Play className="w-3 h-3 mr-2" />}
                            {isPlaying ? "Pause Audio" : "Play Audio"}
                          </Button>
                          <span className="text-xs text-muted-foreground font-mono">00:04 / 00:12</span>
                          
                          {/* Fake waveform */}
                          <div className="flex items-center gap-0.5 h-4">
                             {[40, 60, 30, 80, 50, 90, 40, 60, 30, 50, 70, 40].map((h, i) => (
                               <div 
                                key={i} 
                                className={`w-0.5 rounded-full transition-all duration-300 ${isPlaying ? 'bg-primary animate-pulse' : 'bg-white/20'}`} 
                                style={{ height: `${isPlaying ? Math.random() * 100 : h}%` }}
                               />
                             ))}
                          </div>
                       </div>
                    )}
                 </div>
              </div>
           </div>

           {/* Input Area */}
           <div className="mt-8 pt-6 border-t border-white/10">
              <div className="relative">
                 <textarea 
                   className="w-full bg-background border border-white/10 rounded-xl p-4 pr-12 min-h-[100px] resize-none focus:ring-1 focus:ring-primary focus:border-primary transition-all text-base"
                   placeholder="Type something for the agent to say..."
                   value={inputText}
                   onChange={(e) => setInputText(e.target.value)}
                 />
                 <Button 
                   size="icon" 
                   className="absolute bottom-3 right-3 h-8 w-8 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
                 >
                   <Send className="w-4 h-4" />
                 </Button>
              </div>
              <div className="flex justify-between items-center mt-3 px-1">
                 <div className="flex gap-2">
                    <Badge variant="outline" className="bg-transparent border-white/10 text-xs font-normal text-muted-foreground hover:bg-white/5 cursor-pointer">Generate Response</Badge>
                    <Badge variant="outline" className="bg-transparent border-white/10 text-xs font-normal text-muted-foreground hover:bg-white/5 cursor-pointer">Regenerate Audio</Badge>
                 </div>
                 <span className="text-xs text-muted-foreground">CMD + Enter to send</span>
              </div>
           </div>
        </div>

        {/* RIGHT: Evaluation Panel */}
        <div className="lg:col-span-5 bg-background p-8 overflow-y-auto border-l border-white/5">
           <div className="mb-8">
              <h2 className="text-xl font-display font-semibold mb-2 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" /> 
                Quality Evaluation
              </h2>
              <p className="text-sm text-muted-foreground">Rate the generated speech quality based on the attributes below.</p>
           </div>

           <div className="space-y-8">
              
              {/* Naturalness */}
              <div className="space-y-4">
                 <div className="flex justify-between items-center">
                    <Label className="text-base font-medium">Naturalness</Label>
                    <span className="text-sm font-mono text-primary">{ratings.naturalness}%</span>
                 </div>
                 <Slider 
                   value={[ratings.naturalness]} 
                   onValueChange={(v) => setRatings({...ratings, naturalness: v[0]})}
                   max={100} 
                   step={1}
                   className="py-2"
                 />
                 <p className="text-xs text-muted-foreground">Does the voice sound human-like and authentic?</p>
              </div>

              <Separator className="bg-white/5" />

              {/* Clarity */}
              <div className="space-y-4">
                 <div className="flex justify-between items-center">
                    <Label className="text-base font-medium">Clarity & Pronunciation</Label>
                    <span className="text-sm font-mono text-primary">{ratings.clarity}%</span>
                 </div>
                 <Slider 
                   value={[ratings.clarity]} 
                   onValueChange={(v) => setRatings({...ratings, clarity: v[0]})}
                   max={100} 
                   step={1}
                   className="py-2"
                 />
                 <p className="text-xs text-muted-foreground">Are words pronounced clearly and correctly?</p>
              </div>

              <Separator className="bg-white/5" />

              {/* Intonation */}
              <div className="space-y-4">
                 <div className="flex justify-between items-center">
                    <Label className="text-base font-medium">Intonation & Emotion</Label>
                    <span className="text-sm font-mono text-primary">{ratings.intonation}%</span>
                 </div>
                 <Slider 
                   value={[ratings.intonation]} 
                   onValueChange={(v) => setRatings({...ratings, intonation: v[0]})}
                   max={100} 
                   step={1}
                   className="py-2"
                 />
                 <p className="text-xs text-muted-foreground">Does the speech have appropriate emotional range?</p>
              </div>

              <Separator className="bg-white/5" />

              {/* Speed */}
              <div className="space-y-4">
                 <div className="flex justify-between items-center">
                    <Label className="text-base font-medium">Speed & Pacing</Label>
                    <span className="text-sm font-mono text-primary">{ratings.speed}%</span>
                 </div>
                 <Slider 
                   value={[ratings.speed]} 
                   onValueChange={(v) => setRatings({...ratings, speed: v[0]})}
                   max={100} 
                   step={1}
                   className="py-2"
                 />
                 <p className="text-xs text-muted-foreground">Is the speaking rate comfortable to listen to?</p>
              </div>

              <div className="pt-6">
                 <Card className="bg-white/5 border-white/10 p-4">
                    <h3 className="font-medium mb-2 text-sm">AI Analysis</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                       The agent demonstrates high clarity but slightly monotonic intonation in this sample. 
                       Consider increasing the temperature parameter for more variability.
                    </p>
                 </Card>
              </div>

           </div>
        </div>

      </main>
    </div>
  );
}
