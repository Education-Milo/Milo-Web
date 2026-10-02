import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

/// API relayée par le serveur de dev. Surchargeable pour taper sur un back
/// local : VITE_DEV_API_TARGET=http://localhost:8000
const API_TARGET = process.env.VITE_DEV_API_TARGET ?? "https://api.milo-education.fr";

export default defineConfig({
	plugins: [
		// Plugins Vite
		react({
			babel: {
				plugins: [
					// Plugins Babel, passés au plugin React
					["@babel/plugin-proposal-decorators", { legacy: true }],
				],
			},
		}),
	],
	resolve: {
		alias: {
			"@api": resolve(__dirname, "src/api"),
			"@components": resolve(__dirname, "src/components"),
			"@features": resolve(__dirname, "src/features"),
			"@navigation": resolve(__dirname, "src/navigation"),
      "@shared": resolve(__dirname, "src/shared"),
			// '@fonts': resolve(__dirname, 'src/fonts'),
			// '@locales': resolve(__dirname, 'src/locales'),
			"@types": resolve(__dirname, "src/types"),
			"@styles": resolve(__dirname, "src/styles"),
			"@constants": resolve(__dirname, "src/constants"),
			// '@assets': resolve(__dirname, 'src/assets'),
			// '@utils': resolve(__dirname, 'src/utils'),
		},
	},
	server: {
		port: 3000,
		host: true,
		/**
		 * L'API de prod n'autorise en CORS que https://milo-education.fr et
		 * https://www.milo-education.fr : un front lancé sur http://localhost:3000
		 * voit ses requêtes bloquées au préflight. On passe donc par le serveur de
		 * dev, qui relaie /api vers l'API : côté navigateur tout est same-origin,
		 * il n'y a plus de CORS du tout. `ws: true` couvre les WebSockets des duels.
		 *
		 * Uniquement le serveur de dev : le build de prod n'est pas concerné, le
		 * front déployé appelle l'API directement depuis une origine autorisée.
		 */
		proxy: {
			"/api": {
				target: API_TARGET,
				changeOrigin: true,
				ws: true,
				rewrite: (path) => path.replace(/^\/api/, ""),
				// Le cookie de refresh est posé pour api.milo-education.fr :
				// sans ça le navigateur le rejette sur localhost
				cookieDomainRewrite: "",
			},
		},
	},
});