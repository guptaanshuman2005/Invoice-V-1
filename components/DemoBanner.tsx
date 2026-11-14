import React from 'react';
import { Sparkles, RotateCcw, ArrowRight, X, ExternalLink, HelpCircle } from 'lucide-react';

interface DemoBannerProps {
  onResetData: () => void;
  onExitDemo: () => void;
  onOpenDemoShowcase?: () => void;
  onExitToAuth?: () => void;
}

export const DemoBanner: React.FC<DemoBannerProps> = ({
  onResetData,
  onExitDemo,
  onOpenDemoShowcase,
  onExitToAuth
}) => {
  const [isMinimized, setIsMinimized] = React.useState(false);

  if (isMinimized) {
    return (
      <div className="bg-amber-500/15 border-b border-amber-500/25 text-amber-900 dark:text-amber-200 px-4 py-1.5 flex items-center justify-between text-xs font-medium z-40 relative">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          <span>Demo Sandbox Active</span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsMinimized(false)} 
            className="hover:underline text-[11px] font-semibold text-amber-800 dark:text-amber-300"
          >
            Show Controls
          </button>
          <button 
            onClick={onExitDemo} 
            className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 dark:text-amber-200 px-2.5 py-0.5 rounded-lg text-[11px] transition-colors"
          >
            Exit Demo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-amber-500/10 dark:bg-amber-950/40 border-b border-amber-500/25 text-amber-900 dark:text-amber-200 px-4 py-2 relative z-40">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        
        {/* Left Badge & Context */}
        <div className="flex items-center gap-2.5">
          <div className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-900 dark:text-amber-200 px-2.5 py-0.5 rounded-full font-semibold text-[10px] tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Demo Sandbox
          </div>
          <span className="text-amber-900/90 dark:text-amber-200/90 font-normal hidden md:inline">
            Exploring with simulated GST data (<span className="font-semibold">Apex Global Technologies</span>, Mumbai). Edits are local.
          </span>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-center">
          {onOpenDemoShowcase && (
            <button
              onClick={onOpenDemoShowcase}
              className="inline-flex items-center gap-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-900 dark:text-amber-200 px-2.5 py-1 rounded-lg font-medium transition-colors"
              title="View Invoice Template Showcase & Tour"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Tour Showcase</span>
            </button>
          )}

          <button
            onClick={onResetData}
            className="inline-flex items-center gap-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-900 dark:text-amber-200 px-2.5 py-1 rounded-lg font-medium transition-colors"
            title="Reset sample data back to default state"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Data</span>
          </button>

          {onExitToAuth && (
            <button
              onClick={onExitToAuth}
              className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded-lg font-medium transition-colors shadow-xs"
              title="Turn off demo mode and sign in to connect cloud database"
            >
              <span>Sign In / Sign Up</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={onExitDemo}
            className="inline-flex items-center gap-1.5 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 px-3 py-1 rounded-lg font-medium transition-colors border border-zinc-200 dark:border-zinc-700 shadow-xs"
          >
            <span>Exit Demo</span>
          </button>

          <button 
            onClick={() => setIsMinimized(true)}
            className="text-amber-900/60 dark:text-amber-300/60 hover:text-amber-900 dark:hover:text-amber-200 p-1 rounded-lg transition-colors ml-1"
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
