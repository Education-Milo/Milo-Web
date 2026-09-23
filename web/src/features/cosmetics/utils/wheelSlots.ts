/**
 * Emplacements de la roue des duels.
 *
 * Le serveur ne connaît qu'un ensemble de six objets équipés au maximum, sans
 * position. L'emplacement choisi par l'élève (« ce sticker dans la case 4 »)
 * est donc mémorisé dans le navigateur, par utilisateur, et réconcilié avec
 * l'ensemble renvoyé par l'API : un objet déséquipé côté serveur disparaît,
 * un objet équipé sans emplacement connu prend la première case libre.
 */
export const WHEEL_SLOT_COUNT = 6;

type SlotMap = Record<number, number>; // emplacement → cosmetic_id

const storageKey = (userId: string | number) => `milo-wheel-slots:${userId}`;

export const loadSlotMap = (userId: string | number): SlotMap => {
	try {
		const raw = localStorage.getItem(storageKey(userId));
		const parsed = raw ? (JSON.parse(raw) as unknown) : null;
		if (!parsed || typeof parsed !== "object") return {};
		const map: SlotMap = {};
		for (const [slot, id] of Object.entries(parsed as Record<string, unknown>)) {
			const s = Number(slot);
			if (Number.isInteger(s) && s >= 0 && s < WHEEL_SLOT_COUNT && typeof id === "number") map[s] = id;
		}
		return map;
	} catch {
		return {};
	}
};

const saveSlotMap = (userId: string | number, map: SlotMap) => {
	try {
		localStorage.setItem(storageKey(userId), JSON.stringify(map));
	} catch {
		// stockage indisponible : l'ordre retombe sur celui du serveur
	}
};

/** Réserve l'emplacement `slot` à l'objet `cosmeticId` (retire l'objet d'un autre emplacement s'il y était). */
export const assignSlot = (userId: string | number, slot: number, cosmeticId: number) => {
	const map = loadSlotMap(userId);
	for (const key of Object.keys(map)) {
		if (map[Number(key)] === cosmeticId) delete map[Number(key)];
	}
	map[slot] = cosmeticId;
	saveSlotMap(userId, map);
};

export const clearSlot = (userId: string | number, slot: number) => {
	const map = loadSlotMap(userId);
	delete map[slot];
	saveSlotMap(userId, map);
};

/** Place les objets équipés dans leurs emplacements ; `null` = case vide. */
export const arrangeWheel = <T extends { id: number }>(
	equipped: T[],
	userId: string | number | undefined,
): (T | null)[] => {
	const slots: (T | null)[] = Array.from({ length: WHEEL_SLOT_COUNT }, () => null);
	const map = userId === undefined ? {} : loadSlotMap(userId);
	const placed = new Set<number>();
	for (let slot = 0; slot < WHEEL_SLOT_COUNT; slot += 1) {
		const id = map[slot];
		const item = id === undefined ? undefined : equipped.find((e) => e.id === id);
		if (item && !placed.has(item.id)) {
			slots[slot] = item;
			placed.add(item.id);
		}
	}
	for (const item of equipped) {
		if (placed.has(item.id)) continue;
		const free = slots.findIndex((s) => s === null);
		if (free === -1) break;
		slots[free] = item;
		placed.add(item.id);
	}
	return slots;
};
