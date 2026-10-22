import React, { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { HorizontalBlurShader } from "three/examples/jsm/shaders/HorizontalBlurShader.js";
import { VerticalBlurShader } from "three/examples/jsm/shaders/VerticalBlurShader.js";

/// Ombre de contact douce, posée à plat : la scène est vue d'en dessous depuis
/// le plan, chaque objet y laisse une tache d'autant plus sombre qu'il en est
/// proche (jusqu'à `far` au-dessus), puis la tache est floutée.
///
/// Même principe que ContactShadows (drei), qui ne marche pas ici : il floute
/// sur un plan laissé à l'origine du monde, hors du champ de sa caméra dès que
/// l'ombre est posée plus bas que `far` — c'est le cas du socle (y ≈ -1,08),
/// et l'ombre restait vide. Ici le plan de flou est placé devant la caméra.

interface HeroContactShadowProps {
	position?: [number, number, number];
	/// Côté du carré couvert par l'ombre (unités monde)
	size: number;
	/// Hauteur au-dessus du plan prise en compte
	far: number;
	/// Étalement du flou (même échelle que drei)
	blur: number;
	opacity: number;
	color: THREE.ColorRepresentation;
	resolution?: number;
}

const HeroContactShadow: React.FC<HeroContactShadowProps> = ({
	position,
	size,
	far,
	blur,
	opacity,
	color,
	resolution = 256,
}) => {
	const { gl, scene } = useThree();
	const camera = useRef<THREE.OrthographicCamera>(null);
	const display = useRef<THREE.Mesh>(null);

	const res = useMemo(() => {
		const target = new THREE.WebGLRenderTarget(resolution, resolution);
		const blurTarget = new THREE.WebGLRenderTarget(resolution, resolution);
		target.texture.generateMipmaps = false;
		blurTarget.texture.generateMipmaps = false;

		/// Profondeur → opacité : 1 au ras du plan, 0 à `far`
		const depth = new THREE.MeshDepthMaterial();
		depth.onBeforeCompile = (shader) => {
			shader.uniforms.ucolor = { value: new THREE.Color(color) };
			shader.fragmentShader = shader.fragmentShader
				.replace("void main() {", "uniform vec3 ucolor;\nvoid main() {")
				.replace("vec4( vec3( 1.0 - fragCoordZ ), opacity );", "vec4( ucolor, 1.0 - fragCoordZ );");
		};

		const blurH = new THREE.ShaderMaterial(HorizontalBlurShader);
		const blurV = new THREE.ShaderMaterial(VerticalBlurShader);
		blurH.depthTest = blurV.depthTest = false;
		/// Plan de flou, recalé devant la caméra de l'ombre à chaque passe
		const blurPlane = new THREE.Mesh(new THREE.PlaneGeometry(size, size));
		blurPlane.matrixAutoUpdate = false;
		blurPlane.matrixWorldAutoUpdate = false;
		return { target, blurTarget, depth, blurH, blurV, blurPlane };
	}, [resolution, size, color]);

	useEffect(
		() => () => {
			res.target.dispose();
			res.blurTarget.dispose();
			res.depth.dispose();
			res.blurH.dispose();
			res.blurV.dispose();
			res.blurPlane.geometry.dispose();
		},
		[res],
	);

	const clearColor = useMemo(() => new THREE.Color(), []);
	const offset = useMemo(() => new THREE.Matrix4(), []);

	useFrame(() => {
		const cam = camera.current;
		const plane = display.current;
		if (!cam || !plane) return;

		const previousTarget = gl.getRenderTarget();
		const previousAlpha = gl.getClearAlpha();
		gl.getClearColor(clearColor);
		const previousOverride = scene.overrideMaterial;
		const previousBackground = scene.background;

		// 1. La scène vue d'en dessous, en profondeur
		plane.visible = false;
		scene.overrideMaterial = res.depth;
		scene.background = null;
		gl.setClearColor(0x000000, 0);
		gl.setRenderTarget(res.target);
		gl.render(scene, cam);
		scene.overrideMaterial = previousOverride;
		scene.background = previousBackground;
		plane.visible = true;

		// 2. Flou horizontal puis vertical, sur un plan placé devant la caméra
		cam.updateWorldMatrix(true, false);
		offset.makeTranslation(0, 0, -far / 2);
		res.blurPlane.matrixWorld.multiplyMatrices(cam.matrixWorld, offset);
		res.blurPlane.material = res.blurH;
		res.blurH.uniforms.tDiffuse.value = res.target.texture;
		res.blurH.uniforms.h.value = blur / 256;
		gl.setRenderTarget(res.blurTarget);
		gl.render(res.blurPlane, cam);
		res.blurPlane.material = res.blurV;
		res.blurV.uniforms.tDiffuse.value = res.blurTarget.texture;
		res.blurV.uniforms.v.value = blur / 256;
		gl.setRenderTarget(res.target);
		gl.render(res.blurPlane, cam);

		gl.setRenderTarget(previousTarget);
		gl.setClearColor(clearColor, previousAlpha);
	});

	return (
		<group position={position}>
			{/* Caméra au ras du plan, tournée vers le haut (son « haut » est +Z) */}
			<orthographicCamera
				ref={camera}
				args={[-size / 2, size / 2, size / 2, -size / 2, 0, far]}
				rotation={[Math.PI / 2, 0, 0]}
			/>
			{/* Plan d'affichage, face vers le haut ; retourné en Y pour que l'image
			    de la caméra tombe à l'aplomb des objets */}
			<mesh ref={display} rotation={[-Math.PI / 2, 0, 0]} scale={[1, -1, 1]}>
				<planeGeometry args={[size, size]} />
				<meshBasicMaterial map={res.target.texture} transparent opacity={opacity} depthWrite={false} />
			</mesh>
		</group>
	);
};

export default HeroContactShadow;
