import sharp from 'sharp';

const w=1920,h=1080;
const svg=`<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#2563eb"/><stop offset="100%" stop-color="#93c5fd"/></linearGradient></defs><rect width="${w}" height="${h}" fill="url(#g)"/><circle cx="960" cy="540" r="300" fill="#f8fafc" opacity="0.9"/></svg>`;
const orig = await sharp(Buffer.from(svg)).jpeg({quality:85}).toBuffer();
console.log(`orig q85 1920x1080: ${(orig.length/1024).toFixed(1)}KB`);
const maxW=720;
const resized = await sharp(orig).rotate().resize({width:maxW, fit:'inside', withoutEnlargement:true}).jpeg({quality:70, mozjpeg:true, chromaSubsampling:'4:2:0'}).toBuffer();
console.log(`new 720 q70 mozjpeg: ${(resized.length/1024).toFixed(1)}KB hemat ${((1-resized.length/orig.length)*100).toFixed(1)}%`);
const client = await sharp(orig).resize({width:1024, fit:'inside', withoutEnlargement:true}).jpeg({quality:75}).toBuffer();
console.log(`client 1024 q75: ${(client.length/1024).toFixed(1)}KB`);
const full = await sharp(client).rotate().resize({width:720, fit:'inside', withoutEnlargement:true}).jpeg({quality:70, mozjpeg:true}).toBuffer();
console.log(`full pipeline client1024->server720: ${(full.length/1024).toFixed(1)}KB vs orig ${(orig.length/1024).toFixed(1)}KB`);
console.log(`estimasi 25 kary x2 foto/hari x3 hari: before ${(orig.length*150/1024/1024).toFixed(1)}MB after ${(full.length*150/1024/1024).toFixed(1)}MB`);
