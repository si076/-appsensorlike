import { FastGeoIPLocator, GeoLocationExt } from "../fast-geoip.js";

import { loggedUnexpectedErrors } from "@appsensorlike/appsensorlike/execution-modes/tests/tests.js";
import { Logger } from "@appsensorlike/appsensorlike/logging/logging.js";

import assert from "assert";

async function testGeoLocationInfo() {
	Logger.getTestsLogger().info('--> testGeoLocationInfo');
	const locator = new FastGeoIPLocator();
	const ip1 = "80.80.128.0";
	const ip2 = "213.222.32.0";

	let geoLocation: GeoLocationExt = (await locator.readLocation(ip1)) as GeoLocationExt;

	assert.equal(geoLocation.country, "BG");
	assert.equal(geoLocation.city, "Plovdiv");

	geoLocation = (await locator.readLocation(ip2)) as GeoLocationExt;

	assert.equal(geoLocation.country, "BG");
	assert.equal(geoLocation.city, "Sofia");
	
	Logger.getTestsLogger().info(geoLocation);

}

async function runTests() {
	Logger.getTestsLogger().info('');
	Logger.getTestsLogger().info('----- Run IPAddressGeoLocationTest -----');

    let exitCode = 0;

    try {

		await testGeoLocationInfo();

	} catch (error) {
		exitCode = 1;
		Logger.getTestsLogger().error(error);
	}

    if (loggedUnexpectedErrors([])) {
        exitCode = 1;
    }

    await Logger.shutdownAsync();
    
    process.exit(exitCode);
}

export {runTests};