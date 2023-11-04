import { FastGeoIPLocator, GeoLocationExt } from "../fast-geoip.js";

import assert from "assert";

async function testGeoLocationInfo() {
	console.log('--> testGeoLocationInfo');
	const locator = new FastGeoIPLocator();
	const ip1 = "80.80.128.0";
	const ip2 = "213.222.32.0";

	let geoLocation: GeoLocationExt = (await locator.readLocation(ip1)) as GeoLocationExt;

	assert.equal(geoLocation.country, "BG");
	assert.equal(geoLocation.city, "Plovdiv");

	geoLocation = (await locator.readLocation(ip2)) as GeoLocationExt;

	assert.equal(geoLocation.country, "BG");
	assert.equal(geoLocation.city, "Sofia");
	
	console.log(geoLocation);

}

async function runTests() {
	console.log();
	console.log('----- Run IPAddressGeoLocationTest -----');
	await testGeoLocationInfo();
}

export {runTests};