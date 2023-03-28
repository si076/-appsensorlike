import {AppsensorEntity} from '../core.js'

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

	// @Override
	// public int hashCode() {
	// 	return new HashCodeBuilder(17,31).
	// 			append(latitude).
	// 			append(longitude).
	// 			toHashCode();
	// }
	
	public override equals(obj: Object | null): boolean {
		if (!super.equals(obj))
			return false;
		if (this === obj)
			return true;
		
		const other: GeoLocation = obj as GeoLocation;
		
		return this.latitude === other.getLatitude() &&
			   this.longitude === other.getLongitude();
	}
	
	// @Override
	// public String toString() {
	// 	return new ToStringBuilder(this).
	// 			append("latitude", latitude).
	// 			append("longitude", longitude).
	// 		    toString();
	// }
	
}

interface GeoLocator {
	
	/**
	 * Perform a lookup of an IP address and return a {@link GeoLocation}.
	 * 
	 * @param address IP address to geolocate
	 * 
	 * @return populated {@link GeoLocation} object.
	 */
	// public GeoLocation readLocation(InetAddress address);
	readLocation(address: string): Promise<GeoLocation | null>;
}

export {GeoLocation, GeoLocator};