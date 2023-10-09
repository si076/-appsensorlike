import { FastGeoIPLocator, GeoLocationExt } from "../fast-geoip.js";

import assert from "assert";

class IPAddressGeoLocationTest {


	private _generateRandomIp(start: number, end: number): number[] {
		let r = Math.floor(Math.random() * (end - start + 1)) + start;
		
		const ip = [];
		for (let i = 0; i < 4; i++) {
			ip.push(r % 256);
			r = Math.floor(r / 256);
		}
		
		return ip.reverse(); // put the results mod/div into correct order
	}
	
	private generateRandomIp(start: number, end: number): string {
		let ip = this._generateRandomIp(start, end);
		let valid = true;
		
		// ip can't be of format 10.xxx.xxx.xxx
		if (ip[0] === 10) { valid = false; }
		
		// ip can't be of format 172.16.xxx.xxx
		if (ip[0] === 172 && ip[1] === 16) { valid = false; }
		
		// ip can't be of format 192.168.xxx.xxx
		if (ip[0] === 192 && ip[1] === 168) { valid = false; }
		
		if (valid === true) {
			return ip.join('.'); // convert ip to string format
		} else {
			return this.generateRandomIp(start, end); // try again
		}
	}
	  
	private async testGeoLocationInfo() {
		console.log('--> testGeoLocationInfo');
        const locator = new FastGeoIPLocator();
		const range1S = "80.80.128.0";
		const range1E = "80.80.159.255";
		const range2S = "83.228.0.0";
		const range2E = "83.228.127.255";

		let geoLocation: GeoLocationExt = (await locator.readLocation(range1S)) as GeoLocationExt;

		assert.equal(geoLocation.country, "Bulgaria");
		assert.equal(geoLocation.city, "Plovdiv");

		geoLocation = (await locator.readLocation(range2S)) as GeoLocationExt;

		assert.equal(geoLocation.country, "Bulgaria");
		assert.equal(geoLocation.city, "Sofia");
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