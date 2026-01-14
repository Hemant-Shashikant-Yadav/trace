import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Terminal, ArrowRight, Shield, Activity, FileCode } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        navigate("/dashboard");
      }
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background grid-pattern relative overflow-hidden">
      {/* Scan line overlay */}
      <div className="absolute inset-0 scanlines pointer-events-none" />
      
      {/* Decorative lines */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
      
      {/* Side decorations */}
      <div className="absolute left-0 top-1/4 w-1 h-1/2 bg-gradient-to-b from-transparent via-primary to-transparent opacity-30" />
      <div className="absolute right-0 top-1/4 w-1 h-1/2 bg-gradient-to-b from-transparent via-primary to-transparent opacity-30" />

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <Terminal className="w-8 h-8 text-primary" />
            <span className="text-xl font-display font-bold text-primary text-glow-primary tracking-widest">
              TRACE
            </span>
          </div>
        </header>

        {/* Hero */}
        <main className="flex-1 container mx-auto px-4 flex items-center justify-center">
          <div className="max-w-3xl text-center">
            <div className="mb-6">
              <span className="inline-block px-4 py-1 text-xs font-display tracking-widest text-primary border border-primary/30 rounded-sm bg-primary/5">
                GAME DEVELOPMENT ASSET MANAGEMENT
              </span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-display font-black text-foreground mb-6 leading-tight">
              <span className="text-primary text-glow-primary">TRACE</span>
              <br />
              YOUR ASSETS
            </h1>
            
            <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto leading-relaxed">
              Command center for game asset tracking. Monitor delivery status, 
              track implementation progress, and maintain project health at a glance.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => navigate("/auth")}
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-display tracking-wider glow-primary text-lg px-8"
              >
                INITIALIZE SYSTEM
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>

            {/* Feature highlights */}
            <div className="mt-20 grid md:grid-cols-3 gap-6">
              <div className="command-border bg-card/50 p-6 rounded-sm text-left">
                <Activity className="w-8 h-8 text-primary mb-4" />
                <h3 className="font-display text-sm tracking-wider text-foreground mb-2">
                  PROJECT HEALTH
                </h3>
                <p className="text-muted-foreground text-sm">
                  Real-time monitoring with risk indicators when assets fall behind.
                </p>
              </div>
              
              <div className="command-border bg-card/50 p-6 rounded-sm text-left">
                <FileCode className="w-8 h-8 text-primary mb-4" />
                <h3 className="font-display text-sm tracking-wider text-foreground mb-2">
                  ZIP IMPORT
                </h3>
                <p className="text-muted-foreground text-sm">
                  Import asset structure directly from .zip files. No upload required.
                </p>
              </div>
              
              <div className="command-border bg-card/50 p-6 rounded-sm text-left">
                <Shield className="w-8 h-8 text-primary mb-4" />
                <h3 className="font-display text-sm tracking-wider text-foreground mb-2">
                  STATUS TRACKING
                </h3>
                <p className="text-muted-foreground text-sm">
                  Track pending, received, and implemented states with timestamps.
                </p>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="container mx-auto px-4 py-6 text-center">
          <p className="text-muted-foreground/50 text-xs font-mono">
            SYS.VERSION 1.0.0 // COMMAND CENTER INITIALIZED
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
