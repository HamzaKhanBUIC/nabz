/**
 * Deterministic PRNG (mulberry32) and Box-Muller normal sampler.
 * Never uses Math.random() or the system clock.
 */

export type Rng = {
  /** Uniform float in [0, 1). */
  next(): number;
  /** Uniform integer in [min, max] inclusive. */
  int(min: number, max: number): number;
  /** Normal distribution sample using Box-Muller transform. */
  normal(mean?: number, sd?: number): number;
};

/** FNV-1a 32-bit hash combining a numeric master seed with a stream label. */
export function deriveSeed(masterSeed: number, label: string): number {
  let hash = (0x811c9dc5 ^ (masterSeed >>> 0)) >>> 0;
  for (let i = 0; i < label.length; i++) {
    hash ^= label.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash === 0 ? 1 : hash;
}

/** 32-bit mulberry32 PRNG returning values in [0, 1). */
export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createRng(seed: number): Rng {
  const rand = mulberry32(seed);
  return {
    next: rand,
    int(min: number, max: number): number {
      return min + Math.floor(rand() * (max - min + 1));
    },
    normal(mean = 0, sd = 1): number {
      const u1 = Math.max(1e-12, rand());
      const u2 = rand();
      const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
      return mean + sd * z;
    },
  };
}
