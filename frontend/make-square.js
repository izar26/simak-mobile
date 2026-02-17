const Jimp = require('jimp');
const path = require('path');

const ICON_PATH = path.join(__dirname, 'icon', 'icon.png');
const OUTPUT_PATH = path.join(__dirname, 'icon', 'icon_squared.png');

async function main() {
    try {
        const image = await Jimp.read(ICON_PATH);
        const w = image.bitmap.width;
        const h = image.bitmap.height;
        const size = Math.max(w, h); // Ukuran sisi terpanjang

        if (w === h) {
            console.log('Image is already square. Copying...');
            await image.writeAsync(OUTPUT_PATH);
            return;
        }

        console.log(`Resizing image from ${w}x${h} to ${size}x${size}...`);

        // Buat kanvas kosong transparan berukuran persegi
        const background = new Jimp(size, size, 0x00000000); // Transparent

        // Hitung posisi tengah agar image asli berada di tengah canvas
        const x = (size - w) / 2;
        const y = (size - h) / 2;

        // Tempel gambar asli di tengah
        background.composite(image, x, y);

        await background.writeAsync(OUTPUT_PATH);
        console.log('Squared image saved to:', OUTPUT_PATH);

    } catch (error) {
        console.error('Error processing image:', error);
        process.exit(1);
    }
}

main();
