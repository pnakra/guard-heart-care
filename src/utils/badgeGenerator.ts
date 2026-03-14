import { GFSBand } from '@/services/gfsCalculator';

const BAND_COLORS: Record<GFSBand, { hex: string; shieldsColor: string }> = {
  low: { hex: '#3bb34a', shieldsColor: 'brightgreen' },
  moderate: { hex: '#e8a735', shieldsColor: 'orange' },
  high: { hex: '#e05d44', shieldsColor: 'red' },
  critical: { hex: '#8b1a1a', shieldsColor: 'critical' },
};

export function getBadgeColor(band: GFSBand) {
  return BAND_COLORS[band];
}

export function generateBadgeSVG(score: number, band: GFSBand): string {
  const { hex } = BAND_COLORS[band];
  const label = 'Ground Floor Check';
  const value = `GFS ${score}/100`;
  const labelWidth = 138;
  const valueWidth = 80;
  const totalWidth = labelWidth + valueWidth;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20" role="img" aria-label="${label}: ${value}">
  <title>${label}: ${value}</title>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r">
    <rect width="${totalWidth}" height="20" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#r)">
    <rect width="${labelWidth}" height="20" fill="#555"/>
    <rect x="${labelWidth}" width="${valueWidth}" height="20" fill="${hex}"/>
    <rect width="${totalWidth}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="11">
    <text aria-hidden="true" x="${labelWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${label}</text>
    <text x="${labelWidth / 2}" y="14">${label}</text>
    <text aria-hidden="true" x="${labelWidth + valueWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${value}</text>
    <text x="${labelWidth + valueWidth / 2}" y="14">${value}</text>
  </g>
  <g transform="translate(4, 3)">
    <path fill="#fff" fill-opacity="0.9" d="M7 1.5C4.5 0.3 1.7 1.2 0.5 3.7s0 5.5 2.5 6.7L7 12.5l4-2.1c2.5-1.2 3.5-4.2 2.5-6.7S9.5 0.3 7 1.5z" transform="scale(0.85)"/>
  </g>
</svg>`;
}

export function generateShieldsUrl(score: number, band: GFSBand): string {
  const { shieldsColor } = BAND_COLORS[band];
  const encodedScore = encodeURIComponent(`${score}/100`);
  return `https://img.shields.io/badge/Ground_Floor_Check-${encodedScore}-${shieldsColor}`;
}

export function generateMarkdownBadge(score: number, band: GFSBand): string {
  const url = generateShieldsUrl(score, band);
  return `![Ground Floor Check](${url})`;
}

export function generateHTMLBadge(score: number, band: GFSBand): string {
  const url = generateShieldsUrl(score, band);
  return `<img alt="Ground Floor Check" src="${url}" />`;
}
