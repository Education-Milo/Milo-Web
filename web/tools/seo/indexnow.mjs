// Signale toutes les pages du sitemap à Bing, Yandex, Seznam, Naver…
// via IndexNow : indexation en quelques heures au lieu de quelques semaines.
// À lancer après chaque mise en production qui change le contenu public :
//   npm run seo:indexnow
const SITE = "https://milo-education.fr";
const KEY = "bf96b054fd8fd2ec82d38944c12e71cd"; // fichier public/bf96b054fd8fd2ec82d38944c12e71cd.txt

const sitemap = await fetch(`${SITE}/sitemap.xml`).then((r) => r.text());
const urlList = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
if (urlList.length === 0) throw new Error("Sitemap vide ou introuvable");

const response = await fetch("https://api.indexnow.org/indexnow", {
	method: "POST",
	headers: { "Content-Type": "application/json; charset=utf-8" },
	body: JSON.stringify({ host: new URL(SITE).host, key: KEY, keyLocation: `${SITE}/${KEY}.txt`, urlList }),
});
console.log(`IndexNow : ${response.status} ${response.statusText} pour ${urlList.length} URL`);
if (!response.ok && response.status !== 202) process.exit(1);
