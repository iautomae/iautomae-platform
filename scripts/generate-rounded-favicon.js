const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function generateRoundedFavicon() {
    const inputPath = path.join(__dirname, '..', 'public', 'brand', 'logo.jpg');
    const outputPath = path.join(__dirname, '..', 'src', 'app', 'icon.png');

    console.log(`Processing: ${inputPath}`);

    try {
        // 1. Get image dimensions
        const metadata = await sharp(inputPath).metadata();
        const size = Math.min(metadata.width, metadata.height);

        // 2. Create a rounded corner mask
        // Using an SVG mask is cleaner for perfect rounded corners
        const radius = size * 0.2; // 20% border radius
        const mask = Buffer.from(
            `<svg><rect x="0" y="0" width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="white" /></svg>`
        );

        // 3. Apply the mask and export as transparent PNG
        await sharp(inputPath)
            .resize(size, size) // Ensure it's square
            .composite([{
                input: mask,
                blend: 'dest-in'
            }])
            .png()
            .toFile(outputPath);

        console.log(`Successfully generated rounded favicon at: ${outputPath}`);
    } catch (error) {
        console.error('Error generating favicon:', error);
        process.exit(1);
    }
}

generateRoundedFavicon();
