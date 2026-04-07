import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

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
			"@store": resolve(__dirname, "src/store"),
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
	},
});
