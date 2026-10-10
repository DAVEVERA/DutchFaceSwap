import React, { useState, useEffect } from 'react';
import { TOOL_SUITES, AI_TOOLS } from '../data/toolsData.ts';
import { ToolSuite } from '../types/index.ts';
import { Image, Video, PenTool, Smile, Scissors } from 'lucide-react';

interface SuiteBarProps {
  currentToolId: string;
  onSelectToolId: (id: string) => void;
}

export const SuiteBar: React.FC<SuiteBarProps> = ({
  currentToolId,
  onSelectToolId,
}) => {
  // Determine suite of current tool
  const currentTool = AI_TOOLS.find((t) => t.id === currentToolId);
  const initialSuite: ToolSuite = currentTool?.suite || 'beeld';

  const [activeSuite, setActiveSuite] = useState<ToolSuite>(initialSuite);

  useEffect(() => {
    if (currentTool?.suite && currentTool.suite !== activeSuite) {
      setActiveSuite(currentTool.suite);
    }
  }, [currentToolId]);

  const activeSuiteDef = TOOL_SUITES.find((s) => s.id === activeSuite) || TOOL_SUITES[0];
  const suiteTools = activeSuiteDef.toolIds
    .map((id) => AI_TOOLS.find((t) => t.id === id))
    .filter((t): t is typeof AI_TOOLS[0] => Boolean(t));

  const displayedTools = [...suiteTools];
  if (currentTool && !displayedTools.some((t) => t.id === currentTool.id) && currentTool.suite === activeSuite) {
    displayedTools.push(currentTool);
  }

  const SUITE_ICONS: Record<ToolSuite, React.ComponentType<{ className?: string }>> = {
    beeld: Image,
    removal: Scissors,
    video: Video,
    tattoo: PenTool,
    face: Smile,
  };

  return (
    <div className="w-full bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Tier 1: Suite Category Selectors */}
        <div className="flex items-center space-x-2 py-2.5 overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider pr-1 shrink-0 hidden sm:inline">
            Suites:
          </span>
          {TOOL_SUITES.map((suite) => {
            const Icon = SUITE_ICONS[suite.id] || Image;
            const isActive = activeSuite === suite.id;
            return (
              <button
                key={suite.id}
                onClick={() => {
                  setActiveSuite(suite.id);
                  // Automatically select first tool in that suite if current tool is in another suite
                  if (currentTool?.suite !== suite.id && suite.toolIds.length > 0) {
                    onSelectToolId(suite.toolIds[0]);
                  }
                }}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{suite.name}</span>
              </button>
            );
          })}
        </div>

        {/* Tier 2: Suite Tool Tabs */}
        <div className="flex items-center space-x-1.5 pb-2.5 pt-0.5 overflow-x-auto no-scrollbar border-t border-slate-100 dark:border-slate-900">
          <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 pr-1 shrink-0 hidden sm:inline">
            Tools:
          </span>
          {displayedTools.map((tool) => {
            const isToolActive = tool.id === currentToolId;
            return (
              <button
                key={tool.id}
                onClick={() => onSelectToolId(tool.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-colors ${
                  isToolActive
                    ? 'bg-[#FF4500] text-white font-semibold'
                    : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                <span>{tool.name}</span>
                <span className={`text-[10px] px-1 py-0.2 rounded font-mono ${
                  isToolActive
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}>
                  {tool.creditsCost}cr
                </span>
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
};
