export interface DanceTemplate {
  id: string;
  name: string;
  genre: string;
  duration: string;
  previewGif: string;
  musicBpm: number;
}

export const DANCE_TEMPLATES: DanceTemplate[] = [
  {
    id: 'tiktok_shuffle',
    name: 'TikTok Shuffle & Slide',
    genre: 'Urban / HipHop',
    duration: '5s',
    previewGif: 'https://images.unsplash.com/photo-1547153760-18fc86324498?auto=format&fit=crop&w=400&q=80',
    musicBpm: 124,
  },
  {
    id: 'viral_kpop',
    name: 'K-Pop Point Choreography',
    genre: 'K-Pop',
    duration: '5s',
    previewGif: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=400&q=80',
    musicBpm: 128,
  },
  {
    id: 'disco_groove',
    name: '70s Disco Retro Wave',
    genre: 'Disco / Funk',
    duration: '5s',
    previewGif: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=400&q=80',
    musicBpm: 118,
  },
  {
    id: 'robot_pop',
    name: 'Popping & Cyber Lock',
    genre: 'Electronic',
    duration: '5s',
    previewGif: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=400&q=80',
    musicBpm: 130,
  },
  {
    id: 'latin_salsa',
    name: 'Latin Salsa Spin',
    genre: 'Latin / Rhythm',
    duration: '5s',
    previewGif: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=400&q=80',
    musicBpm: 105,
  },
  {
    id: 'breakdance_freeze',
    name: 'Street Breakdance Wave',
    genre: 'Streetdance',
    duration: '5s',
    previewGif: 'https://images.unsplash.com/photo-1545224144-b38cd309ef69?auto=format&fit=crop&w=400&q=80',
    musicBpm: 110,
  },
];

export interface VideoExploreItem {
  id: string;
  title: string;
  prompt: string;
  videoUrl: string;
  posterUrl: string;
  aspectRatio: '16:9' | '9:16' | '1:1';
  tool: string;
  author: string;
  likes: number;
}

export const VIDEO_EXPLORE_SAMPLES: VideoExploreItem[] = [
  {
    id: 'exp_1',
    title: 'Neon Cyberpunk Tokio Regen',
    prompt: 'Cinematic drone shot flying through rainy neon lit Tokyo streets with reflections and glowing billboards, 4k ultra realism',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
    aspectRatio: '16:9',
    tool: 'text_to_video',
    author: 'StudioNova',
    likes: 342,
  },
  {
    id: 'exp_2',
    title: 'Portret Slow Motion Wind',
    prompt: 'Slow motion hair blowing in sunset breeze, cinematic golden hour lighting, 24fps film aesthetic',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    aspectRatio: '9:16',
    tool: 'image_to_video',
    author: 'Elena_V',
    likes: 512,
  },
  {
    id: 'exp_3',
    title: 'Vliegende Adelaar over Alpen',
    prompt: 'Epic eagle gliding through Swiss snowy mountain peaks at dawn, majestic wings spread, cinematic dolly track',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
    aspectRatio: '16:9',
    tool: 'text_to_video',
    author: 'AlpineCapture',
    likes: 289,
  },
  {
    id: 'exp_4',
    title: 'Karakter Anime Bos Wandeling',
    prompt: '@char_1 walking peacefully through enchanted glowing forest with fireflies, Studio Ghibli magical realism',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
    aspectRatio: '16:9',
    tool: 'consistent_char_video',
    author: 'MangaCraft',
    likes: 421,
  },
  {
    id: 'exp_5',
    title: 'Streetdance Shuffle Routine',
    prompt: 'Full body streetdancer executing viral TikTok rhythm routine with smooth footwork and crowd cheering',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1547153760-18fc86324498?auto=format&fit=crop&w=800&q=80',
    aspectRatio: '9:16',
    tool: 'ai_dance',
    author: 'BeatMotion',
    likes: 677,
  },
  {
    id: 'exp_6',
    title: 'Reels Hook Product Reveal',
    prompt: 'Luxury perfume bottle rising out of black satin silk with water droplets and golden aura reflection',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80',
    aspectRatio: '9:16',
    tool: 'video_template',
    author: 'AdVenture',
    likes: 388,
  },
];
