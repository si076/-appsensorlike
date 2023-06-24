import {AppsensorEntity} from '../core.js'

/**
 * General object representing geo-location. 
 */
 class GeoLocation extends AppsensorEntity {

	protected latitude: number = 0.0;
	protected longitude: number = 0.0;
	
	public constructor(latitude: number, longitude: number) {
		super();
		this.setLatitude(latitude);
		this.setLongitude(longitude);
	}
	
	public getLatitude(): number {
		return this.latitude;
	}

	public setLatitude(latitude: number): GeoLocation {
		this.latitude = latitude;
		
		return this;
	}

	public getLongitude(): number {
		return this.longitude;
	}

	public setLongitude(longitude: number): GeoLocation {
		this.longitude = longitude;
		
		return this;
	}
	
	public override equals(obj: Object | null): boolean {
		if (!super.equals(obj))
			return false;
		if (this === obj)
			return true;
		
		const other: GeoLocation = obj as GeoLocation;
		
		return this.latitude === other.getLatitude() &&
			   this.longitude === other.getLongitude();
	}
	
}

/**
 * A geo-locator performs a lookup of an IP address and converts it to a {@link GeoLocation}. 
 * 
 * Different implementations will use different geo-location libraries.
 * 
 * In contrast to the ORIGINAL code here methods are asynchronous returning Promise<T>.
 */
 interface GeoLocator {
	
	/**
	 * Perform a lookup of an IP address and return a {@link GeoLocation}.
	 * 
	 * @param address IP address to geolocate
	 * 
	 * @return populated {@link GeoLocation} object.
	 */
	readLocation(address: string): Promise<GeoLocation | null>;
}

export {GeoLocation, GeoLocator};