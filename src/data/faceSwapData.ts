export interface FaceSwapSample {
  id: string;
  title: string;
  url: string;
  type: 'photo' | 'video' | 'target';
  facesCount?: number;
}

export interface DetectedFace {
  id: string;
  index: number;
  box: {
    x: number; // percentage 0-100
    y: number;
    width: number;
    height: number;
  };
  cropUrl: string;
  confidence: number;
  label?: string;
}

export interface SwapHistoryItem {
  id: string;
  medium: 'photo' | 'video';
  mode: 'single' | 'multiple' | 'batch';
  modelVersion: 'v1' | 'v2' | 'hd';
  originalUrl: string;
  targetUrl: string;
  resultUrl: string;
  timestamp: string;
  creditsCost: number;
}

// 1. Curated photo originals for Single Face
export const PHOTO_ORIGINALS_SINGLE: FaceSwapSample[] = [
  {
    id: 'orig_business_man',
    title: 'Zakelijk Pak',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
    type: 'photo',
    facesCount: 1,
  },
  {
    id: 'orig_glamour_woman',
    title: 'Rode Loper Glamour',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    type: 'photo',
    facesCount: 1,
  },
  {
    id: 'orig_cyber_punk',
    title: 'Cyberpunk Neon',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
    type: 'photo',
    facesCount: 1,
  },
  {
    id: 'orig_vintage_pilot',
    title: 'Vintage Piloot',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
    type: 'photo',
    facesCount: 1,
  },
];

// 2. Curated photo originals for Multiple Faces (Group photos)
export const PHOTO_ORIGINALS_MULTIPLE: FaceSwapSample[] = [
  {
    id: 'orig_group_friends',
    title: 'Vriendengroep Festival',
    url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1000&q=80',
    type: 'photo',
    facesCount: 4,
  },
  {
    id: 'orig_group_business',
    title: 'Zakelijk Team Overleg',
    url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1000&q=80',
    type: 'photo',
    facesCount: 3,
  },
  {
    id: 'orig_group_dinner',
    title: 'Feestelijk Diner',
    url: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1000&q=80',
    type: 'photo',
    facesCount: 3,
  },
];

// 3. Curated Target Faces ("Dit gezicht komt op het origineel")
export const TARGET_FACES: FaceSwapSample[] = [
  {
    id: 'target_celeb_1',
    title: 'Filmster Look',
    url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80',
    type: 'target',
  },
  {
    id: 'target_celeb_2',
    title: 'Topmodel Vrouw',
    url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80',
    type: 'target',
  },
  {
    id: 'target_celeb_3',
    title: 'Executive Man',
    url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80',
    type: 'target',
  },
  {
    id: 'target_celeb_4',
    title: 'Spontaan Meisje',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80',
    type: 'target',
  },
];

// 4. Curated Video Originals
export const VIDEO_ORIGINALS_SAMPLE: FaceSwapSample[] = [
  {
    id: 'video_orig_talking',
    title: 'Pratende Man in Studio (8s)',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    type: 'video',
    facesCount: 1,
  },
  {
    id: 'video_orig_dance',
    title: 'Dansende Vrouw Buiten (6s)',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
    type: 'video',
    facesCount: 1,
  },
];

// Mock pre-detected faces for the sample group photos to give instantaneous 1-click results!
export const SAMPLE_DETECTED_FACES: Record<string, DetectedFace[]> = {
  orig_group_friends: [
    {
      id: 'f1',
      index: 1,
      box: { x: 14, y: 22, width: 18, height: 26 },
      cropUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      confidence: 0.98,
      label: 'Persoon 1 (Links)',
    },
    {
      id: 'f2',
      index: 2,
      box: { x: 38, y: 18, width: 17, height: 25 },
      cropUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      confidence: 0.99,
      label: 'Persoon 2 (Midden)',
    },
    {
      id: 'f3',
      index: 3,
      box: { x: 65, y: 20, width: 19, height: 27 },
      cropUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
      confidence: 0.97,
      label: 'Persoon 3 (Rechts)',
    },
  ],
  orig_group_business: [
    {
      id: 'b1',
      index: 1,
      box: { x: 20, y: 25, width: 20, height: 28 },
      cropUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80',
      confidence: 0.99,
      label: 'Manager 1',
    },
    {
      id: 'b2',
      index: 2,
      box: { x: 55, y: 22, width: 22, height: 30 },
      cropUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
      confidence: 0.98,
      label: 'Manager 2',
    },
  ],
};

// SEO Content per variant
export const FACESWAP_SEO_CONTENT = {
  photo_single: {
    title: 'AI Face Swap Foto (Eén Gezicht) • Direct Online & Naadloos',
    description:
      'Zet elk doelgezicht fotorealistisch op een bestaande foto met behoud van belichting, huidskleur, haar en gezichtsuitdrukking.',
    steps: [
      { step: '1', title: 'Upload Origineel', desc: 'Kies een foto waarin je het gezicht wilt vervangen.' },
      { step: '2', title: 'Kies Doelgezicht', desc: 'Upload de foto van het gezicht dat erop moet komen.' },
      { step: '3', title: 'Swap & Download', desc: 'Binnen seconden klaar in HD kwaliteit met voor/na-slider.' },
    ],
    faq: [
      {
        q: 'Blijven haar, lichaam en achtergrond hetzelfde?',
        a: 'Ja! Alles buiten het gezicht (kapsel, kleding, pose, belichting en achtergrond) blijft 100% ongewijzigd van het origineel.',
      },
      {
        q: 'Wat is het verschil tussen model v1 en v2?',
        a: 'Model v1 is uiterst stabiel voor klassieke portretten. Model v2 is sneller, realistischer en kan beter omgaan met brillen, schaduwen of haarlokken voor het gezicht.',
      },
    ],
  },
  photo_multiple: {
    title: 'Meerdere Gezichten Swappen op Groepsfoto’s • Swapsmoel AI',
    description:
      'Vervang afzonderlijke gezichten op groepsfoto’s en feestfoto’s. Onze AI detecteert automatisch elk gezicht en laat jou kiezen wie je vervangt.',
    steps: [
      { step: '1', title: 'Groepsfoto Uploaden', desc: 'Upload je groepsfoto; gezichten worden direct gedetecteerd.' },
      { step: '2', title: 'Wijs Doelgezichten Toe', desc: 'Kies per persoon welk gezicht er moet komen.' },
      { step: '3', title: 'Multi-Swap', desc: 'Eén klik genereert het complete groepsresultaat.' },
    ],
    faq: [
      {
        q: 'Moet ik elk gezicht vervangen?',
        a: 'Nee, lege slots blijven exact zoals in het origineel. Je kunt 1, 2 of alle gezichten tegelijk vervangen.',
      },
      {
        q: 'Hoeveel credits kost een meervoudige swap?',
        a: 'Een meervoudige fotoswap kost 4 credits, ongeacht hoeveel gezichten er op de groepsfoto staan.',
      },
    ],
  },
  photo_batch: {
    title: 'Batch Face Swap (tot 50 Foto’s Tegelijk) • Snel & Geautomatiseerd',
    description:
      'Zet hetzelfde doelgezicht in één klik op tot wel 50 verschillende foto’s tegelijk. Ideaal voor fotoshoots, content creators en marketing.',
    steps: [
      { step: '1', title: 'Originelen Selecteren', desc: 'Sleep tot 50 foto’s tegelijk in het uploadvlak.' },
      { step: '2', title: 'Doelgezicht Kiezen', desc: 'Upload het gezicht dat op alle foto’s moet komen.' },
      { step: '3', title: 'Alles Downloaden', desc: 'Volg de wachtrij en download alles met één klik als zip.' },
    ],
    faq: [
      {
        q: 'Wat gebeurt er als een foto mislukt?',
        a: 'Mislukte foto’s in een batch kosten geen credits. Je betaalt uitsluitend voor succesvol voltooide swaps.',
      },
    ],
  },
  video_single: {
    title: 'Video & GIF Face Swap (Eén Gezicht) • Frame-voor-frame AI',
    description:
      'Vervang het gezicht in een video of GIF met vloeiende tracking en behoud van emoties en lipbewegingen tot 4K.',
    steps: [
      { step: '1', title: 'Video Uploaden', desc: 'Ondersteunt MP4, MOV, WebM en GIF tot 500 MB.' },
      { step: '2', title: 'Kies Fragment & Doel', desc: 'Trim optioneel de duur en upload het doelgezicht.' },
      { step: '3', title: 'Renderen & Bekijken', desc: 'Neuraal model volgt het gezicht frame-voor-frame.' },
    ],
    faq: [
      {
        q: 'Hoe werkt de prijsberekening voor video?',
        a: 'Videoverwerking wordt transparant per seconde berekend. Je ziet het exacte aantal credits vóórdat je klikt.',
      },
      {
        q: 'Moet ik op de pagina blijven wachten?',
        a: 'Nee! Video’s worden op de achtergrond gerenderd. Je creatie blijft bewaard in My Creation.',
      },
    ],
  },
};
