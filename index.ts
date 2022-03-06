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
		const area = areaRows.find('th:contains(Capital city) + td').text().trim();
		console.log(area);

		const populationRows = $('.mergedtoprow th:contains(Population)').parent().nextUntil('.mergedtoprow');
		const population = populationRows.find('th:contains(Capital city) + td').text().trim();
		console.log(population);
	}
}

async function main() {
	const scraper = new CapitalCityScraper();
	await scraper.scrapeCity("https://en.wikipedia.org/wiki/Prague");
}

main();
