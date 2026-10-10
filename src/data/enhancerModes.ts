export interface EnhancerModeDef {
  id: 'upscale' | 'unblur' | 'enhance' | 'face_restore' | 'text_enhance' | 'old_photo';
  name: string;
  description: string;
  typicalInput: string;
  sampleBefore: string;
  sampleAfter: string;
}

export const ENHANCER_MODES: EnhancerModeDef[] = [
  {
    id: 'upscale',
    name: 'Upscale',
    description: 'Vergroot met behoud van detail en scherpte',
    typicalInput: 'Kleine webafbeelding, productfoto',
    sampleBefore: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=40',
    sampleAfter: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=1200&q=90',
  },
  {
    id: 'unblur',
    name: 'Unblur',
    description: 'Haalt bewegings- en focusonscherpte weg',
    typicalInput: 'Bewogen foto, onscherp moment',
    sampleBefore: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=40',
    sampleAfter: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=90',
  },
  {
    id: 'enhance',
    name: 'Enhance',
    description: 'Voegt fijn detail en microtextuur toe',
    typicalInput: 'Vlakke, gecomprimeerde foto',
    sampleBefore: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=40',
    sampleAfter: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=90',
  },
  {
    id: 'face_restore',
    name: 'Portrait / Face Restore',
    description: 'Herstelt ogen, huid, wimpers en haar natuurgetrouw',
    typicalInput: 'Onscherp of klein gezicht',
    sampleBefore: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=40',
    sampleAfter: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1200&q=90',
  },
  {
    id: 'text_enhance',
    name: 'Text Enhance',
    description: 'Maakt vage letters, cijfers en documenten weer leesbaar',
    typicalInput: 'Screenshot, scan, bonnetje, document',
    sampleBefore: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=400&q=40',
    sampleAfter: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=1200&q=90',
  },
  {
    id: 'old_photo',
    name: 'Old Photo',
    description: 'Herstelt krassen, vouwen, vervaging en verkleuring',
    typicalInput: 'Gescande oude historische foto',
    sampleBefore: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=40',
    sampleAfter: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=1200&q=90',
  },
];
