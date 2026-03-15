import { avatarStyles } from '$lib/app-data';

const PUBLIC_GEMINI_API_KEY = import.meta.env.PUBLIC_GEMINI_API_KEY ?? '';
const ANALYSIS_MODEL = 'gemini-2.5-flash';
const IMAGE_MODELS = ['gemini-3.1-flash-image-preview', 'gemini-2.5-flash-image'] as const;
const MAX_UPLOAD_DIMENSION = 1280;
const OUTPUT_QUALITY = 0.88;

const acceptedDogPhotoMimeTypes = [
	'image/png',
	'image/jpeg',
	'image/jpg',
	'image/webp',
	'image/heic',
	'image/heif'
] as const;

const acceptedDogPhotoExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.heic', '.heif'] as const;

type LoadedImage = {
	source: CanvasImageSource;
	width: number;
	height: number;
	release?: () => void;
};

type DogAnalysis = {
	isDog: boolean;
	breedGuess: string;
	confidenceLabel: string;
	keyTraits: string[];
	coatColors: string[];
	build: string;
	earShape: string;
	muzzle: string;
	summaryPrompt: string;
};

type GenerateGeminiAvatarInput = {
	file: File;
	sourceUrl?: string;
	styleId: string;
	dogName: string;
	equippedCount: number;
};

export type GeminiAvatarResult = {
	imageDataUrl: string;
	prompt: string;
	breedGuess: string | null;
	provider: 'gemini';
};

export const dogPhotoAcceptValue = [
	...acceptedDogPhotoMimeTypes,
	...acceptedDogPhotoExtensions
].join(',');

export const geminiAvatarEnabled = Boolean(PUBLIC_GEMINI_API_KEY.trim());

const isHeicLikeFile = (file: File) => {
	const lowerName = file.name.toLowerCase();

	return (
		file.type === 'image/heic' ||
		file.type === 'image/heif' ||
		lowerName.endsWith('.heic') ||
		lowerName.endsWith('.heif')
	);
};

export const isAcceptedDogPhotoFile = (file: File) => {
	if (acceptedDogPhotoMimeTypes.includes(file.type as (typeof acceptedDogPhotoMimeTypes)[number])) {
		return true;
	}

	const lowerName = file.name.toLowerCase();
	return acceptedDogPhotoExtensions.some((extension) => lowerName.endsWith(extension));
};

const renameToJpeg = (filename: string) => filename.replace(/\.(heic|heif)$/i, '') || 'chien-photo';

export const prepareDogPhotoFile = async (file: File) => {
	if (!isHeicLikeFile(file)) {
		return file;
	}

	const { default: heic2any } = await import('heic2any');
	const converted = await heic2any({
		blob: file,
		toType: 'image/jpeg',
		quality: OUTPUT_QUALITY
	});
	const blob = Array.isArray(converted) ? converted[0] : converted;

	return new File([blob], `${renameToJpeg(file.name)}.jpg`, {
		type: 'image/jpeg'
	});
};

const readFileAsDataUrl = (file: File) =>
	new Promise<string>((resolve, reject) => {
		const reader = new FileReader();

		reader.onload = () => {
			const result = reader.result;

			if (typeof result !== 'string') {
				reject(new Error("Le fichier image n'a pas pu être lu."));
				return;
			}

			resolve(result);
		};

		reader.onerror = () => reject(new Error("Le fichier image n'a pas pu être lu."));
		reader.readAsDataURL(file);
	});

const loadHtmlImageFromUrl = (url: string, release?: () => void) =>
	new Promise<LoadedImage>((resolve, reject) => {
		const image = new Image();

		image.onload = async () => {
			try {
				if ('decode' in image) {
					await image.decode();
				}
			} catch {
				// Android WebView may reject decode() despite a usable loaded image.
			}

			resolve({
				source: image,
				width: image.naturalWidth || image.width,
				height: image.naturalHeight || image.height,
				release
			});
		};

		image.onerror = () => {
			release?.();
			reject(new Error("Impossible de lire l'image importée."));
		};
		image.src = url;
	});

const loadHtmlImageFromDataUrl = async (file: File): Promise<LoadedImage> => {
	const dataUrl = await readFileAsDataUrl(file);
	return loadHtmlImageFromUrl(dataUrl);
};

const loadImage = async (file: File, sourceUrl?: string): Promise<LoadedImage> => {
	if ('createImageBitmap' in window) {
		try {
			const bitmap = await createImageBitmap(file);

			return {
				source: bitmap,
				width: bitmap.width,
				height: bitmap.height,
				release: () => bitmap.close()
			};
		} catch {
			// Keep the browser-image fallback chain for flaky mobile decoders.
		}
	}

	const loaders: Array<() => Promise<LoadedImage>> = [];

	if (sourceUrl) {
		loaders.push(() => loadHtmlImageFromUrl(sourceUrl));
	}

	loaders.push(() => {
		const objectUrl = URL.createObjectURL(file);
		return loadHtmlImageFromUrl(objectUrl, () => URL.revokeObjectURL(objectUrl));
	});
	loaders.push(() => loadHtmlImageFromDataUrl(file));

	for (const loader of loaders) {
		try {
			return await loader();
		} catch {
			// Continue through the fallback chain.
		}
	}

	throw new Error("Impossible de lire l'image importée.");
};

const createCanvas = (width: number, height: number) => {
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	return canvas;
};

const normalizeDimension = (width: number, height: number) => {
	const longestSide = Math.max(width, height);
	const scale = longestSide > MAX_UPLOAD_DIMENSION ? MAX_UPLOAD_DIMENSION / longestSide : 1;

	return {
		width: Math.max(1, Math.round(width * scale)),
		height: Math.max(1, Math.round(height * scale))
	};
};

const prepareGeminiInlineImage = async (file: File, sourceUrl?: string) => {
	const image = await loadImage(file, sourceUrl);

	try {
		const { width, height } = normalizeDimension(image.width, image.height);
		const canvas = createCanvas(width, height);
		const context = canvas.getContext('2d');

		if (!context) {
			throw new Error('Canvas non disponible dans ce navigateur.');
		}

		context.imageSmoothingEnabled = true;
		context.imageSmoothingQuality = 'high';
		context.drawImage(image.source, 0, 0, width, height);

		const dataUrl = canvas.toDataURL('image/jpeg', OUTPUT_QUALITY);

		return {
			base64: dataUrl.split(',')[1] ?? '',
			mimeType: 'image/jpeg'
		};
	} finally {
		image.release?.();
	}
};

const parseAnalysis = (rawText: string | undefined): DogAnalysis => {
	if (!rawText) {
		throw new Error("Gemini n'a pas retourné d'analyse canine.");
	}

	const parsed = JSON.parse(rawText) as Partial<DogAnalysis>;

	return {
		isDog: Boolean(parsed.isDog),
		breedGuess: parsed.breedGuess?.trim() || 'Type mixte',
		confidenceLabel: parsed.confidenceLabel?.trim() || 'moyenne',
		keyTraits: Array.isArray(parsed.keyTraits)
			? parsed.keyTraits.filter((value): value is string => typeof value === 'string').slice(0, 4)
			: [],
		coatColors: Array.isArray(parsed.coatColors)
			? parsed.coatColors.filter((value): value is string => typeof value === 'string').slice(0, 4)
			: [],
		build: parsed.build?.trim() || 'gabarit moyen',
		earShape: parsed.earShape?.trim() || 'oreilles peu definies',
		muzzle: parsed.muzzle?.trim() || 'museau moyen',
		summaryPrompt:
			parsed.summaryPrompt?.trim() ||
			'chien stylise 3D, proportions canines realistes, palette simplifiee'
	};
};

const summarizeAnalysis = (analysis: DogAnalysis) => {
	const traitSummary =
		analysis.keyTraits.length > 0 ? analysis.keyTraits.join(', ') : analysis.build;
	const colorSummary =
		analysis.coatColors.length > 0 ? analysis.coatColors.join(', ') : 'palette simplifiee';

	return `Race estimée : ${analysis.breedGuess}. Confiance ${analysis.confidenceLabel}. Traits : ${traitSummary}. Robe : ${colorSummary}.`;
};

const buildGenerationPrompt = (
	analysis: DogAnalysis,
	styleId: string,
	dogName: string,
	equippedCount: number
) => {
	const style = avatarStyles.find((entry) => entry.id === styleId) ?? avatarStyles[0];
	const accessoryPrompt =
		equippedCount > 0
			? 'Add one subtle veterinary accessory only if it fits naturally.'
			: 'No accessories.';

	return [
		'Transform the provided dog photo into a polished 3D animated-style canine avatar portrait.',
		'Keep realistic dog anatomy and realistic proportions.',
		'Use simplified colors, soft shading, clean readable forms, friendly mobile game rendering.',
		'Dog only. No humans. No extra animals. No text. No split layout. No collage.',
		'Frame as a centered bust portrait with a calm expressive face and a soft studio background.',
		`Preserve the same dog identity: ${analysis.summaryPrompt}.`,
		`Likely breed: ${analysis.breedGuess}. Build: ${analysis.build}. Ears: ${analysis.earShape}. Muzzle: ${analysis.muzzle}.`,
		`Palette cues: ${analysis.coatColors.join(', ') || 'warm neutral fur tones'}.`,
		`Style direction: ${style.prompt}.`,
		`Dog name: ${dogName || 'compagnon canin'}.`,
		accessoryPrompt
	].join(' ');
};

const extractImageDataUrl = (response: {
	data?: string;
	candidates?: Array<{
		content?: {
			parts?: Array<{
				inlineData?: {
					data?: string;
					mimeType?: string;
				};
			}>;
		};
	}>;
}) => {
	const imagePart = response.candidates?.[0]?.content?.parts?.find((part) =>
		part.inlineData?.mimeType?.startsWith('image/')
	);
	const mimeType = imagePart?.inlineData?.mimeType ?? 'image/png';
	const base64 = imagePart?.inlineData?.data ?? response.data;

	if (!base64) {
		throw new Error("Gemini n'a pas retourné d'image exploitable.");
	}

	return `data:${mimeType};base64,${base64}`;
};

const analyzeDogPhoto = async (base64: string, mimeType: string) => {
	const { GoogleGenAI, createPartFromBase64 } = await import('@google/genai');
	const ai = new GoogleGenAI({ apiKey: PUBLIC_GEMINI_API_KEY });
	const response = await ai.models.generateContent({
		model: ANALYSIS_MODEL,
		contents: [
			"Analyse cette photo. Reponds uniquement en JSON. Determine s'il s'agit bien d'un chien, estime la race probable ou le type mixte, puis resume les caracteristiques visuelles utiles pour regenerer un avatar canin fidele a la photo.",
			createPartFromBase64(base64, mimeType)
		],
		config: {
			temperature: 0.2,
			responseMimeType: 'application/json',
			responseJsonSchema: {
				type: 'object',
				required: [
					'isDog',
					'breedGuess',
					'confidenceLabel',
					'keyTraits',
					'coatColors',
					'build',
					'earShape',
					'muzzle',
					'summaryPrompt'
				],
				properties: {
					isDog: { type: 'boolean' },
					breedGuess: { type: 'string' },
					confidenceLabel: { type: 'string' },
					keyTraits: { type: 'array', items: { type: 'string' } },
					coatColors: { type: 'array', items: { type: 'string' } },
					build: { type: 'string' },
					earShape: { type: 'string' },
					muzzle: { type: 'string' },
					summaryPrompt: { type: 'string' }
				}
			}
		}
	});

	return parseAnalysis(response.text);
};

const generateDogAvatarImage = async (base64: string, mimeType: string, prompt: string) => {
	const { GoogleGenAI, createPartFromBase64 } = await import('@google/genai');
	const ai = new GoogleGenAI({ apiKey: PUBLIC_GEMINI_API_KEY });
	let lastError: unknown = null;

	for (const model of IMAGE_MODELS) {
		try {
			const response = await ai.models.generateContent({
				model,
				contents: [prompt, createPartFromBase64(base64, mimeType)],
				config: {
					temperature: 0.7,
					responseModalities: ['IMAGE']
				}
			});

			return extractImageDataUrl(response);
		} catch (error) {
			lastError = error;
		}
	}

	throw lastError instanceof Error
		? lastError
		: new Error("La génération Gemini de l'avatar a échoué.");
};

export const generateGeminiAvatarFromPhoto = async ({
	file,
	sourceUrl,
	styleId,
	dogName,
	equippedCount
}: GenerateGeminiAvatarInput): Promise<GeminiAvatarResult> => {
	if (!geminiAvatarEnabled) {
		throw new Error("La clé Gemini n'est pas configurée.");
	}

	const preparedImage = await prepareGeminiInlineImage(file, sourceUrl);
	const analysis = await analyzeDogPhoto(preparedImage.base64, preparedImage.mimeType);

	if (!analysis.isDog) {
		throw new Error('Gemini ne détecte pas de chien exploitable dans cette photo.');
	}

	const generationPrompt = buildGenerationPrompt(analysis, styleId, dogName, equippedCount);
	const imageDataUrl = await generateDogAvatarImage(
		preparedImage.base64,
		preparedImage.mimeType,
		generationPrompt
	);

	return {
		imageDataUrl,
		prompt: summarizeAnalysis(analysis),
		breedGuess: analysis.breedGuess,
		provider: 'gemini'
	};
};
