import { useEffect, useMemo } from "react";
import { useCosmetics, useEquipped } from "@features/cosmetics/store/cosmetics.queries";
import { registerAccessoryMeshNames } from "@features/my-milo/utils/miloModel";

/**
 * Maillages à afficher sur le Milo du joueur connecté, d'après
 * GET /user/{id}/locker/equipped. Enregistre aussi au passage tous les
 * maillages connus du catalogue, pour que les utilitaires 3D sachent quels
 * accessoires masquer.
 */
export const useEquippedMeshNames = () => {
	const { data: equipped, isSuccess } = useEquipped();
	const { data: catalogue } = useCosmetics();

	const accessoryMeshNames = useMemo(() => {
		const names = new Set<string>();
		catalogue?.forEach((item) => {
			if (item.mesh_name) names.add(item.mesh_name);
		});
		Object.values(equipped?.skins ?? {}).forEach((item) => {
			if (item?.mesh_name) names.add(item.mesh_name);
		});
		return [...names].sort();
	}, [catalogue, equipped]);

	useEffect(() => {
		registerAccessoryMeshNames(accessoryMeshNames);
	}, [accessoryMeshNames]);

	const equippedMeshNames = useMemo(
		() =>
			Object.values(equipped?.skins ?? {})
				.map((item) => item?.mesh_name)
				.filter((name): name is string => Boolean(name))
				.sort(),
		[equipped],
	);

	return { equippedMeshNames, accessoryMeshNames, isReady: isSuccess };
};

/** Traduit des ids d'objets (ex. `equipped_items` d'un ami) en maillages, via le catalogue. */
export const useMeshNamesForItemIds = (itemIds: number[] | undefined) => {
	const { data: catalogue } = useCosmetics();
	return useMemo(() => {
		if (!itemIds?.length || !catalogue) return [];
		const byId = new Map(catalogue.map((item) => [item.id, item.mesh_name]));
		return itemIds
			.map((id) => byId.get(id))
			.filter((name): name is string => Boolean(name))
			.sort();
	}, [itemIds, catalogue]);
};
