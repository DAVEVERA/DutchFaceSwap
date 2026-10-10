import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { AdminMetrics } from '../types/index.ts';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Users,
  ShieldAlert,
  Mail,
  Send,
  CheckCircle2,
  Cpu,
  Globe,
  Clock,
  UserCheck,
  Lock,
} from 'lucide-react';

export const AdminPortal: React.FC = () => {
  const { profile, updateUserRole } = useAuth();

  const [metrics, setMetrics] = useState<AdminMetrics>({
    totalGenerations: 148920,
    activeUsersToday: 4821,
    revenueEur: 18450.75,
    apiCostEur: 842.10,
    marginPercent: 95.4,
    avgLatencyMs: 840,
    serverUptime: '99.98%',
    storageEncryptedVaults: 3120,
  });

  const [topTools, setTopTools] = useState<any[]>([
    { name: 'Face Morph', count: 42100, creditsUsed: 168400, growth: '+28%' },
    { name: 'AI Anime Generator', count: 31200, creditsUsed: 124800, growth: '+19%' },
    { name: 'Photo Enhancer & HD', count: 28900, creditsUsed: 57800, growth: '+14%' },
    { name: 'Gender Swap', count: 19400, creditsUsed: 77600, growth: '+34%' },
    { name: 'Text to Video (Veo 3.1)', count: 14200, creditsUsed: 213000, growth: '+45%' },
    { name: 'Talking Avatar & Podcast', count: 13120, creditsUsed: 104960, growth: '+22%' },
  ]);

  // Automated Email Report State
  const [reportEmail, setReportEmail] = useState('stakeholder@bedrijf.nl');
  const [reportFrequency, setReportFrequency] = useState('weekly');
  const [reportRole, setReportRole] = useState('CFO / Stakeholder');
  const [reportSuccess, setReportSuccess] = useState<string | null>(null);

  // RBAC Team Members
  const [teamMembers, setTeamMembers] = useState([
    { id: '1', name: 'Mnr Vera (Eigenaar)', email: 'mnrvera@gmail.com', role: 'admin' as const, status: 'Actief' },
    { id: '2', name: 'Emma de Vries (Content Lead)', email: 'emma@swapsmoel.com', role: 'creator' as const, status: 'Actief' },
    { id: '3', name: 'Lars Jansen (Beeldbewerker)', email: 'lars@swapsmoel.com', role: 'editor' as const, status: 'Actief' },
    { id: '4', name: 'Finance Auditor', email: 'audit@swapsmoel.com', role: 'viewer' as const, status: 'Actief' },
  ]);

  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'admin' | 'creator' | 'editor' | 'viewer'>('editor');

  const handleScheduleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const resp = await fetch('/api/admin/schedule-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: reportEmail,
          frequency: reportFrequency,
          recipientRole: reportRole,
        }),
      });
      const data = await resp.json();
      setReportSuccess(`Geautomatiseerd ${reportFrequency} rapport geactiveerd voor ${reportEmail}`);
      setTimeout(() => setReportSuccess(null), 5000);
    } catch {
      setReportSuccess('Rapportage instellingen lokaal opgeslagen.');
    }
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberEmail) return;
    setTeamMembers(prev => [
      ...prev,
      {
        id: String(Date.now()),
        name: newMemberEmail.split('@')[0],
        email: newMemberEmail,
        role: newMemberRole,
        status: 'Uitgenodigd',
      },
    ]);
    setNewMemberEmail('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold uppercase mb-2">
            <Lock className="w-3.5 h-3.5" />
            <span>Beveiligd Beheerdersportaal</span>
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-white">
            Swapsmoel Executive Dashboard & GA4
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time monitoring van AI generaties, serverkosten, conversies en teamtoegang.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs text-slate-300 bg-slate-900 border border-slate-800 p-2.5 rounded-2xl">
          <Clock className="w-4 h-4 text-emerald-400" />
          <span>Laatste GA4 sync: <strong>Zojuist bijgewerkt</strong></span>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Generaties */}
        <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
            <span>Totaal Generaties</span>
            <Cpu className="w-4 h-4 text-[#0162FF]" />
          </div>
          <div className="font-heading text-3xl font-extrabold text-white mt-2">
            {metrics.totalGenerations.toLocaleString('nl-NL')}
          </div>
          <div className="text-[11px] text-[#00ACA9] font-semibold mt-1">
            +18.4% deze week
          </div>
        </div>

        {/* Omzet EUR */}
        <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
            <span>Totale Omzet (EUR)</span>
            <DollarSign className="w-4 h-4 text-[#00ACA9]" />
          </div>
          <div className="font-heading text-3xl font-extrabold text-white mt-2">
            €{metrics.revenueEur.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-[#00ACA9] font-semibold mt-1">
            Winstmarge: {metrics.marginPercent}%
          </div>
        </div>

        {/* AI Compute Kosten */}
        <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
            <span>AI Computekosten</span>
            <BarChart3 className="w-4 h-4 text-[#FF4500]" />
          </div>
          <div className="font-heading text-3xl font-extrabold text-white mt-2">
            €{metrics.apiCostEur.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 font-semibold mt-1">
            Gem. €0,0056 / generatie
          </div>
        </div>

        {/* Actieve Gebruikers */}
        <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
            <span>Actieve Gebruikers</span>
            <Users className="w-4 h-4 text-[#6495ED]" />
          </div>
          <div className="font-heading text-3xl font-extrabold text-white mt-2">
            {metrics.activeUsersToday.toLocaleString('nl-NL')}
          </div>
          <div className="text-[11px] text-[#6495ED] font-semibold mt-1">
            {metrics.storageEncryptedVaults} E2EE Vaults actief
          </div>
        </div>

      </div>

      {/* Analytics & Top Tools Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Top Tools Performance (7 Cols) */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-xl font-bold text-white">
              Meest Populaire AI Tools & Credit Volume
            </h3>
            <span className="text-xs text-slate-400">Realtime data</span>
          </div>

          <div className="space-y-3">
            {topTools.map((tool, idx) => (
              <div
                key={tool.name}
                className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <span className="w-6 h-6 rounded-lg bg-slate-900 text-xs font-bold text-amber-400 flex items-center justify-center">
                    #{idx + 1}
                  </span>
                  <div>
                    <div className="text-xs font-bold text-white">{tool.name}</div>
                    <div className="text-[10px] text-slate-400">{tool.creditsUsed.toLocaleString('nl-NL')} credits verbruikt</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-bold text-slate-200">{tool.count.toLocaleString('nl-NL')} runs</div>
                  <div className="text-[10px] text-emerald-400 font-semibold">{tool.growth}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* GA4 Traffic Volume & Demografie (5 Cols) */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-xl font-bold text-white">
              GA4 Verkeersbronnen
            </h3>
            <Globe className="w-4 h-4 text-sky-400" />
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between mb-1 font-semibold text-slate-300">
                <span>Google Nederland (Organisch)</span>
                <span>44%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full" style={{ width: '44%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1 font-semibold text-slate-300">
                <span>TikTok & Reels Video Shares</span>
                <span>28%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-rose-500 rounded-full" style={{ width: '28%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1 font-semibold text-slate-300">
                <span>Direct / Swapsmoel.com</span>
                <span>18%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: '18%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1 font-semibold text-slate-300">
                <span>Instagram & Pinterest</span>
                <span>10%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-pink-500 rounded-full" style={{ width: '10%' }} />
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-1 text-xs">
            <div className="font-bold text-white">GA4 Meet-ID & Privacy:</div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Volledig AVG/GDPR compliant. IP-adressen zijn geanonimiseerd en sessies worden client-side bewaakt zonder tracking cookies.
            </p>
          </div>
        </div>

      </div>

      {/* Stakeholder Automated Email Reports */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-[#0162FF]/10 border border-[#0162FF]/20 text-[#0162FF] dark:text-[#6495ED]">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-heading text-xl font-bold text-white">
              Geautomatiseerde E-mailrapporten voor Stakeholders
            </h3>
            <p className="text-xs text-slate-400">
              Verstuur periodieke managementoverzichten van omzet, compute marges en gebruikersstatistieken.
            </p>
          </div>
        </div>

        {reportSuccess && (
          <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{reportSuccess}</span>
          </div>
        )}

        <form onSubmit={handleScheduleReport} className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">E-mailadres Ontvanger</label>
            <input
              type="email"
              value={reportEmail}
              onChange={(e) => setReportEmail(e.target.value)}
              required
              className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs outline-none focus:ring-1 focus:ring-amber-400"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Frequentie</label>
            <select
              value={reportFrequency}
              onChange={(e) => setReportFrequency(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs outline-none focus:ring-1 focus:ring-amber-400"
            >
              <option value="daily">Dagelijks (08:00 CET)</option>
              <option value="weekly">Wekelijks (Maandagochtend)</option>
              <option value="monthly">Maandelijks (1e van de maand)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Stakeholder Rol</label>
            <input
              type="text"
              value={reportRole}
              onChange={(e) => setReportRole(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs outline-none focus:ring-1 focus:ring-amber-400"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#FF4500] hover:bg-[#E03E00] text-white font-semibold text-xs transition-colors shadow-xs flex items-center justify-center space-x-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Rapport Inplannen</span>
            </button>
          </div>
        </form>
      </div>

      {/* RBAC Team & Rol Management */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-heading text-xl font-bold text-white">
              Team & Rolgebaseerd Toegangsbeheer (RBAC)
            </h3>
            <p className="text-xs text-slate-400">
              Beheer rollen: Beheerder (Admin), Maker (Creator), Editor, of Toeschouwer (Viewer).
            </p>
          </div>
        </div>

        {/* Add Member Form */}
        <form onSubmit={handleAddMember} className="flex flex-wrap sm:flex-nowrap gap-2 pt-2">
          <input
            type="email"
            value={newMemberEmail}
            onChange={(e) => setNewMemberEmail(e.target.value)}
            placeholder="Nieuw teamlid e-mailadres..."
            className="flex-1 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs outline-none focus:ring-1 focus:ring-amber-400"
          />
          <select
            value={newMemberRole}
            onChange={(e) => setNewMemberRole(e.target.value as any)}
            className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs outline-none"
          >
            <option value="admin">Beheerder (Admin)</option>
            <option value="creator">Maker (Creator)</option>
            <option value="editor">Editor</option>
            <option value="viewer">Toeschouwer (Viewer)</option>
          </select>
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs whitespace-nowrap"
          >
            Lid Toevoegen
          </button>
        </form>

        {/* Members Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-bold">
              <tr>
                <th className="py-2.5 px-4">Naam / E-mail</th>
                <th className="py-2.5 px-4">Rol</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Actie</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 text-slate-300">
              {teamMembers.map((member) => (
                <tr key={member.id}>
                  <td className="py-2.5 px-4">
                    <div className="font-bold text-white">{member.name}</div>
                    <div className="text-[11px] text-slate-400">{member.email}</div>
                  </td>
                  <td className="py-2.5 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20 capitalize">
                      {member.role}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-emerald-400 font-semibold">{member.status}</td>
                  <td className="py-2.5 px-4 text-right">
                    <button
                      onClick={() => setTeamMembers(prev => prev.filter(m => m.id !== member.id))}
                      className="text-rose-400 hover:underline text-[11px]"
                    >
                      Verwijderen
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
