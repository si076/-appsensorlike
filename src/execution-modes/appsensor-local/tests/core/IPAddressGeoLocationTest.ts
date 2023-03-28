import { Utils } from "../../../../core/core.js";
import { FastGeoIPLocator } from "../../../../geolocators/fast-geoip/fast-geoip.js";

import assert from "assert";

class IPAddressGeoLocationTest {


	private async testGeoLocationInfo() {
		console.log('--> testGeoLocationInfo');
        const locator = new FastGeoIPLocator();
		// russia
		const a1 = await Utils.fromString("5.45.80.10", locator);	
		console.log(a1);
		this.assertEquals(55.7522, a1.getGeoLocation()!.getLatitude(), 1.0);
		this.assertEquals(37.6156, a1.getGeoLocation()!.getLongitude(), 1.0);
		// canada
		const a2 = await Utils.fromString("23.29.201.141", locator);
		console.log(a2);
		this.assertEquals(43.6319, a2.getGeoLocation()!.getLatitude(), 1.0);
		this.assertEquals(-79.3716, a2.getGeoLocation()!.getLongitude(), 1.0);
		// australia
		const a3 = await Utils.fromString("27.54.137.119", locator);
		console.log(a3);
		this.assertEquals(-37.8159, a3.getGeoLocation()!.getLatitude(), 1.0);
		this.assertEquals(144.9669, a3.getGeoLocation()!.getLongitude(), 1.0);
		// south africa
		const a4 = await Utils.fromString("41.50.10.35", locator);
		console.log(a4);
		this.assertEquals(-26.3811, a4.getGeoLocation()!.getLatitude(), 1.0);
		this.assertEquals(27.8376, a4.getGeoLocation()!.getLongitude(), 1.0);
		console.log('<-- testGeoLocationInfo');
	}

	private assertEquals(expected: number, actual: number, delta: number) {
		const expectedMin = expected - delta;
		const expectedMax = expected + delta;
		if (!(expectedMin <= actual && expectedMax >= actual)) {
			throw new assert.AssertionError(
				{message: `actual: ${actual} is outside of expected interval [${expectedMin} - ${expectedMax}]`});
		}
	}

    public static async runTests() {
		console.log();
		console.log('----- Run IPAddressGeoLocationTest -----');
        await new IPAddressGeoLocationTest().testGeoLocationInfo();
    }
	
}

export {IPAddressGeoLocationTest};