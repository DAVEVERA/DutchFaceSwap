import React from 'react';
import { AI_TOOLS } from '../data/toolsData.ts';
import { AITool, ToolCategory } from '../types/index.ts';
import {
  Sparkles,
  Users,
  UserCheck,
  Smile,
  Eye,
  UserCircle,
  UserPlus,
  Clock,
  Palette,
  MessageSquare,
  Film,
  Mic,
  Radio,
  Brush,
  Image,
  Tag,
  Shield,
  Flame,
  Camera,
  Feather,
  PenTool,
  Zap,
  Cpu,
  RotateCcw,
  Maximize2,
  ZoomIn,
  Scissors,
  FileX,
  Aperture,
  Layers,
  Expand,
  Sliders,
  BrainCircuit,
  Video,
  Smartphone,
  Activity,
  Wind,
  Headphones,
  Crop,
  Volume2,
  Copy,
  Trash2,
  Coins,
  ArrowRight,
  Scan,
  Wand2,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ReactNode> = {
  Users: <Users className="w-5 h-5" strokeWidth={1.75} />,
  UserCheck: <UserCheck className="w-5 h-5" strokeWidth={1.75} />,
  Smile: <Smile className="w-5 h-5" strokeWidth={1.75} />,
  Eye: <Eye className="w-5 h-5" strokeWidth={1.75} />,
  UserCircle: <UserCircle className="w-5 h-5" strokeWidth={1.75} />,
  UserPlus: <UserPlus className="w-5 h-5" strokeWidth={1.75} />,
  Baby: <UserCircle className="w-5 h-5" strokeWidth={1.75} />,
  Clock: <Clock className="w-5 h-5" strokeWidth={1.75} />,
  Ghost: <Wand2 className="w-5 h-5" strokeWidth={1.75} />,
  Palette: <Palette className="w-5 h-5" strokeWidth={1.75} />,
  MessageSquare: <MessageSquare className="w-5 h-5" strokeWidth={1.75} />,
  Cat: <Scan className="w-5 h-5" strokeWidth={1.75} />,
  Film: <Film className="w-5 h-5" strokeWidth={1.75} />,
  Mic: <Mic className="w-5 h-5" strokeWidth={1.75} />,
  Radio: <Radio className="w-5 h-5" strokeWidth={1.75} />,
  Sparkles: <Sparkles className="w-5 h-5" strokeWidth={1.75} />,
  Brush: <Brush className="w-5 h-5" strokeWidth={1.75} />,
  Image: <Image className="w-5 h-5" strokeWidth={1.75} />,
  Tag: <Tag className="w-5 h-5" strokeWidth={1.75} />,
  Laugh: <Smile className="w-5 h-5" strokeWidth={1.75} />,
  Shield: <Shield className="w-5 h-5" strokeWidth={1.75} />,
  Flame: <Flame className="w-5 h-5" strokeWidth={1.75} />,
  Camera: <Camera className="w-5 h-5" strokeWidth={1.75} />,
  Feather: <Feather className="w-5 h-5" strokeWidth={1.75} />,
  PenTool: <PenTool className="w-5 h-5" strokeWidth={1.75} />,
  Zap: <Zap className="w-5 h-5" strokeWidth={1.75} />,
  Cpu: <Cpu className="w-5 h-5" strokeWidth={1.75} />,
  RotateCcw: <RotateCcw className="w-5 h-5" strokeWidth={1.75} />,
  Maximize2: <Maximize2 className="w-5 h-5" strokeWidth={1.75} />,
  ZoomIn: <ZoomIn className="w-5 h-5" strokeWidth={1.75} />,
  Scissors: <Scissors className="w-5 h-5" strokeWidth={1.75} />,
  FileX: <FileX className="w-5 h-5" strokeWidth={1.75} />,
  Aperture: <Aperture className="w-5 h-5" strokeWidth={1.75} />,
  Layers: <Layers className="w-5 h-5" strokeWidth={1.75} />,
  Expand: <Expand className="w-5 h-5" strokeWidth={1.75} />,
  Sliders: <Sliders className="w-5 h-5" strokeWidth={1.75} />,
  BrainCircuit: <BrainCircuit className="w-5 h-5" strokeWidth={1.75} />,
  Video: <Video className="w-5 h-5" strokeWidth={1.75} />,
  Smartphone: <Smartphone className="w-5 h-5" strokeWidth={1.75} />,
  Activity: <Activity className="w-5 h-5" strokeWidth={1.75} />,
  Wind: <Wind className="w-5 h-5" strokeWidth={1.75} />,
  Headphones: <Headphones className="w-5 h-5" strokeWidth={1.75} />,
  Crop: <Crop className="w-5 h-5" strokeWidth={1.75} />,
  Volume2: <Volume2 className="w-5 h-5" strokeWidth={1.75} />,
  Copy: <Copy className="w-5 h-5" strokeWidth={1.75} />,
  Trash2: <Trash2 className="w-5 h-5" strokeWidth={1.75} />,
};

interface ToolGridProps {
  selectedCategory: 'all' | ToolCategory;
  setSelectedCategory: (cat: 'all' | ToolCategory) => void;
  searchQuery: string;
  onSelectTool: (tool: AITool) => void;
}

export const ToolGrid: React.FC<ToolGridProps> = ({
  selectedCategory,
  setSelectedCategory,
  searchQuery,
  onSelectTool,
}) => {
  const categories: { id: 'all' | ToolCategory; label: string; count: number }[] = [
    { id: 'all', label: 'Alle 40+ Tools', count: AI_TOOLS.length },
    {
      id: 'face',
      label: 'Gezicht & Swaps',
      count: AI_TOOLS.filter((t) => t.category === 'face').length,
    },
    {
      id: 'creative',
      label: 'Creatief & Generatie',
      count: AI_TOOLS.filter((t) => t.category === 'creative').length,
    },
    {
      id: 'photo',
      label: 'Foto Bewerken',
      count: AI_TOOLS.filter((t) => t.category === 'photo').length,
    },
    {
      id: 'video',
      label: 'Video & Motion',
      count: AI_TOOLS.filter((t) => t.category === 'video').length,
    },
    {
      id: 'audio',
      label: 'Audio & Stem',
      count: AI_TOOLS.filter((t) => t.category === 'audio').length,
    },
    {
      id: 'batch',
      label: 'Batch Verwerking',
      count: AI_TOOLS.filter((t) => t.category === 'batch').length,
    },
  ];

  const filteredTools = AI_TOOLS.filter((tool) => {
    const matchesCategory =
      selectedCategory === 'all' || tool.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      tool.name.toLowerCase().includes(q) ||
      tool.dutchName.toLowerCase().includes(q) ||
      tool.description.toLowerCase().includes(q);

    return matchesCategory && matchesSearch;
  });

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      
      {/* Category Pills Slider */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-3 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap flex items-center space-x-2 ${
              selectedCategory === cat.id
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800'
            }`}
          >
            <span>{cat.label}</span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                selectedCategory === cat.id
                  ? 'bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-950'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {cat.count}
            </span>
          </button>
        ))}
      </div>

      {/* Results / Search Count */}
      {searchQuery ? (
        <div className="mt-3 mb-5 text-xs text-slate-500 dark:text-slate-400">
          <span>
            Zoekresultaten voor: <strong className="text-slate-900 dark:text-white">"{searchQuery}"</strong> ({filteredTools.length})
          </span>
        </div>
      ) : null}

      {/* Grid of Tools */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        {filteredTools.map((tool) => (
          <div
            key={tool.id}
            onClick={() => onSelectTool(tool)}
            className="group relative cursor-pointer p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 transition-colors flex flex-col justify-between"
          >
            {/* Top row: Icon & Badge */}
            <div>
              <div className="flex items-start justify-between">
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-slate-800 dark:text-slate-200 group-hover:text-[#FF4500] dark:group-hover:text-[#FF4500] transition-colors">
                  {ICON_MAP[tool.iconName] || <Sparkles className="w-5 h-5 text-[#FF4500]" strokeWidth={1.75} />}
                </div>

                <div className="flex flex-col items-end space-y-1">
                  {tool.badge && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {tool.badge}
                    </span>
                  )}
                  {tool.isFreeToTry && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      Gratis proberen
                    </span>
                  )}
                </div>
              </div>

              {/* Title & Description */}
              <div className="mt-3.5 text-left">
                <h3 className="font-heading text-base font-bold text-slate-900 dark:text-white group-hover:text-[#FF4500] transition-colors">
                  {tool.dutchName}
                </h3>
                <div className="text-[11px] text-slate-400 dark:text-slate-500 font-medium line-clamp-1 mb-1.5">
                  {tool.name}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                  {tool.description}
                </p>
              </div>
            </div>

            {/* Bottom row: Credits Cost & Open Studio Button */}
            <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-xs font-semibold text-[#FF4500]">
                <Coins className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span>{tool.creditsCost} credits</span>
              </div>

              <div className="flex items-center space-x-1 text-xs font-semibold text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                <span>Start</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" strokeWidth={1.75} />
              </div>
            </div>
          </div>
        ))}
      </div>

    </section>
  );
};
