[@appsensorlike/appsensorlike](https://www.npmjs.com/package/@appsensorlike/appsensorlike) 
geo locator implementation utilizing https://www.npmjs.com/package/fast-geoip library.
You can find it useful when you have to filter requests by geolocation.
If you add geolocation along with the IP address in IPAddress constructor, it will be visualized in [Dashboard's](https://www.npmjs.com/package/@appsensorlike/appsensorlike_ui_web) geo map.

Installation
---
`````
npm i @appsensorlike/appsensorlike_geolocators_fast_geoip
`````

Usage
---
`````javascript
import { FastGeoIPLocator } from "@appsensorlike/appsensorlike_geolocators_fast_geoip";
import { IPAddress } from "@appsensorlike/appsensorlike/core/core.js"

const geoLocator = new FastGeoIPLocator();

const getLocation = await geoLocator.readLocation("80.80.128.0");

console.log(getLocation);

//follow two options to create an IPAddress with geolocation
//
//use already obtained geolocation
const ipAddress1 = new IPAddress("80.80.128.0", getLocation);

//obtain geolocation and create an instance of IPAddress in one step
const ipAddress2 = await IPAddress.fromString("80.80.128.0", geoLocator);

console.log(ipAddress1);
`````

TypeScript support
---
You need TypeScript version >= 4.7 in order the paths exported by the module to be resolved.
