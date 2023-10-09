import { GeoLocation, GeoLocator } from "@appsensorlike/appsensorlike/core/geolocation/geolocation.js";

import fast_geoip from 'fast-geoip';

interface ipInfo {
    range: [number, number];
    country: string;
    region: string;
    eu: "0" | "1";
    timezone: string;
    city: string;
    ll: [number, number];
    metro: number;
    area: number;
}

class GeoLocationExt extends GeoLocation implements ipInfo {

    range: [number, number];
    country: string;
    region: string;
    eu: "0" | "1";
    timezone: string;
    city: string;
    ll: [number, number];
    metro: number;
    area: number;

    constructor(ipInfo: ipInfo) {
        super(ipInfo.ll[0], ipInfo.ll[1]);
        this.range = ipInfo.range;
        this.country = ipInfo.country;
        this.region = ipInfo.region;
        this.eu = ipInfo.eu;
        this.timezone = ipInfo.timezone;
        this.city = ipInfo.city;
        this.ll = ipInfo.ll;
        this.metro = ipInfo.metro;
        this.area = ipInfo.area;
    }
}


class FastGeoIPLocator implements GeoLocator {

    readLocation(address: string): Promise<GeoLocation | null> {
        return new Promise((resolve, reject) => {
            fast_geoip.lookup(address)
            .then((ipInfo) => {
                let geoLocation = null;
                if (ipInfo) {
                    geoLocation = new GeoLocationExt(ipInfo);
                }
                resolve(geoLocation);
            })
            .catch((error) => {
                reject(error);
            });
        });
    }

}

export {FastGeoIPLocator, GeoLocationExt};