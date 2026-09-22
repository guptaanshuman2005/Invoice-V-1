import React from 'react';
import { Sparkles, RotateCcw, ArrowRight, X, ExternalLink, HelpCircle } from 'lucide-react';

interface DemoBannerProps {
  onResetData: () => void;
  onExitDemo: () => void;
  onOpenDemoShowcase?: () => void;
}

export const DemoBanner: React.FC<DemoBannerProps> = ({
  onResetData,
  onExitDemo,
  onOpenDemoShowcase
}) => {
  const [isMinimized, setIsMinimized] = React.useState(false);

  if (isMinimized) {
    return (
      <div className="bg-gradient-to-r from-accent to-indigo-600 text-white px-4 py-1.5 flex items-center justify-between text-xs font-bold shadow-md z-40 relative">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
          <span>Demo Sandbox Active</span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsMinimized(false)} 
            className="hover:underline text-[11px] font-semibold"
          >
            Show Controls
          </button>
          <button 
            onClick={onExitDemo} 
            className="bg-white/20 hover:bg-white/30 text-white px-2.5 py-0.5 rounded-full text-[11px] transition-colors"
          >
            Exit Demo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-indigo-900 via-accent to-purple-900 text-white px-4 py-2.5 shadow-xl relative z-40 border-b border-white/10 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        
        {/* Left Badge & Context */}
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-1.5 bg-white/20 text-white px-3 py-1 rounded-full font-black uppercase tracking-wider text-[10px] shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            Live Demo Sandbox
          </div>
          <span className="text-white/90 font-medium hidden md:inline">
            Exploring with simulated GST data (<span className="font-bold text-white">Apex Global Technologies</span>, Mumbai). All edits are local.
          </span>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap justify-center">
          {onOpenDemoShowcase && (
            <button
              onClick={onOpenDemoShowcase}
              className="inline-flex items-center gap-1 bg-white/15 hover:bg-white/25 text-white px-3 py-1 rounded-xl font-bold transition-all hover:scale-105 active:scale-95"
              title="View Invoice Template Showcase & Tour"
            >
              <HelpCircle className="w-3.5 h-3.5 text-indigo-200" />
              <span>Tour Showcase</span>
            </button>
          )}

          <button
            onClick={onResetData}
            className="inline-flex items-center gap-1 bg-white/15 hover:bg-white/25 text-white px-3 py-1 rounded-xl font-bold transition-all hover:scale-105 active:scale-95"
            title="Reset sample data back to default state"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-200" />
            <span>Reset Data</span>
          </button>

          <button
            onClick={onExitDemo}
            className="inline-flex items-center gap-1.5 bg-white text-accent hover:bg-slate-100 px-3.5 py-1 rounded-xl font-black transition-all shadow-md hover:scale-105 active:scale-95"
          >
            <span>Exit Demo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button 
            onClick={() => setIsMinimized(true)}
            className="text-white/60 hover:text-white p-1 rounded-lg transition-colors ml-1"
            title="Minimize banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};

export default DemoBanner;
