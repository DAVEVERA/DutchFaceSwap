import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { CREDIT_PACKAGES, CURRENCY_RATES } from '../data/toolsData.ts';
import { CreditPackage, Currency } from '../types/index.ts';
import confetti from 'canvas-confetti';
import {
  X,
  Coins,
  CheckCircle2,
  ShieldCheck,
  Zap,
  HelpCircle,
  Receipt,
  Flame,
  ArrowRight,
  CreditCard,
  Send,
  Bitcoin,
  Sparkles,
  Crown,
  Gift,
  Check,
  ChevronDown,
  Building2,
  Lock,
} from 'lucide-react';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose }) => {
  const { profile, currency, setCurrency, addCredits, transactions } = useAuth();

  const [activeTab, setActiveTab] = useState<'buy' | 'subscription' | 'faq' | 'billing'>('buy');
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage>(CREDIT_PACKAGES[1]); // 530 credits as default
  const [paymentMethod, setPaymentMethod] = useState<'ideal' | 'card' | 'bancontact' | 'apple_pay' | 'telegram' | 'crypto'>('ideal');
  const [selectedIdealBank, setSelectedIdealBank] = useState('ing');
  const [isProcessing, setIsProcessing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentRate = CURRENCY_RATES[currency] || CURRENCY_RATES.EUR;

  const getPackagePrice = (pkg: CreditPackage) => {
    if (currency === 'EUR') return currentRate.format(pkg.priceEur);
    if (currency === 'USD') return currentRate.format(pkg.priceUsd);
    return currentRate.format(pkg.priceGbp);
  };

  const handleBuy = async () => {
    setIsProcessing(true);
    setPurchaseSuccess(null);

    // Simulate payment gateway delay
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const price = currency === 'EUR' ? selectedPackage.priceEur : currency === 'USD' ? selectedPackage.priceUsd : selectedPackage.priceGbp;
    await addCredits(
      selectedPackage.credits,
      selectedPackage.bonusCredits,
      price,
      paymentMethod
    );

    setIsProcessing(false);
    setPurchaseSuccess(`Gefeliciteerd! ${selectedPackage.credits} credits (+${selectedPackage.bonusCredits} bonus credits) zijn succesvol toegevoegd aan je Swapsmoel account.`);

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-6">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/40">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-[#FF4500]/10 border border-[#FF4500]/20 text-[#FF4500]">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                Credits Kopen <span className="text-[#0162FF] dark:text-[#6495ED]">& Tarieven</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                100% Veilige betaling in Euro (€) of multi-valuta • Levenslang geldig
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Currency selector inside modal */}
            <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5 text-xs font-semibold">
              {(['EUR', 'USD', 'GBP'] as Currency[]).map((cur) => (
                <button
                  key={cur}
                  onClick={() => setCurrency(cur)}
                  className={`px-2 py-1 rounded-lg transition-all ${
                    currency === cur ? 'bg-[#003878] text-white font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {CURRENCY_RATES[cur]?.symbol} {cur}
                </button>
              ))}
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 bg-slate-50/50 dark:bg-slate-950/20 overflow-x-auto">
          <button
            onClick={() => setActiveTab('buy')}
            className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center space-x-2 whitespace-nowrap ${
              activeTab === 'buy'
                ? 'border-[#0162FF] text-[#0162FF] dark:text-[#6495ED]'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Credits Bundels (Eenmalig)</span>
          </button>

          <button
            onClick={() => setActiveTab('subscription')}
            className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center space-x-2 whitespace-nowrap ${
              activeTab === 'subscription'
                ? 'border-[#0162FF] text-[#0162FF] dark:text-[#6495ED]'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Crown className="w-4 h-4 text-[#FF4500]" />
            <span>Abonnementen (Pro & Studio)</span>
          </button>

          <button
            onClick={() => setActiveTab('faq')}
            className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center space-x-2 whitespace-nowrap ${
              activeTab === 'faq'
                ? 'border-[#0162FF] text-[#0162FF] dark:text-[#6495ED]'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Veelgestelde Vragen (FAQ)</span>
          </button>

          <button
            onClick={() => setActiveTab('billing')}
            className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center space-x-2 whitespace-nowrap ${
              activeTab === 'billing'
                ? 'border-amber-500 text-amber-600 dark:text-amber-300'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Facturatie & Geschiedenis</span>
          </button>
        </div>

        {/* Tab Content: BUY CREDITS (Matches Remaker Screenshot Translated to Euro) */}
        {activeTab === 'buy' && (
          <div className="p-4 sm:p-6 space-y-6">
            
            {/* Success notification */}
            {purchaseSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 flex items-center space-x-3 animate-in zoom-in-95">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 dark:text-emerald-400 shrink-0" />
                <p className="text-sm font-semibold">{purchaseSuccess}</p>
              </div>
            )}

            {/* Credit Packages Grid (Exact values from image.png translated to EUR) */}
            <div>
              <div className="text-center mb-4">
                <h3 className="font-heading text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  Kies jouw gewenste Creditbundel
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Eenmalige betaling • Geen stilzwijgende verlening • Nooit verlopen
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {CREDIT_PACKAGES.map((pkg) => {
                  const isSelected = selectedPackage.id === pkg.id;
                  return (
                    <div
                      key={pkg.id}
                      onClick={() => setSelectedPackage(pkg)}
                      className={`relative cursor-pointer p-4 rounded-2xl border transition-all text-center flex flex-col justify-between ${
                        isSelected
                          ? 'bg-[#0162FF]/10 border-[#0162FF] ring-2 ring-[#0162FF]/20 shadow-md shadow-[#0162FF]/10'
                          : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      {/* Popular / Discount Badge */}
                      {pkg.popular && (
                        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-[#FF4500] text-[10px] font-semibold text-white flex items-center shadow-xs whitespace-nowrap">
                          <Flame className="w-3 h-3 mr-1 fill-white" />
                          Meest gekozen
                        </div>
                      )}
                      {pkg.discountBadge && !pkg.popular && (
                        <div className="absolute -top-2.5 right-2 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {pkg.discountBadge}
                        </div>
                      )}

                      <div className="pt-2">
                        <div className="font-heading text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center justify-center space-x-1">
                          <span>{pkg.credits.toLocaleString('nl-NL')}</span>
                          <span className="text-xs text-slate-500 font-medium">credits</span>
                        </div>
                        <div className="text-[11px] text-[#FF4500] font-semibold mt-0.5">
                          +{pkg.bonusCredits} Bonus Credits
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/80">
                        <div className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                          {getPackagePrice(pkg)}
                        </div>
                        {pkg.discountBadge && (
                          <div className="text-[10px] text-[#00ACA9] font-semibold mt-0.5">
                            {pkg.discountBadge}
                          </div>
                        )}
                      </div>

                      {isSelected && (
                        <div className="mt-2 flex items-center justify-center text-[#0162FF] dark:text-[#6495ED] text-xs font-bold">
                          <Check className="w-4 h-4 mr-1" /> Geselecteerd
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Choose Payment Method */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Kies betaalmethode (Veilig & Direct gecrediteerd):
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                
                {/* iDEAL (Nederland) */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('ideal')}
                  className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center ${
                    paymentMethod === 'ideal'
                      ? 'bg-amber-500/15 border-amber-500 text-slate-900 dark:text-white'
                      : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <Building2 className="w-5 h-5 text-rose-500 mb-1" />
                  <span className="text-xs font-bold">iDEAL (NL)</span>
                </button>

                {/* Bancontact (België) */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('bancontact')}
                  className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center ${
                    paymentMethod === 'bancontact'
                      ? 'bg-amber-500/15 border-amber-500 text-slate-900 dark:text-white'
                      : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <CreditCard className="w-5 h-5 text-blue-500 mb-1" />
                  <span className="text-xs font-bold">Bancontact</span>
                </button>

                {/* Creditcard */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center ${
                    paymentMethod === 'card'
                      ? 'bg-amber-500/15 border-amber-500 text-slate-900 dark:text-white'
                      : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <CreditCard className="w-5 h-5 text-indigo-500 mb-1" />
                  <span className="text-xs font-bold">Creditcard</span>
                </button>

                {/* Apple Pay */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('apple_pay')}
                  className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center ${
                    paymentMethod === 'apple_pay'
                      ? 'bg-amber-500/15 border-amber-500 text-slate-900 dark:text-white'
                      : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <Zap className="w-5 h-5 text-slate-700 dark:text-slate-100 mb-1" />
                  <span className="text-xs font-bold">Apple Pay</span>
                </button>

                {/* Card via Telegram */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('telegram')}
                  className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center ${
                    paymentMethod === 'telegram'
                      ? 'bg-amber-500/15 border-amber-500 text-slate-900 dark:text-white'
                      : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <Send className="w-5 h-5 text-sky-500 mb-1" />
                  <span className="text-xs font-bold">Telegram Card</span>
                </button>

                {/* Crypto */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('crypto')}
                  className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center ${
                    paymentMethod === 'crypto'
                      ? 'bg-amber-500/15 border-amber-500 text-slate-900 dark:text-white'
                      : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <Bitcoin className="w-5 h-5 text-amber-500 mb-1" />
                  <span className="text-xs font-bold">Crypto (BTC)</span>
                </button>
              </div>

              {/* iDEAL Bank Selector if chosen */}
              {paymentMethod === 'ideal' && (
                <div className="mt-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 flex items-center space-x-3">
                  <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Selecteer jouw bank:</span>
                  <select
                    value={selectedIdealBank}
                    onChange={(e) => setSelectedIdealBank(e.target.value)}
                    className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white font-medium focus:ring-1 focus:ring-amber-400 outline-none"
                  >
                    <option value="ing">ING Bank</option>
                    <option value="rabobank">Rabobank</option>
                    <option value="abnamro">ABN AMRO</option>
                    <option value="sns">SNS Bank</option>
                    <option value="asn">ASN Bank</option>
                    <option value="regiobank">RegioBank</option>
                    <option value="knab">Knab</option>
                    <option value="bunq">bunq</option>
                  </select>
                </div>
              )}
            </div>

            {/* One-time Payment Action Button */}
            <div className="pt-2 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                Eenmalige betaling • Geen maandelijks abonnement
              </p>
              <button
                onClick={handleBuy}
                disabled={isProcessing}
                className="w-full sm:w-auto sm:min-w-[300px] py-3.5 px-8 rounded-xl bg-[#FF4500] hover:bg-[#E03E00] text-white font-semibold text-base shadow-xs transition-colors disabled:opacity-50"
              >
                {isProcessing ? 'Verbinding maken...' : `Nu Kopen (${getPackagePrice(selectedPackage)})`}
              </button>
            </div>

            {/* VIP & Bonus Credits Banner (From screenshot) */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center space-x-2 text-xs font-bold text-[#0162FF] dark:text-[#6495ED]">
                <Crown className="w-4 h-4 text-[#FF4500]" />
                <span>Koop een willekeurig aantal credits om permanent VIP te worden</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-300">
                <Gift className="w-4 h-4 text-[#FF4500]" />
                <span>
                  Koop nu en ontvang <strong>10% Bonus Credits ({selectedPackage.bonusCredits} credits)</strong> voor je volgende aankoop!
                </span>
              </div>
            </div>

            {/* Access Table (Direct from Remaker screenshot) */}
            <div className="pt-2">
              <h4 className="font-heading text-lg font-bold text-slate-900 dark:text-white mb-2 text-center">
                Toegang tot 40+ Hoge Kwaliteit AI Tools
              </h4>
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-950/80 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-4">Tool</th>
                      <th className="py-2.5 px-4">Credit Verbruik</th>
                      <th className="py-2.5 px-4">Toegang</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900/40 text-slate-700 dark:text-slate-300">
                    <tr>
                      <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white">Face Morph & Swap</td>
                      <td className="py-2.5 px-4">1 Generatie = 4 Credits</td>
                      <td className="py-2.5 px-4 text-emerald-600 dark:text-emerald-400 font-medium">Volledig Actief</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white">AI Avatar Maker</td>
                      <td className="py-2.5 px-4">2 Afbeeldingen = 8 Credits</td>
                      <td className="py-2.5 px-4 text-emerald-600 dark:text-emerald-400 font-medium">Gratis te Proberen</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white">AI Meme Generator</td>
                      <td className="py-2.5 px-4">4 Memes = 1 Credit</td>
                      <td className="py-2.5 px-4 text-emerald-600 dark:text-emerald-400 font-medium">Gratis te Proberen</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white">AI Sticker Generator</td>
                      <td className="py-2.5 px-4">2 Stickers = 4 Credits</td>
                      <td className="py-2.5 px-4 text-emerald-600 dark:text-emerald-400 font-medium">Gratis te Proberen</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white">Tattoo Simulator</td>
                      <td className="py-2.5 px-4">2 Visuals = 4 Credits</td>
                      <td className="py-2.5 px-4 text-amber-600 dark:text-amber-400 font-medium">Gratis te Proberen 🎁</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white">Text to Video (Veo 3.1)</td>
                      <td className="py-2.5 px-4">1 HD Video = 12 Credits</td>
                      <td className="py-2.5 px-4 text-emerald-600 dark:text-emerald-400 font-medium">Volledig Actief</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 4-Step Diagram: Hoe verdien je Bonus Credits (From bottom of user screenshot) */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="text-center mb-4">
                <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">
                  Swapsmoel Beloningsprogramma
                </span>
                <h4 className="font-heading text-xl font-bold text-slate-900 dark:text-white">
                  Hoe Verdien je Bonus Credits?
                </h4>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                
                {/* Stap 01 */}
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
                  <div className="text-amber-500 font-heading text-2xl font-black mb-1">01</div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Doe een Betaling</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Koop een bundel naar keuze</div>
                </div>

                {/* Stap 02 */}
                <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-center">
                  <div className="text-indigo-500 font-heading text-2xl font-black mb-1">02</div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Ontvang Bonus</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">10% extra staat in afwachting</div>
                </div>

                {/* Stap 03 */}
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                  <div className="text-emerald-500 font-heading text-2xl font-black mb-1">03</div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Volgende Aankoop</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Binnen 30 dagen geldigheid</div>
                </div>

                {/* Stap 04 */}
                <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-center">
                  <div className="text-purple-500 font-heading text-2xl font-black mb-1">04</div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Auto-Toegevoegd</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Direct opgeteld bij je saldo</div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Tab Content: SUBSCRIPTIONS */}
        {activeTab === 'subscription' && (
          <div className="p-4 sm:p-6 space-y-6">
            <div className="text-center max-w-xl mx-auto">
              <h3 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                Swapsmoel Studio Abonnementen
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                Voor content creators, agencies en professionals die continu de nieuwste AI filters en onbeperkte encrypted cloudopslag nodig hebben.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
              
              {/* Pro Maandelijks */}
              <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between shadow-xs">
                <div>
                  <div className="inline-block px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 mb-3">
                    Pro Maandelijks
                  </div>
                  <div className="font-heading text-3xl font-black text-slate-900 dark:text-white">
                    €19,99 <span className="text-sm font-normal text-slate-500 dark:text-slate-400">/ maand</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Maandelijks opzegbaar via je dashboard</p>

                  <ul className="mt-6 space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                    <li className="flex items-center"><Check className="w-4 h-4 text-emerald-500 mr-2 shrink-0" /> 2.500 Credits per maand</li>
                    <li className="flex items-center"><Check className="w-4 h-4 text-emerald-500 mr-2 shrink-0" /> Onbeperkte End-to-End Encrypted Cloud Storage</li>
                    <li className="flex items-center"><Check className="w-4 h-4 text-emerald-500 mr-2 shrink-0" /> Toegang tot Veo 3.1 & Flux AI</li>
                    <li className="flex items-center"><Check className="w-4 h-4 text-emerald-500 mr-2 shrink-0" /> Batch bewerking tot 20 bestanden tegelijk</li>
                  </ul>
                </div>

                <button
                  onClick={handleBuy}
                  className="mt-6 w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 font-bold text-sm transition-all"
                >
                  Start Pro Maandplan
                </button>
              </div>

              {/* Creator Jaarlijks */}
              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-sm flex flex-col justify-between relative">
                <div className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full bg-[#FF4500] text-white text-[10px] font-semibold uppercase">
                  25% Extra Voordeel
                </div>

                <div>
                  <div className="inline-block px-2.5 py-1 rounded-md bg-slate-200 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 mb-3">
                    Creator Jaarabonnement
                  </div>
                  <div className="font-heading text-3xl font-black text-slate-900 dark:text-white">
                    €14,99 <span className="text-sm font-normal text-slate-500 dark:text-slate-400">/ maand</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Jaarlijks gefactureerd (€179,88/jaar)</p>

                  <ul className="mt-6 space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                    <li className="flex items-center"><Check className="w-4 h-4 text-amber-500 mr-2 shrink-0" /> 3.500 Credits per maand (incl. bonus)</li>
                    <li className="flex items-center"><Check className="w-4 h-4 text-amber-500 mr-2 shrink-0" /> Prioriteits-GPU voor razendsnelle generaties</li>
                    <li className="flex items-center"><Check className="w-4 h-4 text-amber-500 mr-2 shrink-0" /> 4K Ultra-HD Super Resolutie Export</li>
                    <li className="flex items-center"><Check className="w-4 h-4 text-amber-500 mr-2 shrink-0" /> VIP Status & Dedicated Ondersteuning</li>
                  </ul>
                </div>

                <button
                  onClick={handleBuy}
                  className="mt-6 w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-amber-500/20"
                >
                  Kies Creator Jaarplan
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Tab Content: FAQ (From image.png translated to Dutch) */}
        {activeTab === 'faq' && (
          <div className="p-4 sm:p-6 space-y-4 max-w-3xl mx-auto">
            <div className="text-center mb-6">
              <h3 className="font-heading text-2xl font-bold text-slate-900 dark:text-white">
                Veelgestelde Vragen (FAQ)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Alles wat je moet weten over credits, betalingen en beveiliging
              </p>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <h5 className="font-bold text-sm text-slate-900 dark:text-white mb-1">Wat zijn credits?</h5>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Een credit is de valuta die wordt gebruikt om te betalen voor de berekeningen van onze AI tools. Het creditverbruik hangt af van de rekencapaciteit van de gebruikte tool.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <h5 className="font-bold text-sm text-slate-900 dark:text-white mb-1">Hoe lang zijn aangeschafte credits geldig?</h5>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Alle aangeschafte credits zijn <strong>permanent geldig</strong>. Je kunt ze op ieder gewenst moment gebruiken zonder verloopdatum.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <h5 className="font-bold text-sm text-slate-900 dark:text-white mb-1">Welke betaalopties accepteren jullie?</h5>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Wij accepteren iDEAL voor Nederlandse klanten, Bancontact voor België, reguliere creditcards, Apple Pay, Telegram card payments en Cryptocurrencies.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <h5 className="font-bold text-sm text-slate-900 dark:text-white mb-1">Kan ik mijn aankoop annuleren?</h5>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Bij creditbundels hoef je niets te annuleren omdat het een eenmalige betaling is zonder maandelijks abonnement. We zullen nooit automatisch geld van je rekening afschrijven.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <h5 className="font-bold text-sm text-slate-900 dark:text-white mb-1">Is jullie betaalservice veilig?</h5>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Ja. Wij slaan nooit je creditcard- of bankgegevens op. Betalingen worden 100% veilig verwerkt via versleutelde Europese gateways met 256-bit encryptie.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <h5 className="font-bold text-sm text-slate-900 dark:text-white mb-1">Wat zijn Bonus Credits en hoe verdien ik ze?</h5>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Bij elke aankoop verdien je 10% extra Bonus Credits als bedankje. Deze credits worden klaargezet voor je volgende aankoop en automatisch toegevoegd aan je account.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content: BILLING HISTORY */}
        {activeTab === 'billing' && (
          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-heading text-xl font-bold text-slate-900 dark:text-white">
                Facturatiegeschiedenis
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Gekoppeld aan {profile?.email}
              </span>
            </div>

            {transactions.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800">
                <Receipt className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Nog geen eerdere facturen gevonden</p>
                <p className="text-xs text-slate-500 mt-1">Zodra je credits aanschaft, verschijnen je officiële factuurspecificaties hier.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-950/80 text-slate-600 dark:text-slate-400 uppercase font-bold">
                    <tr>
                      <th className="py-2.5 px-4">Factuurnummer</th>
                      <th className="py-2.5 px-4">Datum</th>
                      <th className="py-2.5 px-4">Credits</th>
                      <th className="py-2.5 px-4">Bedrag</th>
                      <th className="py-2.5 px-4">Methode</th>
                      <th className="py-2.5 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900/40 text-slate-700 dark:text-slate-300">
                    {transactions.map((tx) => (
                      <tr key={tx.id}>
                        <td className="py-2.5 px-4 font-mono font-bold text-amber-600 dark:text-amber-400">{tx.invoiceNumber}</td>
                        <td className="py-2.5 px-4">{new Date(tx.createdAt).toLocaleDateString('nl-NL')}</td>
                        <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white">+{tx.credits} 🪙</td>
                        <td className="py-2.5 px-4 font-bold">{CURRENCY_RATES[tx.currency]?.format(tx.amount) || `€${tx.amount}`}</td>
                        <td className="py-2.5 px-4 uppercase">{tx.paymentMethod}</td>
                        <td className="py-2.5 px-4 text-emerald-600 dark:text-emerald-400 font-bold">Betaald ✓</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
