// Prototype board → site route. Pages link with these so a rename happens in one place.
export const R = {
  home: '/',
  homeHi: '/hi/',
  pothi: '/manuscripts/',
  record4642: '/manuscripts/4642/',
  nakshatra: '/nakshatra/',
  learn: '/learn/',
  katha: '/our-story/',
  visit: '/visit/',
  journal: '/journal/',
  skyGuide: '/journal/sky-guide/',
  dana: '/support/',
} as const;

export type NavKey = 'home' | 'nakshatra' | 'learn' | 'pothi' | 'katha' | 'visit' | 'journal' | 'dana' | 'none';
export type Lang = 'en' | 'hi';

// [key, href, English label, Devanagari label]
export const NAV: [NavKey, string, string, string][] = [
  ['nakshatra', R.nakshatra, 'The 27', 'नक्षत्र'],
  ['learn', R.learn, 'Learn', 'पाठशाला'],
  ['pothi', R.pothi, 'Manuscripts', 'ग्रन्थागार'],
  ['katha', R.katha, 'Our story', 'वंश-कथा'],
  ['visit', R.visit, 'Visit', 'दर्शन'],
  ['journal', R.journal, 'Journal', 'पत्रिका'],
];
// on the Hindi page the main label is Hindi and the small one English
export const NAV_HI: Record<string, string> = { nakshatra: 'नक्षत्र', learn: 'पाठशाला', pothi: 'ग्रन्थागार', katha: 'हमारी कथा', visit: 'दर्शन', journal: 'पत्रिका' };
