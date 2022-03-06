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
	}
}

async function main() {
	const scraper = new CapitalCityScraper();
	await scraper.scrapeCity("https://en.wikipedia.org/wiki/Prague");
}

main();
