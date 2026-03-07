export function createBlob(width, height, color) {
    const baseX = Math.random() * width;
    const baseY = Math.random() * height;
    const baseRadius = 150 + Math.random() * 200; // 150-350px
    return {
        x: baseX,
        y: baseY,
        baseX,
        baseY,
        radius: baseRadius,
        baseRadius,
        color,
        speed: 0.5 + Math.random() * 0.5, // 0.5-1.0
        phaseX: Math.random() * Math.PI * 2, // Random starting phase
        phaseY: Math.random() * Math.PI * 2,
        orbitRadius: 50 + Math.random() * 100 // 50-150px orbit
    };
}
export function updateBlob(blob, time, width, height) {
    // Smooth flowing motion using sine waves
    // Each blob moves in a Lissajous-like pattern around its base position
    const t = time * 0.0005 * blob.speed; // Time in seconds, slowed down
    // Update phases for smooth continuous motion
    const currentPhaseX = blob.phaseX + t;
    const currentPhaseY = blob.phaseY + t * 0.7; // Different frequency for organic motion
    // Calculate position using sine waves (creates flowing, orbital motion)
    blob.x = blob.baseX + Math.sin(currentPhaseX) * blob.orbitRadius;
    blob.y = blob.baseY + Math.cos(currentPhaseY) * blob.orbitRadius;
    // Gentle pulsing effect for the radius
    blob.radius = blob.baseRadius + Math.sin(t * 2) * 15;
    // Slowly drift the base position for long-term variation
    blob.baseX += Math.sin(t * 0.1) * 0.1;
    blob.baseY += Math.cos(t * 0.15) * 0.1;
    // Wrap base position if it goes off screen
    if (blob.baseX < -blob.radius)
        blob.baseX = width + blob.radius;
    if (blob.baseX > width + blob.radius)
        blob.baseX = -blob.radius;
    if (blob.baseY < -blob.radius)
        blob.baseY = height + blob.radius;
    if (blob.baseY > height + blob.radius)
        blob.baseY = -blob.radius;
    return blob;
}
export function drawBlob(ctx, blob, opacity) {
    const gradient = ctx.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, blob.radius);
    gradient.addColorStop(0, `${blob.color}${Math.floor(opacity * 255)
        .toString(16)
        .padStart(2, '0')}`);
    gradient.addColorStop(1, `${blob.color}00`);
    ctx.fillStyle = gradient;
    ctx.fillRect(blob.x - blob.radius, blob.y - blob.radius, blob.radius * 2, blob.radius * 2);
}
