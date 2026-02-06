import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, PDFName, PDFRawStream } from 'pdf-lib';
import sharp from 'sharp';

async function optimizeImage(buffer: Buffer, options: {
    quality: number;
    grayscale: boolean;
    removeMetadata: boolean;
    forceFormat?: string;
    targetWeight?: number | null;
}) {
    let currentQuality = options.quality;
    let pipeline = sharp(buffer);

    if (options.grayscale) pipeline = pipeline.grayscale();
    if (!options.removeMetadata) pipeline = pipeline.withMetadata();

    const format = (options.forceFormat === 'webp' || options.forceFormat === 'jpg')
        ? (options.forceFormat === 'webp' ? 'webp' : 'jpeg')
        : 'jpeg';

    let outputBuffer = await (format === 'webp'
        ? pipeline.webp({ quality: currentQuality }).toBuffer()
        : pipeline.jpeg({ quality: currentQuality }).toBuffer()
    );

    if (options.targetWeight) {
        const targetBytes = options.targetWeight * 1024;
        let attempts = 0;
        while (outputBuffer.length > targetBytes && currentQuality > 10 && attempts < 5) {
            currentQuality -= 15;
            outputBuffer = await (format === 'webp'
                ? pipeline.webp({ quality: currentQuality }).toBuffer()
                : pipeline.jpeg({ quality: currentQuality }).toBuffer()
            );
            attempts++;
        }
    }

    return { buffer: outputBuffer, format };
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const quality = parseInt(formData.get('quality') as string) || 60;
        const grayscale = formData.get('grayscale') === 'true';
        const removeMetadata = formData.get('removeMetadata') === 'true';
        const forceFormat = formData.get('forceFormat') as string || 'original';
        const targetWeight = formData.get('targetWeight') ? parseInt(formData.get('targetWeight') as string) : null;

        if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // PATH 1: IMAGE
        if (file.type.startsWith('image/')) {
            const { buffer: opt, format } = await optimizeImage(buffer, {
                quality, grayscale, removeMetadata, forceFormat, targetWeight
            });
            return new Response(opt as any, {
                headers: {
                    'Content-Type': `image/${format}`,
                    'Content-Disposition': `attachment; filename="opt_${file.name.split('.')[0]}.${format}"`,
                },
            });
        }

        // PATH 2: SURGICAL PDF
        if (file.type === 'application/pdf') {
            const pdfDoc = await PDFDocument.load(arrayBuffer);

            if (removeMetadata) {
                pdfDoc.setTitle(''); pdfDoc.setAuthor(''); pdfDoc.setSubject('');
                pdfDoc.setKeywords([]); pdfDoc.setProducer(''); pdfDoc.setCreator('');
            }

            // Deep Image Extraction & Re-compression
            const pdfObjects = pdfDoc.context.enumerateIndirectObjects();
            for (const [ref, obj] of pdfObjects) {
                if (!(obj instanceof PDFRawStream)) continue;

                const dict = obj.dict;
                const subtype = dict.get(PDFName.of('Subtype'));
                if (subtype !== PDFName.of('Image')) continue;

                try {
                    const imageBytes = obj.contents;

                    let sharpPipeline = sharp(imageBytes);
                    if (grayscale) sharpPipeline = sharpPipeline.grayscale();

                    // Force JPEG compression for internal PDF images (Standard for PDF optimization)
                    const optimizedBytes = await sharpPipeline
                        .jpeg({ quality: Math.min(quality, 70), progressive: true, mozjpeg: true })
                        .toBuffer();

                    if (optimizedBytes.length < imageBytes.length) {
                        obj.contents = optimizedBytes;
                        dict.set(PDFName.of('Length'), pdfDoc.context.obj(optimizedBytes.length));
                        dict.set(PDFName.of('Filter'), PDFName.of('DCTDecode'));
                    }
                } catch (e) {
                    // Silently fail for unsupported image formats inside PDF to avoid document corruption
                }
            }

            const pdfBytes = await pdfDoc.save({
                useObjectStreams: true,
                addDefaultPage: false,
                updateFieldAppearances: false
            });

            return new Response(pdfBytes as any, {
                headers: {
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': `attachment; filename="opt_${file.name}"`,
                },
            });
        }

        return NextResponse.json({ error: 'Unsupported Format' }, { status: 400 });

    } catch (error: any) {
        console.error('[API] ERROR:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
