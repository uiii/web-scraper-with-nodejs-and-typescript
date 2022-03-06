import fs from 'fs';
import path from 'path';
import axios from 'axios';
import cheerio from 'cheerio';

interface City {
	name: string;
	country?: string;
	area?: number;
	population?: number;
	flagImagePath?: string;
}

export class CapitalCityScraper {
	readonly startUrl = "https://en.wikipedia.org/wiki/List_of_European_countries_by_area";

	async *scrape() {
		for await (let url of this.crawlCountries(this.startUrl)) {
			yield await this.scrapeCity(url);
		}
	}

	async *crawlCountries(url: string) {
		const response = await axios.get(url);
		const html = response.data;

		const $ = cheerio.load(html);

		const links = $('.wikitable td:nth-child(2) > a').get();

		for (let link of links) {
			const href = $(link).attr('href')!;
			const countryPageUrl = new URL(href, url).toString();
			const capitalCityPageUrl = await this.crawlCountry(countryPageUrl);

			if (capitalCityPageUrl) {
				yield capitalCityPageUrl;
			}
		}
	}

	async crawlCountry(url: string) {
		const response = await axios.get(url);
		const html = response.data;

		const $ = cheerio.load(html);

		const capitalCityRow = $('.infobox th:contains(Capital)').parent();

		if (capitalCityRow.length === 0) {
			// city state is capitaly city itself
			return url;
		}

		const capitalCityLink = capitalCityRow.find('td > a').attr('href');

		if (!capitalCityLink) {
			// in some cases the capital city cannot be scraped
			// (possible, but too complicated for this article)
			return undefined;
		}

		const capitalCityUrl = new URL(capitalCityLink, url).toString();

		return capitalCityUrl;
	}

	async scrapeCity(url: string) {
		const response = await axios.get(url);
		const html = response.data;

		const $ = cheerio.load(html);

		$('.infobox .reference').remove();

		const cityName = $('#firstHeading').text().trim();

		const country = $('.infobox th:contains(Country) + td').first().text().trim() || undefined;

		const areaRows = $('.mergedtoprow th:contains(Area)').parent().nextUntil('.mergedtoprow').addBack();
		const areaValues = areaRows.find('td').filter((i, el) => !!$(el).text().trim().match(/^[0-9,.]+\s+km2.*$/));
		const areaText = areaValues.first().text().trim().replace(/ km2.*$/, '');
		const area = parseFloat(areaText.replace(/,/g, '')) || undefined;

		const populationRows = $('.mergedtoprow th:contains(Population)').parent().nextUntil('.mergedtoprow').addBack();
		const populationValues = populationRows.find('td').filter((i, el) => !!$(el).text().trim().match(/^[0-9,.]+(\s+\(.*\))?$/));
		const populationText = populationValues.first().text().trim();
		const population = parseFloat(populationText.replace(/,/g, '')) || undefined;

		const flagPageLink = $('.infobox a.image + div:contains(Flag)').prev().attr('href')!;
		const flagPageUrl = flagPageLink && new URL(flagPageLink, url).toString();
		const flagImagePath = flagPageUrl && await this.scrapeImage(flagPageUrl);

		const city: City = {
			name: cityName,
			country,
			area,
			population,
			flagImagePath
		};

		return city;
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

	for await (let city of scraper.scrape()) {
		console.log(city);
	}
}

main();
