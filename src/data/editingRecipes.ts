export interface NanoRecipe {
  id: string;
  name: string;
  description: string;
  slots: { label: string; tip: string }[];
  defaultPrompt: string;
  thumbnail: string;
}

export const NANO_RECIPES: NanoRecipe[] = [
  {
    id: 'custom',
    name: 'Custom Recept',
    description: 'Vrij opdrachtveld met maximaal 3 referentiebeelden.',
    slots: [{ label: 'Hoofdafbeelding *', tip: 'Basis foto om te bewerken' }],
    defaultPrompt: '',
    thumbnail: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'photo_to_figure',
    name: 'Photo to Figure',
    description: 'Verander een persoon in een gedetailleerd vinyl verzamelfiguurtje op acryl display.',
    slots: [{ label: 'Foto Persoon *', tip: 'Duidelijke foto van het hele lichaam of bovenlichaam' }],
    defaultPrompt: 'Transform person into a detailed Japanese collectible vinyl action figure toy on an acrylic round stand, studio toy photography lighting, plastic sheen',
    thumbnail: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'pose_control',
    name: 'Pose Control',
    description: 'Neem de houding over van een pose-referentie met behoud van persoon en kleding.',
    slots: [
      { label: 'Persoon *', tip: 'Foto van het karakter dat de pose aanneemt' },
      { label: 'Pose Referentie *', tip: 'Afbeelding met de gewenste lichaamshouding' },
    ],
    defaultPrompt: 'Adopt exact body pose from the second image while strictly preserving identity, facial features and clothes from the first image',
    thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'outfit_extract',
    name: 'Outfit Extract',
    description: 'Isoleer kledingstukken van een foto op een strakke witte studio achtergrond.',
    slots: [{ label: 'Foto met Kleding *', tip: 'Foto met de outfit die je wilt isoleren' }],
    defaultPrompt: 'Extract clothing items cleanly on pure white studio background, ghost mannequin display, high fashion e-commerce presentation',
    thumbnail: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'outfit_try_on',
    name: 'Outfit Try-On',
    description: 'Pas virtueel een kledingstuk of outfit toe op een foto van jezelf.',
    slots: [
      { label: 'Model / Persoon *', tip: 'Foto van jezelf' },
      { label: 'Kledingstuk *', tip: 'Foto van de kleding die je wilt passen' },
    ],
    defaultPrompt: 'Seamlessly dress the person in the provided garment, matching natural folds, lighting and body silhouette photorealistically',
    thumbnail: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'polaroid',
    name: 'AI Polaroid Photo',
    description: 'Klassieke vintage Polaroid instantfoto met authentieke witte rand en nostalgische kleuren.',
    slots: [{ label: 'Foto *', tip: 'Elke foto naar Polaroid' }],
    defaultPrompt: 'Vintage authentic Polaroid instant film aesthetic, genuine white paper border, nostalgic warm colors and soft flash vignette',
    thumbnail: 'https://images.unsplash.com/photo-1526045612212-70caf35c14df?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'cartoon_frame',
    name: 'Cartoon Frame',
    description: 'Vrolijke 2D animatie- en cartoonstijl met heldere kleuren en getekende omlijsting.',
    slots: [{ label: 'Foto *', tip: 'Portret of huisdier' }],
    defaultPrompt: '2D Saturday morning cartoon illustration style, expressive cel shading, vibrant clean lineart, playful animation frame',
    thumbnail: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'auto_enhance',
    name: 'Auto Enhance',
    description: 'Professionele studiokleurcorrectie, dynamisch bereik en scherpteherstel.',
    slots: [{ label: 'Foto *', tip: 'Wazige of onderbelichte foto' }],
    defaultPrompt: 'Professional commercial color grading, high dynamic range balance, crisp natural micro-contrast, studio clarity',
    thumbnail: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'auto_beauty',
    name: 'Auto Beauty',
    description: 'Subtiele editorial beauty-retouche met behoud van natuurlijke huidtextuur en sprankelende ogen.',
    slots: [{ label: 'Portretfoto *', tip: 'Dichtbij portret' }],
    defaultPrompt: 'High fashion editorial beauty retouch, pristine skin texture without blurring, bright catchlights in eyes, healthy radiance',
    thumbnail: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'cute_emoji_pack',
    name: 'Cute Emoji Pack',
    description: 'Set van schattige 3D emoji stickers gebaseerd op de gelaatstrekken van de foto.',
    slots: [{ label: 'Portret of Huisdier *', tip: 'Duidelijk gezicht' }],
    defaultPrompt: 'Set of 4 cute stylized glossy 3D emoji stickers expressing happy, surprised, cool and laughing emotions on white backdrop',
    thumbnail: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'wooden_figurine',
    name: 'Wooden Figurine',
    description: 'Handgesneden Scandinavisch houten beeldje met natuurlijke nerfstructuur.',
    slots: [{ label: 'Foto *', tip: 'Persoon, dier of object' }],
    defaultPrompt: 'Handcrafted Scandinavian carved wooden figurine, visible tactile timber grain, warm teak wood oil finish',
    thumbnail: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'figure_to_real',
    name: 'Figure to Real',
    description: 'Transformeer een pop, standbeeld of actiefiguur naar een levensecht persoon.',
    slots: [{ label: 'Figuur / Beeldje *', tip: 'Foto van miniatuur of actiefiguur' }],
    defaultPrompt: 'Transform miniature action figure or doll into a real living photorealistic human being in genuine environment, 8k photography',
    thumbnail: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'photo_to_sticker',
    name: 'Photo to Sticker',
    description: 'Die-cut vinyl sticker met dikke witte contourrand en glanzende afwerking.',
    slots: [{ label: 'Foto *', tip: 'Onderwerp dat sticker wordt' }],
    defaultPrompt: 'Die-cut vinyl sticker with thick clean white outline, subtle glossy drop shadow on pure transparent backdrop',
    thumbnail: 'https://images.unsplash.com/photo-1572375992501-4b0892d50c69?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'photo_to_sketch',
    name: 'Photo to Sketch',
    description: 'Gedetailleerde potloodschets op zwaar getextureerd tekenpapier met arceringen.',
    slots: [{ label: 'Foto *', tip: 'Portret, dier of architectuur' }],
    defaultPrompt: 'Detailed graphite pencil drawing on rough textured sketch paper, delicate cross-hatching, fine artist strokes',
    thumbnail: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'sketch_coloring',
    name: 'Sketch Coloring',
    description: 'Kleur zwart-wit lijntekeningen of schetsen in met rijke, natuurlijke kleuren.',
    slots: [{ label: 'Zwart-Wit Schets *', tip: 'Lijntekening of schets' }],
    defaultPrompt: 'Breathe rich vibrant colors into the black and white lineart, soft realistic volume, painterly illumination',
    thumbnail: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'sketch_to_real',
    name: 'Sketch to Real',
    description: 'Zet een ruwe schets om in een fotorealistisch 8K beeld.',
    slots: [{ label: 'Schets *', tip: 'Ruwe schets van gezicht of product' }],
    defaultPrompt: 'Convert concept sketch into a hyperrealistic 8K photograph with tangible realistic textures and studio lighting',
    thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'real_comic_split',
    name: 'Real-Comic Split',
    description: 'Diagonale split-screen foto: ene helft echte foto, andere helft stripboekstijl.',
    slots: [{ label: 'Foto *', tip: 'Portret of actieshot' }],
    defaultPrompt: 'Diagonal split screen comparison: left side real photo, right side bold superhero comic book art style',
    thumbnail: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'comic_panels',
    name: 'Comic Panels',
    description: 'Verander foto in een dynamische stripboekpagina met halftone rasterstippen.',
    slots: [{ label: 'Foto *', tip: 'Verhaal- of portretfoto' }],
    defaultPrompt: 'Graphic novel comic strip page layout with ink lines, speech caption box, halftone print texture',
    thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'product_shot',
    name: 'Product Shot',
    description: 'Plaats een product op een luxe studio podium met realistische reflecties.',
    slots: [
      { label: 'Productfoto *', tip: 'Foto van het artikel' },
      { label: 'Achtergrondsfeer (Optioneel)', tip: 'Gewenste stijl van podium' },
    ],
    defaultPrompt: 'High-end commercial product photography on minimalist stone podium with soft caustic glass reflections, luxury studio softbox',
    thumbnail: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'jewelry_try_on',
    name: 'Jewelry Try-On',
    description: 'Draag digitaal oorbellen, kettingen of ringen met fotorealistische schittering.',
    slots: [
      { label: 'Portretfoto *', tip: 'Foto van nek, oren of pols' },
      { label: 'Sieraad *', tip: 'Foto van het sieraad' },
    ],
    defaultPrompt: 'Photorealistically fit the jewelry onto the model with physically accurate metallic reflections and gemstone refraction',
    thumbnail: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'wedding_photo',
    name: 'Wedding Photo',
    description: 'Romantische droombruiloft fotoshoot in weelderige tuin met gouden uur licht.',
    slots: [
      { label: 'Foto Koppel / Persoon *', tip: 'Foto van bruid of bruidegom' },
      { label: 'Trouwdecor (Optioneel)', tip: 'Gewenste trouwlocatie' },
    ],
    defaultPrompt: 'Luxury romantic bridal editorial photoshoot, elegant couture wedding attire, sunlit botanical conservatory background',
    thumbnail: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'scene_annotator',
    name: 'Scene Annotator',
    description: 'Voeg technische bouwtekening lijnen, afmetingen en architecturale markeringen toe.',
    slots: [{ label: 'Foto *', tip: 'Ruimte, gebouw of object' }],
    defaultPrompt: 'Architectural blueprint style technical annotations, white dimension lines, measurement callouts, schematic aesthetic',
    thumbnail: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'product_cutaway',
    name: 'Product Cutaway',
    description: 'Mechanische cutaway doorsnede die de interne premium onderdelen toont.',
    slots: [{ label: 'Productfoto *', tip: 'Auto, horloge of apparaat' }],
    defaultPrompt: 'Mechanical exploded technical cutaway view showing intricate internal high-precision engineering components',
    thumbnail: 'https://images.unsplash.com/photo-1508057198894-247b23fe5ade?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'vintage_style',
    name: 'Vintage Style',
    description: 'Warme analoge jaren 70/80 filmlook met natuurlijke lensflare en korrel.',
    slots: [{ label: 'Foto *', tip: 'Elke foto' }],
    defaultPrompt: 'Authentic 1975 35mm warm Kodachrome vintage aesthetic, subtle film grain, organic sun flare, faded analog tones',
    thumbnail: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
  },
];

export interface HalloweenFilterTemplate {
  id: string;
  name: string;
  prompt: string;
  thumbnail: string;
}

export const HALLOWEEN_TEMPLATES: HalloweenFilterTemplate[] = [
  {
    id: 'witch',
    name: 'Witch',
    prompt: 'Mystical gothic sorceress with glowing amethyst purple magical runes, moonlit midnight woods, velvet hooded cloak',
    thumbnail: 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'vampire',
    name: 'Vampire',
    prompt: 'Aristocratic Victorian vampire in deep velvet collar, subtle sharp fangs, pale porcelain skin, crimson candlelit manor',
    thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'pumpkin',
    name: 'Pumpkin',
    prompt: 'Enchanted Halloween pumpkin festival aesthetic, glowing jack-o-lantern candlelight, rustic autumn foliage',
    thumbnail: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'graveyard',
    name: 'Graveyard',
    prompt: 'Eerie Victorian graveyard shrouded in ground fog, wrought iron gothic monuments, full moon silhouette',
    thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'skeleton',
    name: 'Skeleton',
    prompt: 'Intricate ornate Día de los Muertos sugar skull artistic facial makeup, black lace, blooming marigold flowers',
    thumbnail: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'blood_moon',
    name: 'Blood Moon',
    prompt: 'Apocalyptic eclipse blood moon casting deep scarlet light, dark silhouettes, dramatic cinematic contrast',
    thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'demon',
    name: 'Demon',
    prompt: 'Dark fantasy demon aesthetic, sleek obsidian horns, glowing ember eyes, dark smoke swirls',
    thumbnail: 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'ghost',
    name: 'Ghost',
    prompt: 'Ethereal translucent spirit apparition with glowing blue luminescence, floating vintage drapery, haunting fog',
    thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80',
  },
];

export const EYE_COLOR_OPTIONS = [
  { id: 'blue', label: 'Helder Blauw', color: '#1E90FF', prompt: 'vibrant clear sapphire blue irises, detailed natural corneal reflection' },
  { id: 'green', label: 'Smaragd Groen', color: '#2E8B57', prompt: 'radiant emerald green eyes with rich hazel flecks, lifelike eye anatomy' },
  { id: 'hazel', label: 'Warm Hazelnoot', color: '#A0522D', prompt: 'warm golden hazelnut eyes with deep brown contour and bright amber flecks' },
  { id: 'brown', label: 'Chocolade Bruin', color: '#5C4033', prompt: 'deep warm chocolate brown irises, glossy moist eye reflection' },
  { id: 'grey', label: 'Ijs Grijs', color: '#708090', prompt: 'striking cool steel grey eyes, crystalline pattern and sharp pupil' },
  { id: 'amber', label: 'Gouden Amber', color: '#FFBF00', prompt: 'rare glowing honey amber eyes with warm sunlight highlights' },
  { id: 'violet', label: 'Amethist Paars', color: '#8A2BE2', prompt: 'fantasy deep amethyst violet eyes with natural photorealistic iris fibers' },
  { id: 'redeye_fix', label: 'Rode Ogen Herstel', color: '#1A1A1A', prompt: 'natural pupil correction removing red eye flash glare, restoring authentic eye color' },
];

export const PASSPORT_PHOTO_FORMATS = [
  { id: 'standard_nl', label: 'Nederland / EU Paspoort & ID', dimensions: '35 x 45 mm', ratio: '35/45' },
  { id: 'us_passport', label: 'US Passport & Visa', dimensions: '2 x 2 inch (51 x 51 mm)', ratio: '1/1' },
  { id: 'dv_lottery', label: 'DV Green Card Lottery', dimensions: '600 x 600 px (2 x 2 inch)', ratio: '1/1' },
  { id: 'schengen_visa', label: 'Schengen Visum', dimensions: '35 x 45 mm', ratio: '35/45' },
  { id: 'custom', label: 'Aangepast Formaat (Custom)', dimensions: 'Handmatig instellen', ratio: 'custom' },
];

export const PASSPORT_BG_COLORS = [
  { id: 'white', label: 'Wit (Standaard NL)', hex: '#FFFFFF' },
  { id: 'light_grey', label: 'Lichtgrijs (NL Paspoort)', hex: '#E5E7EB' },
  { id: 'blue', label: 'Paspoort Blauw', hex: '#2563EB' },
  { id: 'dark_blue', label: 'Donkerblauw', hex: '#1E3A8A' },
  { id: 'red', label: 'Rood (Aziatisch Paspoort)', hex: '#DC2626' },
  { id: 'black', label: 'Zwart', hex: '#0F172A' },
  { id: 'custom', label: 'Eigen Kleur', hex: '#F3F4F6' },
];
