import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { ProjectFolder, ProjectItem } from '../types/index.ts';
import {
  FolderPlus,
  Folder,
  Image as ImageIcon,
  MoreVertical,
  Plus,
  Trash2,
  Edit2,
  Download,
  Share2,
  Sparkles,
  Search,
  Filter,
  ArrowLeft,
  Calendar,
  Layers,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Sliders,
} from 'lucide-react';

interface ProjectManagerProps {
  onOpenStudioWithProject: (folderId: string) => void;
  onOpenShareModal: (project: ProjectItem) => void;
}

export const ProjectManager: React.FC<ProjectManagerProps> = ({
  onOpenStudioWithProject,
  onOpenShareModal,
}) => {
  const {
    folders,
    activeFolderId,
    setActiveFolderId,
    projects,
    createFolder,
    updateFolder,
    deleteFolder,
    deleteProject,
    moveProjectToFolder,
  } = useAuth();

  const [currentFolderView, setCurrentFolderView] = useState<string | null>(activeFolderId);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editFolderModal, setEditFolderModal] = useState<ProjectFolder | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // New folder form state
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderCategory, setNewFolderCategory] = useState<ProjectFolder['category']>('Marketing');
  const [newFolderDesc, setNewFolderDesc] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('#FF4500');

  const categories: ProjectFolder['category'][] = [
    'Marketing',
    'Portretten',
    'E-Commerce',
    'Social Media',
    'Persoonlijk',
    'Kunst',
  ];

  const colors = [
    '#FF4500', // ACCENT 1 - Oranje-Rood
    '#00ACA9', // ACCENT 2 - Teal Turquoise
    '#0162FF', // ACCENT 3 - Koningsblauw
    '#4682B4', // ACCENT 4 - Staalblauw
    '#6495ED', // ACCENT 5 - Korenbloemblauw
    '#003878', // ACCENT 6 - Diep Marineblauw
    '#10b981', // Emerald
    '#ec4899', // Pink
  ];

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    await createFolder(newFolderName.trim(), newFolderCategory, newFolderDesc.trim(), newFolderColor);
    setNewFolderName('');
    setNewFolderDesc('');
    setCreateModalOpen(false);
  };

  const handleUpdateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFolderModal || !editFolderModal.name.trim()) return;

    await updateFolder(editFolderModal.id, {
      name: editFolderModal.name.trim(),
      category: editFolderModal.category,
      description: editFolderModal.description,
      color: editFolderModal.color,
    });
    setEditFolderModal(null);
  };

  const activeFolder = folders.find((f) => f.id === currentFolderView);
  const folderProjects = projects.filter((p) => {
    const matchesFolder = currentFolderView ? p.folderId === currentFolderView : true;
    const matchesSearch =
      searchQuery.trim() === '' ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.prompt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFolder && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-8 border-b border-slate-200 dark:border-slate-800 gap-4">
        <div>
          {currentFolderView && activeFolder ? (
            <div className="space-y-1">
              <button
                onClick={() => setCurrentFolderView(null)}
                className="text-xs text-amber-600 dark:text-amber-400 font-bold flex items-center space-x-1 hover:underline mb-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Terug naar alle projecten</span>
              </button>
              <div className="flex items-center space-x-3">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: activeFolder.color }}
                />
                <h2 className="font-heading text-3xl font-extrabold text-slate-900 dark:text-white">
                  {activeFolder.name}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {activeFolder.category}
                </span>
              </div>
              {activeFolder.description && (
                <p className="text-xs text-slate-600 dark:text-slate-400">{activeFolder.description}</p>
              )}
            </div>
          ) : (
            <div>
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-bold uppercase mb-2">
                <Layers className="w-3.5 h-3.5" />
                <span>Projectbeheersysteem</span>
              </div>
              <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
                Mijn Projecten & Mappen
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                Organiseer, beheer en categoriseer je afbeeldingen en bijbehorende bewerkingen in geordende collecties.
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          {currentFolderView ? (
            <button
              onClick={() => onOpenStudioWithProject(currentFolderView)}
              className="py-2.5 px-4 rounded-xl bg-[#FF4500] hover:bg-[#E03E00] text-white font-semibold text-xs shadow-xs transition-colors flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Nieuwe Afbeelding in Project Maken</span>
            </button>
          ) : (
            <button
              onClick={() => setCreateModalOpen(true)}
              className="py-2.5 px-4 rounded-xl bg-[#FF4500] hover:bg-[#E03E00] text-white font-semibold text-xs shadow-xs transition-colors flex items-center space-x-1.5"
            >
              <FolderPlus className="w-4 h-4" />
              <span>Nieuw Project Aanmaken</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {!currentFolderView ? (
        /* Folder Grid View */
        <div className="space-y-8">
          
          {/* Folders List */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <Folder className="w-5 h-5 text-amber-500" />
                <span>Project Mappen ({folders.length})</span>
              </h3>
            </div>

            {folders.length === 0 ? (
              <div className="p-8 text-center rounded-3xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 shadow-xs">
                <Folder className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-2" />
                <h4 className="font-heading text-lg font-bold text-slate-900 dark:text-white">Nog geen projecten aangemaakt</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  Maak een project aan om je bewerkte foto’s, avatars en campagnes geordend bij elkaar te houden.
                </p>
                <button
                  onClick={() => setCreateModalOpen(true)}
                  className="mt-4 py-2 px-4 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow-sm hover:bg-amber-400 transition-colors"
                >
                  Project Aanmaken
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {folders.map((folder) => {
                  const count = projects.filter((p) => p.folderId === folder.id).length;
                  return (
                    <div
                      key={folder.id}
                      onClick={() => setCurrentFolderView(folder.id)}
                      className="group cursor-pointer p-5 rounded-3xl bg-white dark:bg-slate-900/70 hover:bg-slate-50 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500/50 dark:hover:border-amber-400/50 transition-all flex flex-col justify-between shadow-xs hover:shadow-xl"
                    >
                      <div>
                        <div className="flex items-start justify-between">
                          <div
                            className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md"
                            style={{ backgroundColor: `${folder.color}25`, border: `1px solid ${folder.color}50` }}
                          >
                            <Folder className="w-5 h-5" style={{ color: folder.color }} />
                          </div>

                          <div className="flex items-center space-x-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditFolderModal(folder);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Project bewerken"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteFolder(folder.id);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                              title="Project verwijderen"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="mt-4">
                          <h4 className="font-heading text-lg font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors">
                            {folder.name}
                          </h4>
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 mt-1">
                            {folder.category}
                          </span>
                          {folder.description && (
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 line-clamp-2">
                              {folder.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center space-x-1">
                          <ImageIcon className="w-3.5 h-3.5 text-amber-500" />
                          <span>{count} {count === 1 ? 'afbeelding' : 'afbeeldingen'}</span>
                        </span>
                        <div className="flex items-center space-x-1 text-amber-600 dark:text-amber-400 font-semibold group-hover:translate-x-1 transition-transform">
                          <span>Openen</span>
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* All Recent Projects Overview */}
          <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
              <h3 className="font-heading text-xl font-bold text-slate-900 dark:text-white">
                Alle Afbeeldingen & Bewerkingen ({projects.length})
              </h3>
              
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Zoek in afbeeldingen..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-1 focus:ring-amber-400 shadow-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {folderProjects.map((proj) => {
                const parentFolder = folders.find((f) => f.id === proj.folderId);
                return (
                  <div
                    key={proj.id}
                    className="group rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col justify-between hover:border-amber-500/50 dark:hover:border-amber-400/40 transition-all shadow-xs hover:shadow-xl"
                  >
                    <div>
                      <div className="relative aspect-square bg-slate-100 dark:bg-slate-950 overflow-hidden">
                        <img
                          src={proj.resultUrl}
                          alt={proj.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {parentFolder && (
                          <div
                            className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold text-slate-950 shadow-md"
                            style={{ backgroundColor: parentFolder.color }}
                          >
                            {parentFolder.name}
                          </div>
                        )}
                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-slate-950/80 text-[10px] font-bold text-amber-300">
                          {proj.aspectRatio}
                        </div>
                      </div>

                      <div className="p-4">
                        <h5 className="font-heading text-sm font-bold text-slate-900 dark:text-white truncate">
                          {proj.title}
                        </h5>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          "{proj.prompt}"
                        </p>
                      </div>
                    </div>

                    <div className="p-4 pt-0 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60 mt-2 pt-3">
                      <select
                        value={proj.folderId || ''}
                        onChange={(e) => moveProjectToFolder(proj.id, e.target.value || null)}
                        className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-[10px] text-slate-700 dark:text-slate-300 rounded-lg px-2 py-1 outline-none"
                        title="Verplaats naar project"
                      >
                        <option value="">Geen map</option>
                        {folders.map((f) => (
                          <option key={f.id} value={f.id}>
                            Map: {f.name}
                          </option>
                        ))}
                      </select>

                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => onOpenShareModal(proj)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Delen op Social Media"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteProject(proj.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                          title="Verwijderen"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      ) : (
        /* Single Folder Detailed View */
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="font-heading text-xl font-bold text-slate-900 dark:text-white">
              Afbeeldingen in dit project ({folderProjects.length})
            </h3>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Zoek in dit project..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-1 focus:ring-amber-400 shadow-xs"
              />
            </div>
          </div>

          {folderProjects.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 shadow-xs">
              <ImageIcon className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-2" />
              <h4 className="font-heading text-lg font-bold text-slate-900 dark:text-white">Nog geen afbeeldingen in dit project</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                Start een nieuwe bewerking of koppel bestaande afbeeldingen aan deze map.
              </p>
              <button
                onClick={() => onOpenStudioWithProject(currentFolderView)}
                className="mt-4 py-2 px-4 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow-sm hover:bg-amber-400 transition-colors"
              >
                Creëer in Studio
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {folderProjects.map((proj) => (
                <div
                  key={proj.id}
                  className="group rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col justify-between hover:border-amber-500/50 dark:hover:border-amber-400/40 transition-all shadow-xs hover:shadow-xl"
                >
                  <div className="relative aspect-square bg-slate-100 dark:bg-slate-950 overflow-hidden">
                    <img
                      src={proj.resultUrl}
                      alt={proj.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-slate-950/80 text-[10px] font-bold text-amber-300">
                      {proj.aspectRatio}
                    </div>
                  </div>

                  <div className="p-4">
                    <h5 className="font-heading text-sm font-bold text-slate-900 dark:text-white truncate">
                      {proj.title}
                    </h5>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      "{proj.prompt}"
                    </p>
                    <div className="mt-2 text-[10px] text-slate-500 flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(proj.createdAt).toLocaleDateString('nl-NL')}</span>
                    </div>
                  </div>

                  <div className="p-4 pt-0 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60 pt-3">
                    <button
                      onClick={() => onOpenShareModal(proj)}
                      className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center space-x-1"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Delen</span>
                    </button>

                    <button
                      onClick={() => deleteProject(proj.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"
                      title="Verwijderen"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal: Create Project Folder */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-in fade-in">
            <h3 className="font-heading text-2xl font-bold text-slate-900 dark:text-white">
              Nieuw Project Aanmaken
            </h3>

            <form onSubmit={handleCreateFolder} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Projectnaam</label>
                <input
                  type="text"
                  required
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Bijv. Zomer Campagne 2026 of LinkedIn Headshots"
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Categorie</label>
                <select
                  value={newFolderCategory}
                  onChange={(e) => setNewFolderCategory(e.target.value as any)}
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white outline-none"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Beschrijving (optioneel)</label>
                <textarea
                  value={newFolderDesc}
                  onChange={(e) => setNewFolderDesc(e.target.value)}
                  rows={2}
                  placeholder="Beschrijf het doel van dit project..."
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Themakleur</label>
                <div className="flex space-x-2">
                  {colors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewFolderColor(c)}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${
                        newFolderColor === c ? 'border-amber-500 scale-110 shadow-md' : 'border-transparent opacity-80'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-colors"
                >
                  Project Opslaan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Project Folder */}
      {editFolderModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-in fade-in">
            <h3 className="font-heading text-2xl font-bold text-slate-900 dark:text-white">
              Project Bewerken
            </h3>

            <form onSubmit={handleUpdateFolder} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Projectnaam</label>
                <input
                  type="text"
                  required
                  value={editFolderModal.name}
                  onChange={(e) => setEditFolderModal({ ...editFolderModal, name: e.target.value })}
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Categorie</label>
                <select
                  value={editFolderModal.category}
                  onChange={(e) => setEditFolderModal({ ...editFolderModal, category: e.target.value as any })}
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white outline-none"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Beschrijving</label>
                <textarea
                  value={editFolderModal.description || ''}
                  onChange={(e) => setEditFolderModal({ ...editFolderModal, description: e.target.value })}
                  rows={2}
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Themakleur</label>
                <div className="flex space-x-2">
                  {colors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setEditFolderModal({ ...editFolderModal, color: c })}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${
                        editFolderModal.color === c ? 'border-amber-500 scale-110 shadow-md' : 'border-transparent opacity-80'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditFolderModal(null)}
                  className="px-4 py-2.5 rounded-xl text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-colors"
                >
                  Opslaan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
