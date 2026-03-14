const SIZE = 1024;
const TEXTURE_SIZE = 640;

type StyleTheme = {
	background: [string, string];
	accent: string;
	softAccent: string;
	wash: string;
};

type RgbColor = {
	r: number;
	g: number;
	b: number;
};

type Palette = {
	dark: RgbColor;
	shadow: RgbColor;
	base: RgbColor;
	light: RgbColor;
	highlight: RgbColor;
	line: RgbColor;
	nose: RgbColor;
	collar: RgbColor;
	accent: RgbColor;
	softAccent: RgbColor;
};

const styleThemes: Record<string, StyleTheme> = {
	heroic: {
		background: ['#fff3ea', '#ffd6bd'],
		accent: '#f48b54',
		softAccent: '#ffe2d2',
		wash: '#fff7f2'
	},
	clinical: {
		background: ['#fff9f5', '#ffd9c9'],
		accent: '#e47a43',
		softAccent: '#ffe8dc',
		wash: '#fffaf7'
	},
	playful: {
		background: ['#fff0e7', '#ffc9a8'],
		accent: '#ff9b67',
		softAccent: '#ffe0cf',
		wash: '#fff5ef'
	}
};

const clampChannel = (value: number) => Math.min(255, Math.max(0, Math.round(value)));

const makeColor = (r: number, g: number, b: number): RgbColor => ({
	r: clampChannel(r),
	g: clampChannel(g),
	b: clampChannel(b)
});

const hexToRgb = (hex: string): RgbColor => {
	const normalized = hex.replace('#', '');
	const safeHex =
		normalized.length === 3
			? normalized
					.split('')
					.map((entry) => entry + entry)
					.join('')
			: normalized;

	return makeColor(
		parseInt(safeHex.slice(0, 2), 16),
		parseInt(safeHex.slice(2, 4), 16),
		parseInt(safeHex.slice(4, 6), 16)
	);
};

const luminance = (color: RgbColor) => color.r * 0.2126 + color.g * 0.7152 + color.b * 0.0722;

const mixColor = (from: RgbColor, to: RgbColor, ratio: number) =>
	makeColor(
		from.r + (to.r - from.r) * ratio,
		from.g + (to.g - from.g) * ratio,
		from.b + (to.b - from.b) * ratio
	);

const shiftLightness = (color: RgbColor, amount: number) =>
	amount >= 0 ? mixColor(color, makeColor(255, 255, 255), amount) : mixColor(color, makeColor(0, 0, 0), -amount);

const adjustSaturation = (color: RgbColor, factor: number) => {
	const gray = luminance(color);

	return makeColor(
		gray + (color.r - gray) * factor,
		gray + (color.g - gray) * factor,
		gray + (color.b - gray) * factor
	);
};

const formatColor = (color: RgbColor, alpha = 1) =>
	alpha < 1 ? `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})` : `rgb(${color.r}, ${color.g}, ${color.b})`;

const escapeXml = (value: string) =>
	value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&apos;');

const loadImage = (file: File) =>
	new Promise<HTMLImageElement>((resolve, reject) => {
		const url = URL.createObjectURL(file);
		const image = new Image();

		image.onload = () => {
			URL.revokeObjectURL(url);
			resolve(image);
		};

		image.onerror = () => {
			URL.revokeObjectURL(url);
			reject(new Error("Impossible de lire l'image importee."));
		};

		image.src = url;
	});

const coverCrop = (sourceWidth: number, sourceHeight: number) => {
	const sourceRatio = sourceWidth / sourceHeight;

	if (sourceRatio > 1) {
		const cropWidth = sourceHeight;

		return {
			sx: (sourceWidth - cropWidth) / 2,
			sy: 0,
			sWidth: cropWidth,
			sHeight: sourceHeight
		};
	}

	const cropHeight = sourceWidth;

	return {
		sx: 0,
		sy: (sourceHeight - cropHeight) / 2,
		sWidth: sourceWidth,
		sHeight: cropHeight
	};
};

const averageColor = (colors: RgbColor[], fallback: RgbColor) => {
	if (colors.length === 0) return fallback;

	const total = colors.reduce(
		(sum, color) => ({
			r: sum.r + color.r,
			g: sum.g + color.g,
			b: sum.b + color.b
		}),
		{ r: 0, g: 0, b: 0 }
	);

	return makeColor(total.r / colors.length, total.g / colors.length, total.b / colors.length);
};

const createTextureCanvas = (image: HTMLImageElement) => {
	const canvas = document.createElement('canvas');
	canvas.width = TEXTURE_SIZE;
	canvas.height = TEXTURE_SIZE;
	const ctx = canvas.getContext('2d');

	if (!ctx) {
		throw new Error('Canvas non disponible dans ce navigateur.');
	}

	const crop = coverCrop(image.width, image.height);
	ctx.imageSmoothingEnabled = true;
	ctx.filter = 'contrast(1.05) saturate(1.03) brightness(1.01)';
	ctx.drawImage(image, crop.sx, crop.sy, crop.sWidth, crop.sHeight, 0, 0, TEXTURE_SIZE, TEXTURE_SIZE);
	ctx.filter = 'none';

	return canvas;
};

const derivePalette = (imageData: ImageData, theme: StyleTheme) => {
	const { data, width, height } = imageData;
	const samples: Array<RgbColor & { lum: number }> = [];
	const startX = Math.floor(width * 0.16);
	const endX = Math.floor(width * 0.84);
	const startY = Math.floor(height * 0.12);
	const endY = Math.floor(height * 0.9);

	for (let y = startY; y < endY; y += 6) {
		for (let x = startX; x < endX; x += 6) {
			const index = (y * width + x) * 4;
			const alpha = data[index + 3];
			if (alpha < 32) continue;

			const color = makeColor(data[index], data[index + 1], data[index + 2]);
			samples.push({ ...color, lum: luminance(color) });
		}
	}

	if (samples.length === 0) {
		samples.push(
			{ ...makeColor(72, 54, 44), lum: 58 },
			{ ...makeColor(125, 96, 78), lum: 102 },
			{ ...makeColor(173, 139, 111), lum: 146 },
			{ ...makeColor(214, 190, 168), lum: 198 },
			{ ...makeColor(236, 223, 211), lum: 228 }
		);
	}

	const sortedLuminance = samples
		.map((sample) => sample.lum)
		.sort((left, right) => left - right);
	const sampleAt = (ratio: number) =>
		sortedLuminance[Math.min(sortedLuminance.length - 1, Math.floor(sortedLuminance.length * ratio))];
	const thresholds = [sampleAt(0.18), sampleAt(0.38), sampleAt(0.62), sampleAt(0.84)];
	const buckets: RgbColor[][] = [[], [], [], [], []];

	for (const sample of samples) {
		const bucketIndex =
			sample.lum <= thresholds[0]
				? 0
				: sample.lum <= thresholds[1]
					? 1
					: sample.lum <= thresholds[2]
						? 2
						: sample.lum <= thresholds[3]
							? 3
							: 4;

		buckets[bucketIndex].push(sample);
	}

	const fallbackBase = hexToRgb(theme.accent);
	const bucket0 = averageColor(buckets[0], shiftLightness(fallbackBase, -0.52));
	const bucket1 = averageColor(buckets[1], shiftLightness(fallbackBase, -0.28));
	const bucket2 = averageColor(buckets[2], shiftLightness(fallbackBase, -0.04));
	const bucket3 = averageColor(buckets[3], shiftLightness(fallbackBase, 0.26));
	const bucket4 = averageColor(buckets[4], shiftLightness(fallbackBase, 0.5));
	const accent = mixColor(hexToRgb(theme.accent), bucket2, 0.26);
	const softAccent = mixColor(hexToRgb(theme.softAccent), bucket4, 0.15);

	const palette: Palette = {
		dark: adjustSaturation(shiftLightness(bucket0, -0.24), 0.9),
		shadow: adjustSaturation(shiftLightness(bucket1, -0.14), 0.92),
		base: adjustSaturation(bucket2, 0.94),
		light: adjustSaturation(shiftLightness(bucket3, 0.12), 0.86),
		highlight: adjustSaturation(shiftLightness(bucket4, 0.22), 0.75),
		line: adjustSaturation(shiftLightness(bucket0, -0.38), 0.78),
		nose: shiftLightness(bucket0, -0.46),
		collar: mixColor(accent, bucket3, 0.22),
		accent,
		softAccent
	};

	return {
		palette,
		thresholds
	};
};

const posterizeTexture = (
	textureCanvas: HTMLCanvasElement,
	palette: Palette,
	thresholds: number[]
) => {
	const ctx = textureCanvas.getContext('2d');

	if (!ctx) {
		throw new Error('Canvas non disponible dans ce navigateur.');
	}

	const imageData = ctx.getImageData(0, 0, textureCanvas.width, textureCanvas.height);
	const sourceData = new Uint8ClampedArray(imageData.data);
	const colorLevels = [
		palette.dark,
		palette.shadow,
		palette.base,
		palette.light,
		palette.highlight
	];

	for (let y = 0; y < imageData.height; y += 1) {
		for (let x = 0; x < imageData.width; x += 1) {
			const index = (y * imageData.width + x) * 4;
			const alpha = sourceData[index + 3];
			if (alpha < 32) continue;

			const original = makeColor(sourceData[index], sourceData[index + 1], sourceData[index + 2]);
			const lum = luminance(original);
			const targetIndex =
				lum <= thresholds[0]
					? 0
					: lum <= thresholds[1]
						? 1
						: lum <= thresholds[2]
							? 2
							: lum <= thresholds[3]
								? 3
								: 4;

			let target = mixColor(colorLevels[targetIndex], original, 0.28);
			const rightIndex = x < imageData.width - 1 ? index + 4 : index;
			const downIndex = y < imageData.height - 1 ? index + imageData.width * 4 : index;
			const edgeStrength =
				Math.abs(
					lum -
						luminance(
							makeColor(sourceData[rightIndex], sourceData[rightIndex + 1], sourceData[rightIndex + 2])
						)
				) +
				Math.abs(
					lum -
						luminance(
							makeColor(sourceData[downIndex], sourceData[downIndex + 1], sourceData[downIndex + 2])
						)
				);

			if (edgeStrength > 22) {
				target = mixColor(target, palette.line, Math.min(0.26, edgeStrength / 220));
			}

			imageData.data[index] = target.r;
			imageData.data[index + 1] = target.g;
			imageData.data[index + 2] = target.b;
			imageData.data[index + 3] = alpha;
		}
	}

	ctx.putImageData(imageData, 0, 0);

	const lightWash = ctx.createLinearGradient(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);
	lightWash.addColorStop(0, formatColor(palette.highlight, 0.18));
	lightWash.addColorStop(0.48, 'rgba(255,255,255,0)');
	lightWash.addColorStop(1, formatColor(palette.shadow, 0.08));
	ctx.fillStyle = lightWash;
	ctx.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);

	return textureCanvas.toDataURL('image/jpeg', 0.84);
};

const buildBadgeMarkup = (count: number, palette: Palette) =>
	Array.from({ length: Math.min(count, 3) }, (_, index) => {
		const x = 348 + index * 96;
		const duration = `${3.4 + index * 0.35}s`;

		return `
			<g transform="translate(${x} 874)">
				<circle r="28" fill="${formatColor(palette.softAccent, 0.92)}">
					<animate attributeName="r" values="27;29;27" dur="${duration}" repeatCount="indefinite" />
				</circle>
				<circle r="14" fill="${formatColor(palette.accent, 0.96)}" />
				<path d="M0 -9 L3 -1 L11 -1 L5 4 L7 12 L0 7 L-7 12 L-5 4 L-11 -1 L-3 -1 Z" fill="white" opacity="0.88" />
			</g>
		`;
	}).join('');

const buildAnimatedAvatarSvg = ({
	textureDataUrl,
	palette,
	theme,
	dogName,
	equippedCount
}: {
	textureDataUrl: string;
	palette: Palette;
	theme: StyleTheme;
	dogName: string;
	equippedCount: number;
}) => {
	const safeDogName = escapeXml(dogName.trim() || 'Compagnon canin');

	return `
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}" fill="none">
			<defs>
				<linearGradient id="bg" x1="116" y1="52" x2="886" y2="972" gradientUnits="userSpaceOnUse">
					<stop offset="0" stop-color="${theme.background[0]}" />
					<stop offset="1" stop-color="${theme.background[1]}" />
				</linearGradient>
				<radialGradient id="glowLeft" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(212 196) rotate(90) scale(154)">
					<stop stop-color="${formatColor(palette.highlight, 0.52)}" />
					<stop offset="1" stop-color="${formatColor(palette.highlight, 0)}" />
				</radialGradient>
				<radialGradient id="glowRight" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(810 214) rotate(90) scale(148)">
					<stop stop-color="${formatColor(palette.softAccent, 0.72)}" />
					<stop offset="1" stop-color="${formatColor(palette.softAccent, 0)}" />
				</radialGradient>
				<linearGradient id="wash" x1="220" y1="136" x2="792" y2="844" gradientUnits="userSpaceOnUse">
					<stop offset="0" stop-color="${theme.wash}" stop-opacity="0.35" />
					<stop offset="0.44" stop-color="${theme.wash}" stop-opacity="0.08" />
					<stop offset="1" stop-color="${formatColor(palette.shadow, 0.18)}" />
				</linearGradient>
				<filter id="dropShadow" x="164" y="178" width="696" height="754" color-interpolation-filters="sRGB">
					<feDropShadow dx="0" dy="18" stdDeviation="24" flood-color="${formatColor(palette.line, 0.2)}" />
				</filter>
				<clipPath id="furClip">
					<path d="M356 236 C244 254 190 382 242 558 C286 512 320 424 402 278 C392 246 376 232 356 236 Z" />
					<path d="M668 236 C780 254 834 382 782 558 C738 512 704 424 622 278 C632 246 648 232 668 236 Z" />
					<ellipse cx="512" cy="452" rx="222" ry="250" />
					<path d="M334 772 C390 698 451 668 512 668 C573 668 634 698 690 772 C642 834 582 868 512 868 C442 868 382 834 334 772 Z" />
				</clipPath>
			</defs>

			<rect width="${SIZE}" height="${SIZE}" fill="url(#bg)" />
			<circle cx="208" cy="188" r="146" fill="url(#glowLeft)">
				<animate attributeName="cy" values="188;176;188" dur="6s" repeatCount="indefinite" />
			</circle>
			<circle cx="816" cy="214" r="142" fill="url(#glowRight)">
				<animate attributeName="cy" values="214;226;214" dur="5.6s" repeatCount="indefinite" />
			</circle>
			<ellipse cx="512" cy="942" rx="268" ry="62" fill="${formatColor(palette.line, 0.08)}" />

			<g filter="url(#dropShadow)">
				<g>
					<animateTransform attributeName="transform" type="translate" values="0 0; 0 -10; 0 0" dur="4.8s" repeatCount="indefinite" />

					<ellipse cx="512" cy="882" rx="236" ry="52" fill="${formatColor(palette.line, 0.12)}" />

					<g>
						<animateTransform attributeName="transform" type="rotate" values="0 332 236; -4 332 236; 0 332 236" dur="6.4s" repeatCount="indefinite" />
						<path d="M356 236 C244 254 190 382 242 558 C286 512 320 424 402 278 C392 246 376 232 356 236 Z" fill="${formatColor(palette.shadow)}" />
						<path d="M356 286 C288 304 254 412 278 496 C308 444 334 382 386 300 C378 286 370 280 356 286 Z" fill="${formatColor(palette.light, 0.76)}" />
					</g>

					<g>
						<animateTransform attributeName="transform" type="rotate" values="0 692 236; 4 692 236; 0 692 236" dur="6.1s" repeatCount="indefinite" />
						<path d="M668 236 C780 254 834 382 782 558 C738 512 704 424 622 278 C632 246 648 232 668 236 Z" fill="${formatColor(palette.shadow)}" />
						<path d="M668 286 C736 304 770 412 746 496 C716 444 690 382 638 300 C646 286 654 280 668 286 Z" fill="${formatColor(palette.light, 0.76)}" />
					</g>

					<ellipse cx="512" cy="452" rx="226" ry="254" fill="${formatColor(palette.base)}" />
					<path d="M334 772 C390 698 451 668 512 668 C573 668 634 698 690 772 C642 834 582 868 512 868 C442 868 382 834 334 772 Z" fill="${formatColor(palette.base)}" />

					<g clip-path="url(#furClip)">
						<rect x="206" y="138" width="612" height="752" fill="${formatColor(palette.base)}" />
						<image href="${textureDataUrl}" x="206" y="138" width="612" height="752" preserveAspectRatio="xMidYMid slice" opacity="0.7" />
						<rect x="206" y="138" width="612" height="752" fill="url(#wash)" />
					</g>

					<ellipse cx="512" cy="388" rx="136" ry="88" fill="${formatColor(palette.highlight, 0.22)}" />
					<path d="M332 772 C388 704 451 676 512 676 C573 676 636 704 692 772 C650 818 592 846 512 846 C432 846 374 818 332 772 Z" fill="${formatColor(palette.light, 0.54)}" />
					<path d="M376 728 C428 706 470 698 512 698 C554 698 596 706 648 728 L622 772 C584 784 548 790 512 790 C476 790 440 784 402 772 Z" fill="${formatColor(palette.collar)}" />

					<g transform="translate(512 770)">
						<animateTransform attributeName="transform" additive="sum" type="translate" values="0 0; 0 -2; 0 0" dur="3.2s" repeatCount="indefinite" />
						<circle r="28" fill="${formatColor(palette.accent)}" />
						<path d="M-4 -12H4V-4H12V4H4V12H-4V4H-12V-4H-4Z" fill="white" fill-opacity="0.9" />
					</g>

					<ellipse cx="512" cy="586" rx="134" ry="108" fill="${formatColor(palette.light)}" />
					<ellipse cx="512" cy="612" rx="94" ry="70" fill="${formatColor(palette.highlight, 0.92)}" />
					<path d="M438 582 C464 560 488 552 512 552 C536 552 560 560 586 582" stroke="${formatColor(palette.shadow, 0.24)}" stroke-width="10" stroke-linecap="round" />
					<path d="M460 540 C478 520 494 512 512 512 C530 512 546 520 564 540" stroke="${formatColor(palette.highlight, 0.68)}" stroke-width="14" stroke-linecap="round" />

					<g transform="translate(432 474)">
						<ellipse cx="0" cy="0" rx="18" ry="11" fill="${formatColor(palette.line)}">
							<animate attributeName="ry" values="11;11;1.4;11;11" keyTimes="0;0.46;0.5;0.54;1" dur="4.9s" repeatCount="indefinite" />
						</ellipse>
						<circle cx="5" cy="-2" r="2.4" fill="${formatColor(palette.highlight)}">
							<animate attributeName="opacity" values="1;1;0.2;1;1" dur="4.9s" repeatCount="indefinite" />
						</circle>
					</g>

					<g transform="translate(592 474)">
						<ellipse cx="0" cy="0" rx="18" ry="11" fill="${formatColor(palette.line)}">
							<animate attributeName="ry" values="11;11;1.4;11;11" keyTimes="0;0.46;0.5;0.54;1" dur="4.9s" repeatCount="indefinite" />
						</ellipse>
						<circle cx="5" cy="-2" r="2.4" fill="${formatColor(palette.highlight)}">
							<animate attributeName="opacity" values="1;1;0.2;1;1" dur="4.9s" repeatCount="indefinite" />
						</circle>
					</g>

					<path d="M454 588 C454 560 480 544 512 544 C544 544 570 560 570 588 C570 620 544 638 512 640 C480 638 454 620 454 588 Z" fill="${formatColor(palette.nose)}" />
					<path d="M486 586 C494 578 502 576 512 576 C522 576 530 578 538 586" stroke="${formatColor(palette.highlight, 0.2)}" stroke-width="8" stroke-linecap="round" />
					<path d="M512 640 V680" stroke="${formatColor(palette.line)}" stroke-width="8" stroke-linecap="round" />
					<path d="M512 680 C496 702 474 710 454 710" stroke="${formatColor(palette.line)}" stroke-width="8" stroke-linecap="round" />
					<path d="M512 680 C528 702 550 710 570 710" stroke="${formatColor(palette.line)}" stroke-width="8" stroke-linecap="round" />

					<path d="M386 438 C408 420 426 412 448 410" stroke="${formatColor(palette.line, 0.22)}" stroke-width="10" stroke-linecap="round" />
					<path d="M638 438 C616 420 598 412 576 410" stroke="${formatColor(palette.line, 0.22)}" stroke-width="10" stroke-linecap="round" />

					${buildBadgeMarkup(equippedCount, palette)}
				</g>
			</g>

			<text x="512" y="956" text-anchor="middle" font-size="40" font-weight="800" fill="${formatColor(palette.line, 0.56)}" font-family="Avenir Next, Segoe UI, sans-serif">
				${safeDogName}
			</text>
		</svg>
	`;
};

export async function stylizeAvatarFromPhoto({
	file,
	styleId,
	dogName,
	equippedCount
}: {
	file: File;
	styleId: string;
	dogName: string;
	equippedCount: number;
}) {
	const image = await loadImage(file);
	const theme = styleThemes[styleId] ?? styleThemes.heroic;
	const textureCanvas = createTextureCanvas(image);
	const textureCtx = textureCanvas.getContext('2d');

	if (!textureCtx) {
		throw new Error('Canvas non disponible dans ce navigateur.');
	}

	const baseImageData = textureCtx.getImageData(0, 0, textureCanvas.width, textureCanvas.height);
	const { palette, thresholds } = derivePalette(baseImageData, theme);
	const textureDataUrl = posterizeTexture(textureCanvas, palette, thresholds);
	const svg = buildAnimatedAvatarSvg({
		textureDataUrl,
		palette,
		theme,
		dogName,
		equippedCount
	});

	return {
		imageDataUrl: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
		prompt: `Avatar canin anime, proportions realistes, palette simplifiee, style ${styleId}`
	};
}
