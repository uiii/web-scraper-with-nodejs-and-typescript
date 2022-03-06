import fs from 'fs';
import path from 'path';
import axios from 'axios';
import cheerio from 'cheerio';

export class CapitalCityScraper {
	async scrapeCity(url: string) {
		const response = await axios.get(url);
		const html = response.data;

		const $ = cheerio.load(html);

		const cityName = $('#firstHeading').text().trim();
		console.log(cityName);

		const country = $('.mergedtoprow th:contains(Country) + td').text().trim();
		console.log(country);

		const areaRows = $('.mergedtoprow th:contains(Area)').parent().nextUntil('.mergedtoprow');
		const areaText = areaRows.find('th:contains(Capital city) + td').text().trim().replace(/ km2.*$/, '');
		const area = parseFloat(areaText.replace(/,/g, ''));
		console.log(area);

		const populationRows = $('.mergedtoprow th:contains(Population)').parent().nextUntil('.mergedtoprow');
		const populationText = populationRows.find('th:contains(Capital city) + td').text().trim();
		const population = parseFloat(populationText.replace(/,/g, ''));
		console.log(population);

		const flagPageLink = $('.mergedtoprow a.image + div:contains(Flag)').prev().attr('href')!;
		const flagPageUrl = new URL(flagPageLink, url).toString();
		const flagImagePath = await this.scrapeImage(flagPageUrl);
		console.log(flagImagePath);
	}

	protected async scrapeImage(url: string) {
		const response = await axios.get(url);
		const html = response.data;

		const doc = cheerio.load(html);

		const imageLink = doc('#file a').attr('href')!;
		const imageUrl = new URL(imageLink, url).toString();

		const imagePath = await this.downloadFile(imageUrl, 'flags');

		return imagePath;
	}

	protected async downloadFile(url: string, dir: string) {
		const response = await axios.get(url, {
			responseType: 'arraybuffer'
		});

		fs.mkdirSync(dir, { recursive: true });

		const filePath = path.join(dir, path.basename(url));
		fs.writeFileSync(filePath, response.data);

		return filePath;
	}
}

async function main() {
	const scraper = new CapitalCityScraper();
	await scraper.scrapeCity("https://en.wikipedia.org/wiki/Prague");
}

main();
