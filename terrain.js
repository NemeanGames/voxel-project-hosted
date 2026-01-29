// ==========================================
//  TERRAIN GENERATION KERNEL
// ==========================================
// Globals available: GEN (Noise), CONFIG (Sliders), PALETTE (Colors)

// 1. HEIGHT & FEATURES
function getColumn(x, z) {
    const sc = 1 / CONFIG.scale; 
    
    // Base Shape
    let base = GEN.fbm(x*sc, 0, z*sc, 3);
    
    // Mountains
    let q = GEN.fbm(x*sc + 5.2, 0, z*sc + 1.3, 2);
    let ridge = 1.0 - Math.abs(GEN.fbm(x*sc*3 + q, 10, z*sc*3 + q, 4));
    
    // Peak Softness
    let power = 4.0 - (CONFIG.peakSoft * 3.0);
    ridge = Math.pow(ridge, power);

    let h = (base * 0.5 + 0.5) * 60; // Rolling hills
    
    if (base > -0.1) {
        let mHeight = ridge * CONFIG.amp * Math.max(0, base + 0.2);
        
        // Terracing
        if (CONFIG.terraces > 0) {
            const steps = CONFIG.terraces;
            let v = mHeight / CONFIG.amp * steps;
            let i = Math.floor(v);
            let f = v - i;
            f = Math.min(1.0, Math.max(0.0, (f - 0.5) / 0.1 + 0.5)); // Step function
            let tRidge = (i + f) / steps;
            mHeight = (tRidge * 0.8 + (mHeight/CONFIG.amp)*0.2) * CONFIG.amp;
        }
        h += mHeight;
    }

    // Rivers
    let rWarp = GEN.fbm(x*0.001, 0, z*0.001, 2);
    let rVal = Math.abs(GEN.noise(x*0.002 + rWarp, 0, z*0.002 + rWarp));
    
    const R_WIDTH = 0.03 * CONFIG.riverWidth;
    let isWater = false;
    let riverDist = 1.0;

    if (rVal < R_WIDTH + 0.04) {
        riverDist = rVal / (R_WIDTH + 0.04);
        let dig = Math.cos(riverDist * Math.PI / 2);
        h -= dig * 30 * CONFIG.erosion;
        
        if (h < 38) h = 38; // Water level - 2
        if (rVal < R_WIDTH) isWater = true;
    }
    
    // Detail
    h += GEN.noise(x*0.1, 0, z*0.1) * 2 * CONFIG.detail;
    
    return { h: Math.floor(h), isWater, riverDist };
}

// 2. COLORING
function getColor(info, y, slope, x, z) {
    if (info.isWater) return PALETTE.WATER;
    if (y <= 40) return PALETTE.WATER;

    if (info.riverDist < 0.65) return PALETTE.SAND;
    if (info.riverDist < 0.85) return PALETTE.GRAVEL;

    if (slope > 1.2) {
        let warp = GEN.noise(x*0.02, y*0.04, z*0.02) * 15;
        let idx = Math.floor((y + warp) / 5) % PALETTE.STRATA.length;
        if (idx < 0) idx += PALETTE.STRATA.length;
        return PALETTE.STRATA[idx];
    }

    if (y > 200) return PALETTE.SNOW;
    if (y > 150) return PALETTE.GRAVEL;
    if (y < 45) return PALETTE.SAND;

    return PALETTE.GRASS;
}