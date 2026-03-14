import { browser } from '$app/environment';
import { writable } from 'svelte/store';
import {
	avatarStyles,
	cosmeticCatalog,
	defaultReminders,
	domainCatalog,
	journeyNodes,
	type CosmeticSlot,
	type DomainId,
	type ReminderItem
} from '$lib/app-data';

const STORAGE_KEY = 'vetplay-state-v1';

export type NotificationSettingId =
	| 'dailyJourney'
	| 'unlockedActivities'
	| 'shopDrops'
	| 'eveningDigest';

export type VetPlayState = {
	playerName: string;
	dogName: string;
	xp: number;
	coins: number;
	streak: number;
	completedJourneyNodeIds: string[];
	dailyChallengeIds: string[];
	dailyChallengeDate: string;
	activityRuns: Record<string, number>;
	notificationSettings: Record<NotificationSettingId, boolean>;
	reminders: ReminderItem[];
	ownedCosmeticIds: string[];
	equippedCosmetics: Partial<Record<CosmeticSlot, string>>;
	avatarStyleId: string;
	avatarImage: string | null;
	avatarGeneratedAt: string | null;
	lastAvatarPrompt: string | null;
};

export type DomainSummary = {
	id: DomainId;
	name: string;
	description: string;
	goal: string;
	progress: number;
	level: number;
	mastery: number;
	totalRuns: number;
};

const baseState = (): VetPlayState => ({
	playerName: 'Lina',
	dogName: 'Nox',
	xp: 120,
	coins: 420,
	streak: 9,
	completedJourneyNodeIds: [],
	dailyChallengeIds: journeyNodes.slice(0, 3).map((node) => node.id),
	dailyChallengeDate: getTodayKey(),
	activityRuns: {},
	notificationSettings: {
		dailyJourney: true,
		unlockedActivities: true,
		shopDrops: false,
		eveningDigest: true
	},
	reminders: defaultReminders,
	ownedCosmeticIds: ['outfit-sauge'],
	equippedCosmetics: {
		outfit: 'outfit-sauge'
	},
	avatarStyleId: avatarStyles[0].id,
	avatarImage: null,
	avatarGeneratedAt: null,
	lastAvatarPrompt: null
});

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const DAILY_CHALLENGE_COUNT = 3;

function getTodayKey() {
	return new Date().toISOString().slice(0, 10);
}

function getRemainingJourneyNodeIds(completedJourneyNodeIds: string[]) {
	return journeyNodes
		.filter((node) => !completedJourneyNodeIds.includes(node.id))
		.map((node) => node.id);
}

function buildDailyChallengeIds(
	completedJourneyNodeIds: string[],
	existingDailyChallengeIds: string[] = []
) {
	const remainingIds = getRemainingJourneyNodeIds(completedJourneyNodeIds);
	const keptIds = existingDailyChallengeIds
		.filter((challengeId) => remainingIds.includes(challengeId))
		.slice(0, DAILY_CHALLENGE_COUNT);
	const nextIds = remainingIds
		.filter((challengeId) => !keptIds.includes(challengeId))
		.slice(0, DAILY_CHALLENGE_COUNT - keptIds.length);

	return [...keptIds, ...nextIds];
}

function ensureDailyChallenges(state: VetPlayState): VetPlayState {
	const todayKey = getTodayKey();
	const shouldRefreshByDate = state.dailyChallengeDate !== todayKey;
	const nextDailyChallengeIds = buildDailyChallengeIds(
		state.completedJourneyNodeIds,
		shouldRefreshByDate ? [] : state.dailyChallengeIds
	);

	if (
		!shouldRefreshByDate &&
		nextDailyChallengeIds.length === state.dailyChallengeIds.length &&
		nextDailyChallengeIds.every(
			(challengeId, index) => challengeId === state.dailyChallengeIds[index]
		)
	) {
		return state;
	}

	return {
		...state,
		dailyChallengeDate: todayKey,
		dailyChallengeIds: nextDailyChallengeIds
	};
}

const safeReminder = (input: Partial<ReminderItem>): ReminderItem | null => {
	if (!input.label || !input.time || !input.dayLabel) return null;

	return {
		id: input.id ?? createId('rem'),
		label: input.label.trim(),
		time: input.time,
		dayLabel: input.dayLabel.trim(),
		done: input.done ?? false
	};
};

const normalizeState = (value: unknown): VetPlayState => {
	const defaults = baseState();
	if (!value || typeof value !== 'object') return defaults;

	const candidate = value as Partial<VetPlayState>;

	const reminders =
		candidate.reminders
			?.map((item) => safeReminder(item))
			.filter((item): item is ReminderItem => item !== null) ?? defaults.reminders;

	return {
		playerName: candidate.playerName?.trim() || defaults.playerName,
		dogName: candidate.dogName?.trim() || defaults.dogName,
		xp: typeof candidate.xp === 'number' ? candidate.xp : defaults.xp,
		coins: typeof candidate.coins === 'number' ? candidate.coins : defaults.coins,
		streak: typeof candidate.streak === 'number' ? candidate.streak : defaults.streak,
		completedJourneyNodeIds: Array.isArray(candidate.completedJourneyNodeIds)
			? candidate.completedJourneyNodeIds.filter(
					(value): value is string => typeof value === 'string'
				)
			: defaults.completedJourneyNodeIds,
		dailyChallengeIds: Array.isArray(candidate.dailyChallengeIds)
			? candidate.dailyChallengeIds.filter((value): value is string => typeof value === 'string')
			: defaults.dailyChallengeIds,
		dailyChallengeDate:
			typeof candidate.dailyChallengeDate === 'string'
				? candidate.dailyChallengeDate
				: defaults.dailyChallengeDate,
		activityRuns:
			candidate.activityRuns && typeof candidate.activityRuns === 'object'
				? Object.fromEntries(
						Object.entries(candidate.activityRuns).filter(
							([activityId, count]) => typeof activityId === 'string' && typeof count === 'number'
						)
					)
				: defaults.activityRuns,
		notificationSettings: {
			...defaults.notificationSettings,
			...(candidate.notificationSettings ?? {})
		},
		reminders,
		ownedCosmeticIds: Array.isArray(candidate.ownedCosmeticIds)
			? candidate.ownedCosmeticIds.filter((value): value is string => typeof value === 'string')
			: defaults.ownedCosmeticIds,
		equippedCosmetics:
			candidate.equippedCosmetics && typeof candidate.equippedCosmetics === 'object'
				? candidate.equippedCosmetics
				: defaults.equippedCosmetics,
		avatarStyleId:
			avatarStyles.find((style) => style.id === candidate.avatarStyleId)?.id ??
			defaults.avatarStyleId,
		avatarImage:
			typeof candidate.avatarImage === 'string' ? candidate.avatarImage : defaults.avatarImage,
		avatarGeneratedAt:
			typeof candidate.avatarGeneratedAt === 'string'
				? candidate.avatarGeneratedAt
				: defaults.avatarGeneratedAt,
		lastAvatarPrompt:
			typeof candidate.lastAvatarPrompt === 'string'
				? candidate.lastAvatarPrompt
				: defaults.lastAvatarPrompt
	};
};

function createId(prefix: string) {
	if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
		return `${prefix}-${crypto.randomUUID()}`;
	}

	return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export const getPlayerLevel = (xp: number) => Math.max(1, Math.floor(xp / 180) + 1);

const getJourneyCompletionCount = (state: VetPlayState) => state.completedJourneyNodeIds.length;

const getMastery = (state: VetPlayState, domainId: DomainId) => {
	const completedJourneyNodes = state.completedJourneyNodeIds.reduce((total, nodeId) => {
		return total + (journeyDomainLookup.get(nodeId) === domainId ? 1 : 0);
	}, 0);

	const practiceRuns =
		domainCatalog
			.find((domain) => domain.id === domainId)
			?.activities.reduce((total, activity) => total + (state.activityRuns[activity.id] ?? 0), 0) ??
		0;

	return {
		completedJourneyNodes,
		practiceRuns,
		mastery: clamp(completedJourneyNodes * 24 + practiceRuns * 12, 0, 100)
	};
};

export const getNodeStatus = (state: VetPlayState, nodeId: string, index: number) => {
	if (state.completedJourneyNodeIds.includes(nodeId)) return 'completed';
	if (index <= getJourneyCompletionCount(state)) return 'active';
	return 'locked';
};

export const getDomainSummary = (state: VetPlayState, domainId: DomainId): DomainSummary => {
	const domain = domainCatalog.find((item) => item.id === domainId) ?? domainCatalog[0];
	const { mastery, practiceRuns } = getMastery(state, domainId);

	return {
		id: domain.id,
		name: domain.name,
		description: domain.description,
		goal: domain.goal,
		progress: mastery / 100,
		level: Math.max(1, Math.floor(mastery / 15) + 1),
		mastery,
		totalRuns: practiceRuns
	};
};

const journeyDomainLookup = new Map(journeyNodes.map((node) => [node.id, node.domain] as const));

const store = writable<VetPlayState>(baseState());

if (browser) {
	const rawState = localStorage.getItem(STORAGE_KEY);
	if (rawState) {
		try {
			store.set(ensureDailyChallenges(normalizeState(JSON.parse(rawState))));
		} catch {
			store.set(ensureDailyChallenges(baseState()));
		}
	}

	store.subscribe((state) => {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(ensureDailyChallenges(state)));
	});
}

export const vetplay = {
	subscribe: store.subscribe,
	reset() {
		store.set(ensureDailyChallenges(baseState()));
	},
	completeJourneyNode(nodeId: string, xp: number, coins: number) {
		store.update((state) => {
			if (state.completedJourneyNodeIds.includes(nodeId)) return state;
			const nextNodeId = journeyNodes[state.completedJourneyNodeIds.length]?.id;
			if (nextNodeId !== nodeId) return state;

			return ensureDailyChallenges({
				...state,
				xp: state.xp + xp,
				coins: state.coins + coins,
				completedJourneyNodeIds: [...state.completedJourneyNodeIds, nodeId]
			});
		});
	},
	runActivity(activityId: string, xp: number, coins: number) {
		store.update((state) => ({
			...state,
			xp: state.xp + xp,
			coins: state.coins + coins,
			activityRuns: {
				...state.activityRuns,
				[activityId]: (state.activityRuns[activityId] ?? 0) + 1
			}
		}));
	},
	toggleNotification(setting: NotificationSettingId) {
		store.update((state) => ({
			...state,
			notificationSettings: {
				...state.notificationSettings,
				[setting]: !state.notificationSettings[setting]
			}
		}));
	},
	addReminder(reminder: Partial<ReminderItem>) {
		const cleanReminder = safeReminder(reminder);
		if (!cleanReminder) return;

		store.update((state) => ({
			...state,
			reminders: [cleanReminder, ...state.reminders]
		}));
	},
	toggleReminderDone(reminderId: string) {
		store.update((state) => ({
			...state,
			reminders: state.reminders.map((reminder) =>
				reminder.id === reminderId ? { ...reminder, done: !reminder.done } : reminder
			)
		}));
	},
	removeReminder(reminderId: string) {
		store.update((state) => ({
			...state,
			reminders: state.reminders.filter((reminder) => reminder.id !== reminderId)
		}));
	},
	updateProfile(playerName: string, dogName: string, avatarStyleId: string) {
		store.update((state) => ({
			...state,
			playerName: playerName.trim() || state.playerName,
			dogName: dogName.trim() || state.dogName,
			avatarStyleId:
				avatarStyles.find((style) => style.id === avatarStyleId)?.id ?? state.avatarStyleId
		}));
	},
	setAvatarResult(imageDataUrl: string, prompt: string) {
		store.update((state) => ({
			...state,
			avatarImage: imageDataUrl,
			avatarGeneratedAt: new Date().toISOString(),
			lastAvatarPrompt: prompt
		}));
	},
	buyCosmetic(itemId: string) {
		store.update((state) => {
			if (state.ownedCosmeticIds.includes(itemId)) return state;
			const item = cosmeticCatalog.find((entry) => entry.id === itemId);
			if (!item || state.coins < item.price) return state;

			return {
				...state,
				coins: state.coins - item.price,
				ownedCosmeticIds: [...state.ownedCosmeticIds, itemId],
				equippedCosmetics: {
					...state.equippedCosmetics,
					[item.slot]: item.id
				}
			};
		});
	},
	equipCosmetic(itemId: string) {
		store.update((state) => {
			if (!state.ownedCosmeticIds.includes(itemId)) return state;
			const item = cosmeticCatalog.find((entry) => entry.id === itemId);
			if (!item) return state;

			return {
				...state,
				equippedCosmetics: {
					...state.equippedCosmetics,
					[item.slot]: item.id
				}
			};
		});
	}
};

export const getDailyChallengeNodes = (state: VetPlayState) =>
	state.dailyChallengeIds
		.map((challengeId) => journeyNodes.find((node) => node.id === challengeId))
		.filter((node): node is (typeof journeyNodes)[number] => Boolean(node));

export const getOwnedCosmeticSet = (state: VetPlayState) => new Set(state.ownedCosmeticIds);

export const getEquippedCosmetics = (state: VetPlayState) =>
	cosmeticCatalog.filter((item) => state.equippedCosmetics[item.slot] === item.id);

export const getTotalActivityRuns = (state: VetPlayState) =>
	Object.values(state.activityRuns).reduce((total, count) => total + count, 0);

export const getTotalCompletedNodes = (state: VetPlayState) => state.completedJourneyNodeIds.length;

export const getDomainSummaries = (state: VetPlayState) =>
	domainCatalog.map((domain) => {
		const { mastery, practiceRuns } = getMastery(state, domain.id);

		return {
			id: domain.id,
			name: domain.name,
			description: domain.description,
			goal: domain.goal,
			progress: mastery / 100,
			level: Math.max(1, Math.floor(mastery / 15) + 1),
			mastery,
			totalRuns: practiceRuns
		} satisfies DomainSummary;
	});
