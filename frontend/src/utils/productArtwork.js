/**
 * productArtwork.js
 * --------------------------------------------------------------
 * Inline SVG artwork generator for product cards.
 *
 * Goal: every product gets a unique, name-matching image WITHOUT
 * any external CDN dependency (Unsplash Source was deprecated mid-
 * 2024 and was rate-limiting us anyway). Each artwork is built
 * deterministically from the product's name + category so the
 * same product always renders the same art.
 *
 * Strategy:
 *   1) Classify the product into a "garment type" by keyword
 *      matching on the Vietnamese name (Ao, Quan, Dam, Giay, ...).
 *   2) Pick a deterministic base + accent color from a hash of the
 *      productId so reload-stable visuals don't feel random.
 *   3) Compose an SVG silhouette of that garment type, label it
 *      with the product name (properly diacritics-aware because we
 *      encode with encodeURIComponent), and embed it as a data:
 *      URL string the <img> tag can render.
 *
 * The output is intentionally small (~1-2 KB) and grayscale-ish so
 * the card grid doesn't look like a kids' crayon box.
 */

const PALETTE = [
  { base: '#2b3a55', accent: '#d29f96' }, // navy + dusty rose (default)
  { base: '#1f2937', accent: '#f59e0b' }, // slate + amber
  { base: '#3b3b3b', accent: '#7dd3fc' }, // charcoal + sky
  { base: '#0f766e', accent: '#fde68a' }, // teal + cream
  { base: '#7c2d12', accent: '#fcd34d' }, // rust + warm yellow
  { base: '#4c1d95', accent: '#fbbf24' }, // violet + gold
  { base: '#831843', accent: '#fda4af' }, // wine + blush
  { base: '#1e3a8a', accent: '#bef264' }, // deep blue + lime
];

/* Hash productId → stable palette index. Uses a small DJB2-like
 * hash so we don't pull in any dependency. */
function paletteIndex(productId) {
  const n = Number(productId) || 0;
  let h = 5381;
  let v = n;
  while (v > 0) {
    h = ((h << 5) + h + (v & 0xff)) >>> 0;
    v = Math.floor(v / 256);
  }
  return PALETTE[h % PALETTE.length];
}

const KW = [
  { type: 'ao-thun',      label: 'T-Shirt',     re: /\b(áo thun|ao thun)\b/i },
  { type: 'ao-so-mi',     label: 'Shirt',       re: /\b(áo sơ mi|ao so mi)\b/i },
  { type: 'ao-khoac',     label: 'Jacket',      re: /\b(áo khoác|ao khoac)\b/i },
  { type: 'ao-phao',      label: 'Puffer',      re: /\b(áo phao|ao phao)\b/i },
  { type: 'ao-hoodie',    label: 'Hoodie',      re: /\b(áo hoodie|ao hoodie|hoodie)\b/i },
  { type: 'ao-polo',      label: 'Polo',        re: /\b(áo polo|ao polo|polo)\b/i },
  { type: 'ao-vest',      label: 'Vest',        re: /\b(áo vest|ao vest|vest)\b/i },
  { type: 'dam',          label: 'Dress',       re: /\b(đầm|dam)\b/i },
  { type: 'vay',          label: 'Skirt',       re: /\b(váy|vay)\b/i },
  { type: 'quan-jeans',   label: 'Jeans',       re: /\b(quần jeans|quan jeans)\b/i },
  { type: 'quan-short',   label: 'Shorts',      re: /\b(quần short|quan short)\b/i },
  { type: 'quan-baggy',   label: 'Baggy',       re: /\b(quần baggy|quan baggy)\b/i },
  { type: 'quan-tay',     label: 'Trousers',    re: /\b(quần tây|quan tay|quần âu)\b/i },
  { type: 'quan-jogger',  label: 'Jogger',      re: /\b(jogger)\b/i },
  { type: 'giay-the-thao', label: 'Sneaker',    re: /\b(giày thể thao|giay the thao)\b/i },
  { type: 'giay-da',      label: 'Leather Shoe', re: /\b(giày da|giay da)\b/i },
  { type: 'giay-cao-got', label: 'Heel',         re: /\b(cao gót|cao got)\b/i },
  { type: 'sandal',       label: 'Sandal',       re: /\b(sandal)\b/i },
  { type: 'tui-xach',     label: 'Handbag',      re: /\b(túi|tui|balo)\b/i },
  { type: 'vi',           label: 'Wallet',       re: /\b(ví|vi)\b/i },
  { type: 'dong-ho',      label: 'Watch',        re: /\b(đồng hồ|dong ho)\b/i },
  { type: 'kinh-mat',     label: 'Sunglasses',   re: /\b(kính|kinh)\b/i },
  { type: 'mu',           label: 'Hat',          re: /\b(mũ|mu)\b/i },
  { type: 'khan',         label: 'Scarf',        re: /\b(khăn|khan)\b/i },
];

function classify(product) {
  const text = `${product.name || ''} ${product.categoryName || ''}`;
  for (const k of KW) if (k.re.test(text)) return k;
  return { type: 'generic', label: 'Garment' };
}

/* SVG silhouettes — all drawn on a 400x500 viewBox. Each silhouette
 * is centered horizontally and ~280px tall (top y=80, bottom y=360)
 * so the layout has room above for a small tag and below for the
 * product label. */

function silhouette(type) {
  switch (type) {
    case 'ao-thun':
      return (
        '<path d="M130 140 L170 110 L200 130 L230 110 L270 140 L290 170 L260 185 L260 360 ' +
        'L140 360 L140 185 L110 170 Z" fill="currentColor"/>' +
        '<path d="M200 130 Q210 160 200 175 Q190 160 200 130" fill="rgba(0,0,0,0.15)"/>'
      );
    case 'ao-so-mi':
      return (
        '<path d="M130 140 L170 110 L200 130 L230 110 L270 140 L295 175 L260 190 L260 360 ' +
        'L140 360 L140 190 L105 175 Z" fill="currentColor"/>' +
        '<line x1="200" y1="135" x2="200" y2="360" stroke="rgba(255,255,255,0.25)" stroke-width="2"/>' +
        '<circle cx="200" cy="170" r="2" fill="rgba(255,255,255,0.4)"/>' +
        '<circle cx="200" cy="200" r="2" fill="rgba(255,255,255,0.4)"/>' +
        '<circle cx="200" cy="230" r="2" fill="rgba(255,255,255,0.4)"/>' +
        '<circle cx="200" cy="260" r="2" fill="rgba(255,255,255,0.4)"/>'
      );
    case 'ao-khoac':
      return (
        '<path d="M120 140 L170 100 L200 125 L230 100 L280 140 L305 180 L275 200 L275 360 ' +
        'L125 360 L125 200 L95 180 Z" fill="currentColor"/>' +
        '<line x1="200" y1="125" x2="200" y2="360" stroke="rgba(255,255,255,0.2)" stroke-width="3"/>'
      );
    case 'ao-phao':
      return (
        '<path d="M120 140 L170 105 L200 130 L230 105 L280 140 L305 180 L275 200 L275 360 ' +
        'L125 360 L125 200 L95 180 Z" fill="currentColor"/>' +
        '<path d="M145 200 L255 200 M145 240 L255 240 M145 280 L255 280 M145 320 L255 320" ' +
        'stroke="rgba(255,255,255,0.18)" stroke-width="2"/>'
      );
    case 'ao-hoodie':
      return (
        '<path d="M130 145 L165 100 Q200 130 235 100 L270 145 L295 180 L270 200 L270 360 ' +
        'L130 360 L130 200 L105 180 Z" fill="currentColor"/>' +
        '<path d="M180 100 Q200 130 220 100 Q210 145 200 145 Q190 145 180 100 Z" fill="rgba(0,0,0,0.25)"/>'
      );
    case 'ao-polo':
      return (
        '<path d="M130 140 L170 110 L195 125 L205 125 L230 110 L270 140 L290 170 L260 185 ' +
        'L260 360 L140 360 L140 185 L110 170 Z" fill="currentColor"/>' +
        '<path d="M195 125 L205 125 L210 165 L200 175 L190 165 Z" fill="rgba(0,0,0,0.15)"/>'
      );
    case 'ao-vest':
      return (
        '<path d="M140 130 L180 110 L200 130 L220 110 L260 130 L290 170 L260 185 L260 360 ' +
        'L140 360 L140 185 L110 170 Z" fill="currentColor"/>' +
        '<path d="M180 130 L200 145 L220 130 L220 360 L180 360 Z" fill="rgba(255,255,255,0.06)"/>'
      );
    case 'dam':
      return (
        '<path d="M165 110 L200 105 L235 110 L255 180 L290 360 L110 360 L145 180 Z" fill="currentColor"/>' +
        '<line x1="200" y1="120" x2="200" y2="180" stroke="rgba(255,255,255,0.2)" stroke-width="2"/>'
      );
    case 'vay':
      return (
        '<path d="M170 130 L200 125 L230 130 L255 200 L290 360 L110 360 L145 200 Z" fill="currentColor"/>' +
        '<line x1="170" y1="180" x2="230" y2="180" stroke="rgba(255,255,255,0.15)" stroke-width="2"/>'
      );
    case 'quan-jeans':
      return (
        '<path d="M150 110 L250 110 L255 180 L240 360 L210 360 L200 200 L190 360 L160 360 L145 180 Z" fill="currentColor"/>' +
        '<line x1="200" y1="130" x2="200" y2="350" stroke="rgba(255,255,255,0.18)" stroke-width="2"/>' +
        '<rect x="160" y="140" width="30" height="14" fill="rgba(255,255,255,0.12)"/>' +
        '<rect x="210" y="140" width="30" height="14" fill="rgba(255,255,255,0.12)"/>'
      );
    case 'quan-short':
      return (
        '<path d="M150 110 L250 110 L255 200 L215 220 L210 200 L200 220 L190 200 L185 220 ' +
        'L145 200 Z" fill="currentColor"/>'
      );
    case 'quan-baggy':
      return (
        '<path d="M140 110 L260 110 L280 360 L240 360 L220 220 L200 360 L180 220 L160 360 ' +
        'L120 360 Z" fill="currentColor"/>'
      );
    case 'quan-tay':
      return (
        '<path d="M150 110 L250 110 L255 180 L240 360 L210 360 L200 200 L190 360 L160 360 L145 180 Z" fill="currentColor"/>' +
        '<line x1="200" y1="120" x2="200" y2="360" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>'
      );
    case 'quan-jogger':
      return (
        '<path d="M150 110 L250 110 L255 180 L235 360 L210 360 L200 220 L190 360 L165 360 ' +
        'L145 180 Z" fill="currentColor"/>' +
        '<line x1="200" y1="180" x2="200" y2="200" stroke="rgba(255,255,255,0.3)" stroke-width="3"/>'
      );
    case 'giay-the-thao':
      return (
        '<path d="M85 280 Q90 240 130 230 L220 230 Q280 240 305 270 L320 290 Q320 310 290 310 ' +
        'L100 310 Q80 310 85 280 Z" fill="currentColor"/>' +
        '<line x1="120" y1="240" x2="120" y2="290" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>' +
        '<line x1="160" y1="240" x2="160" y2="290" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>' +
        '<line x1="200" y1="240" x2="200" y2="290" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>' +
        '<line x1="240" y1="240" x2="240" y2="290" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>' +
        '<rect x="90" y="310" width="220" height="6" fill="rgba(0,0,0,0.3)"/>'
      );
    case 'giay-da':
      return (
        '<path d="M100 280 L150 240 L260 240 Q300 245 315 280 L315 295 Q315 310 295 310 ' +
        'L105 310 Q90 310 100 280 Z" fill="currentColor"/>' +
        '<line x1="200" y1="240" x2="200" y2="310" stroke="rgba(255,255,255,0.2)" stroke-width="2"/>'
      );
    case 'giay-cao-got':
      return (
        '<path d="M100 290 Q120 270 180 270 L270 270 Q300 280 305 295 L120 305 Q90 305 100 290 Z" fill="currentColor"/>' +
        '<path d="M290 305 L300 360 L312 360 L308 305 Z" fill="currentColor"/>' +
        '<rect x="90" y="305" width="220" height="6" fill="rgba(0,0,0,0.3)"/>'
      );
    case 'sandal':
      return (
        '<path d="M85 280 L315 280 Q325 290 320 305 L80 305 Q75 290 85 280 Z" fill="currentColor"/>' +
        '<line x1="200" y1="280" x2="200" y2="305" stroke="rgba(255,255,255,0.4)" stroke-width="3"/>' +
        '<line x1="145" y1="280" x2="145" y2="305" stroke="rgba(255,255,255,0.4)" stroke-width="3"/>' +
        '<line x1="255" y1="280" x2="255" y2="305" stroke="rgba(255,255,255,0.4)" stroke-width="3"/>'
      );
    case 'tui-xach':
      return (
        '<path d="M120 200 L280 200 L290 350 L110 350 Z" fill="currentColor"/>' +
        '<path d="M150 200 Q150 150 200 150 Q250 150 250 200" fill="none" stroke="currentColor" stroke-width="6"/>' +
        '<line x1="200" y1="220" x2="200" y2="340" stroke="rgba(255,255,255,0.15)" stroke-width="2"/>'
      );
    case 'vi':
      return (
        '<rect x="100" y="200" width="200" height="120" rx="8" fill="currentColor"/>' +
        '<line x1="100" y1="250" x2="300" y2="250" stroke="rgba(255,255,255,0.2)" stroke-width="2"/>'
      );
    case 'dong-ho':
      return (
        '<circle cx="200" cy="240" r="80" fill="currentColor"/>' +
        '<circle cx="200" cy="240" r="60" fill="rgba(255,255,255,0.08)"/>' +
        '<line x1="200" y1="240" x2="200" y2="200" stroke="rgba(255,255,255,0.6)" stroke-width="3"/>' +
        '<line x1="200" y1="240" x2="230" y2="240" stroke="rgba(255,255,255,0.6)" stroke-width="3"/>' +
        '<circle cx="200" cy="240" r="3" fill="rgba(255,255,255,0.8)"/>' +
        '<rect x="180" y="320" width="40" height="40" fill="currentColor"/>'
      );
    case 'kinh-mat':
      return (
        '<circle cx="150" cy="240" r="45" fill="none" stroke="currentColor" stroke-width="6"/>' +
        '<circle cx="250" cy="240" r="45" fill="none" stroke="currentColor" stroke-width="6"/>' +
        '<line x1="195" y1="240" x2="205" y2="240" stroke="currentColor" stroke-width="6"/>' +
        '<line x1="105" y1="240" x2="85" y2="230" stroke="currentColor" stroke-width="6"/>' +
        '<line x1="295" y1="240" x2="315" y2="230" stroke="currentColor" stroke-width="6"/>'
      );
    case 'mu':
      return (
        '<path d="M100 280 L300 280 Q310 280 305 295 L95 295 Q90 280 100 280 Z" fill="currentColor"/>' +
        '<ellipse cx="200" cy="240" rx="90" ry="55" fill="currentColor"/>' +
        '<rect x="100" y="280" width="200" height="6" fill="rgba(0,0,0,0.3)"/>'
      );
    case 'khan':
      return (
        '<path d="M120 200 L280 200 L300 350 L100 350 Z" fill="currentColor"/>' +
        '<path d="M150 230 L250 230 M150 260 L250 260 M150 290 L250 290 M150 320 L250 320" ' +
        'stroke="rgba(255,255,255,0.2)" stroke-width="1.5"/>'
      );
    default:
      // generic hanger + circle
      return (
        '<line x1="200" y1="120" x2="200" y2="160" stroke="currentColor" stroke-width="3"/>' +
        '<circle cx="200" cy="115" r="6" fill="none" stroke="currentColor" stroke-width="3"/>' +
        '<path d="M130 160 L200 200 L270 160 L270 360 L130 360 Z" fill="currentColor"/>'
      );
  }
}

/**
 * Build the full SVG markup. Use encodeURIComponent on the result
 * so the diacritics in productName survive being inlined into a
 * data: URL.
 */
export function buildProductArtwork(product) {
  const palette = paletteIndex(product?.productId);
  const { type, label } = classify(product);
  const name = String(product?.name || '').slice(0, 60);
  const category = String(product?.categoryName || label).slice(0, 30);

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice">` +
    `<defs>` +
    `<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0%" stop-color="${palette.base}"/>` +
    `<stop offset="100%" stop-color="#0a0f1c"/>` +
    `</linearGradient>` +
    `</defs>` +
    `<rect width="400" height="500" fill="url(#bg)"/>` +
    // top-left category chip
    `<rect x="14" y="14" width="${category.length * 9 + 24}" height="26" rx="13" fill="rgba(255,255,255,0.15)"/>` +
    `<text x="${14 + (category.length * 9 + 24) / 2}" y="32" font-family="Be Vietnam Pro, Inter, sans-serif" ` +
    `font-size="13" font-weight="600" fill="${palette.accent}" text-anchor="middle">${category}</text>` +
    // silhouette (use accent color)
    `<g color="${palette.accent}" transform="translate(0,40)">` +
    silhouette(type) +
    `</g>` +
    // bottom product-name label
    `<text x="200" y="430" font-family="Be Vietnam Pro, Inter, sans-serif" font-size="22" font-weight="700" ` +
    `fill="#f5f5f5" text-anchor="middle">${name}</text>` +
    `<text x="200" y="460" font-family="Be Vietnam Pro, Inter, sans-serif" font-size="12" ` +
    `fill="rgba(255,255,255,0.55)" text-anchor="middle">${label}</text>` +
    `</svg>`;

  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}
