// Google Stitch Design System Mascot Image Assets for Plumber App
const isTestEnv =
  typeof process !== 'undefined' &&
  (Boolean(process.env?.VITEST) || process.env?.NODE_ENV === 'test');

let avatarSource: any = { uri: 'test-circular-avatar.png' };
let characterSource: any = { uri: 'test-detailed-character.png' };
let heroSource: any = { uri: 'test-hero-illustration.png' };
let mascotSource: any = { uri: 'test-plumber-mascot.png' };
let stitchHeroSource: any = { uri: 'test-stitch-hero.png' };

if (!isTestEnv) {
  try {
    avatarSource = require('./circular-avatar.png');
    characterSource = require('./detailed-character.png');
    heroSource = require('./hero-illustration.png');
    mascotSource = require('./plumber-mascot.png');
    stitchHeroSource = require('./stitch-hero.png');
  } catch {
    // Fallback for non-metro runtime
  }
}

export const MASCOT_ASSETS = {
  avatar: avatarSource,
  character: characterSource,
  hero: heroSource,
  mascot: mascotSource,
  stitchHero: stitchHeroSource,
};
