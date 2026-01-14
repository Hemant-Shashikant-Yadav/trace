import { AlertTriangle, CheckCircle2, Activity } from "lucide-react";

interface ProjectHealthBarProps {
  percentage: number;
  isHighRisk: boolean;
  totalAssets: number;
  implementedAssets: number;
}

export const ProjectHealthBar = ({
  percentage,
  isHighRisk,
  totalAssets,
  implementedAssets,
}: ProjectHealthBarProps) => {
  return (
    <div className="command-border bg-card/80 backdrop-blur-sm p-6 rounded-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-primary" />
          <h2 className="font-display text-sm tracking-wider text-foreground">
            PROJECT HEALTH
          </h2>
        </div>
        
        {isHighRisk ? (
          <div className="flex items-center gap-2 text-destructive glow-red rounded px-3 py-1 bg-destructive/10 border border-destructive/30">
            <AlertTriangle className="w-4 h-4 pulse-glow" />
            <span className="font-display text-xs tracking-wider text-glow-red">
              HIGH RISK
            </span>
          </div>
        ) : totalAssets > 0 ? (
          <div className="flex items-center gap-2 text-success glow-green rounded px-3 py-1 bg-success/10 border border-success/30">
            <CheckCircle2 className="w-4 h-4" />
            <span className="font-display text-xs tracking-wider">
              ON TRACK
            </span>
          </div>
        ) : null}
      </div>

      {/* Progress bar */}
      <div className="relative h-4 bg-secondary rounded-sm overflow-hidden border border-border">
        <div
          className={`absolute inset-y-0 left-0 transition-all duration-500 ${
            isHighRisk
              ? "bg-gradient-to-r from-destructive/80 to-destructive glow-red"
              : percentage >= 75
              ? "bg-gradient-to-r from-success/80 to-success glow-green"
              : "bg-gradient-to-r from-warning/80 to-warning glow-yellow"
          }`}
          style={{ width: `${Math.max(percentage, 2)}%` }}
        />
        
        {/* Grid overlay on progress bar */}
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(0,0,0,0.3) 10px, rgba(0,0,0,0.3) 11px)'
        }} />
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between mt-4 text-sm">
        <div className="flex items-center gap-6">
          <div>
            <span className="text-muted-foreground">Implemented: </span>
            <span className={`font-mono font-bold ${isHighRisk ? 'text-destructive' : 'text-success'}`}>
              {implementedAssets}
            </span>
            <span className="text-muted-foreground">/{totalAssets}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Completion: </span>
            <span className={`font-mono font-bold ${isHighRisk ? 'text-destructive' : 'text-success'}`}>
              {percentage.toFixed(1)}%
            </span>
          </div>
        </div>
        
        <div className="text-muted-foreground/50 text-xs font-mono">
          {isHighRisk && totalAssets > 0 
            ? `⚠ ${Math.ceil(totalAssets * 0.5) - implementedAssets} more assets needed to exit risk zone`
            : totalAssets === 0 
            ? "No assets tracked"
            : "Tracking nominal"
          }
        </div>
      </div>
    </div>
  );
};
