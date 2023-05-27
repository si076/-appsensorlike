import ipaddrlib from 'ipaddr.js';
import { AccessController, Action, Role } from './accesscontrol/accesscontrol.js';
import { AttackAnalysisEngine, EventAnalysisEngine, ResponseAnalysisEngine } from './analysis/analysis.js';
import { ClientConfiguration } from './configuration/client/client_configuration.js';
import { ServerConfiguration } from './configuration/server/server_configuration.js';
import { SearchCriteria } from './criteria/criteria.js';
import { EventManager } from './event/event.js';
import {GeoLocation, GeoLocator} from './geolocation/geolocation.js';
import { ResponseHandler, UserManager } from './response/response.js';
import {Rule} from './rule/rule.js'
import { AttackStore, EventStore, ResponseStore } from './storage/storage.js';

class ObjectValidationError extends Error {

	invalidObj: Object;

	constructor(message: string, invalidObj: Object) {
		super(message);
		this.invalidObj = invalidObj;
	}
}

interface IEquals {

	equals(obj: Object | null | undefined): boolean

}

interface IValidateInitialize {

	/** 
	 * Check the validity of object's fields' values 
	 * after it has been loaded by JSON.parse (configuration file) or 
	 * a db's table  
	 */
	 checkValidInitialize(): void;
}

interface IAppsensorEntity extends IEquals, IValidateInitialize {

   getId(): string | undefined;

   setId(id: string): void;
}

class AppsensorEntity implements IAppsensorEntity {

	protected id?: string | undefined;

	public  getId(): string | undefined {
		return this.id;
	}

	public setId(id: string | undefined): void {
		this.id = id;
	}

	public equals(obj: Object | null | undefined): boolean {
		if (obj === null || obj === undefined)
			return false;
		if (this.constructor.name !== obj.constructor.name)
			return false;
		
		return true;	
	}

	checkValidInitialize(): void {
	}
}

class KeyValuePair extends AppsensorEntity {
	
	private key: string;
    private value: string;

    public constructor(key: string = '', value: string = '') {
		super();
    	this.key = key;
    	this.value = value;
    }

	public getKey(): string {
		return this.key;
	}

	public setKey(key: string): void {
		this.key = key;
	}

	public getValue(): string {
		return this.value;
	}

	public setValue(value: string): void {
		this.value = value;
	}

    public override equals(other: Object | null): boolean {
		if (!super.equals(other))
			return false;
		if (this === other)
			return true;

		let otherPair = other as KeyValuePair;
		return this.key === otherPair.key  && this.value === otherPair.value;
    }

	public override checkValidInitialize(): void {
		if (this.key.trim().length === 0) {
			throw new ObjectValidationError("key cannot be empty string", this);
		}
		if (this.value.trim().length === 0) {
			throw new ObjectValidationError("value cannot be empty string", this);
		}
	}

	// public toString(): string {
	// 	return new ToStringBuilder(this)
	// 			.append("id", id)
	// 			.append("key", key)
	// 			.append("value", value)
	// 			.toString();
	// }

}

enum INTERVAL_UNITS {
	"MILLISECONDS" = "milliseconds",
	"SECONDS" = "seconds",
	"MINUTES" = "minutes",
	"HOURS" = "hours",
	"DAYS" = "days"
}

class Interval extends AppsensorEntity {

	/** 
	 * Duration portion of interval, ie. '3' if you wanted 
	 * to represent an interval of '3 minutes' 
	 */
	private duration: number = 0;
	
	/** 
	 * Unit portion of interval, ie. 'minutes' if you wanted 
	 * to represent an interval of '3 minutes'.
	 * Constants are provided in the Interval class for the 
	 * units supported by the reference implementation, ie.
	 * SECONDS, MINUTES, HOURS, DAYS.
	 */
	private unit: INTERVAL_UNITS = INTERVAL_UNITS.MINUTES;

	public constructor(duration: number = 0, unit: INTERVAL_UNITS = INTERVAL_UNITS.MINUTES) {
		super();
		if (duration === 0) {
			// console.warn("Interval's duration is 0");
		}
		this.setDuration(duration);
		this.setUnit(unit);
	}
	
	public getDuration(): number {
		return this.duration;
	}

	public setDuration(duration: number): Interval {
		this.duration = duration;
		return this;
	}
	
	public getUnit(): string {
		return this.unit;
	}

	public setUnit(unit: INTERVAL_UNITS): Interval {
		this.unit = unit;
		return this;
	}
	
	public toMillis(): number {
		let millis: number = 0;
		
		if (INTERVAL_UNITS.MILLISECONDS === this.getUnit()) {
			millis = this.getDuration();
		} else if (INTERVAL_UNITS.SECONDS === this.getUnit()) {
			millis = 1000 * this.getDuration();
		} else if (INTERVAL_UNITS.MINUTES === this.getUnit()) {
			millis = 1000 * 60 * this.getDuration();
		} else if (INTERVAL_UNITS.HOURS === this.getUnit()) {
			millis = 1000 * 60 * 60 * this.getDuration();
		} else if (INTERVAL_UNITS.DAYS === this.getUnit()) {
			millis = 1000 * 60 * 60 * 24 * this.getDuration();
		} 
		
		return millis;
	}
	
	public override equals(obj: Object | null): boolean {
		if (!super.equals(obj))
			return false;
		if (this === obj)
			return true;
		
		const other:Interval = obj as Interval;
		
		return this.duration === other.getDuration() && this.unit === other.getUnit();
	}
	
	public override checkValidInitialize(): void {
		if (this.duration < 0) {
			throw new ObjectValidationError("duration cannot be negative", this);
		}

        const units = Object.values(INTERVAL_UNITS);
        if (units.indexOf(this.unit) === -1) {
			throw new ObjectValidationError("unit is not of INTERVAL_UNITS", this);
		}
	}
	// @Override
	// public String toString() {
	// 	return new ToStringBuilder(this).
	// 		       append("duration", duration).
	// 		       append("unit", unit).
	// 		       toString();
	// }
	
}

class Threshold extends AppsensorEntity {

	/** The count at which this threshold is triggered. */
	private count: number = 0;
	
	/** 
	 * The time frame within which 'count' number of actions has to be detected in order to
	 * trigger this threshold.
	 */
	private interval: Interval | null = null;

	public constructor(count: number = 0, interval: Interval | null = null) {
		super();
		this.setCount(count);
		this.setInterval(interval);
	}

	public getCount(): number {
		return this.count;
	}

	public setCount(count: number): Threshold {
		this.count = count;
		return this;
	}

	public getInterval(): Interval  | null {
		return this.interval;
	}

	public setInterval(interval: Interval  | null): Threshold {
		this.interval = interval;
		return this;
	}
	
	public override equals(obj: Object | null): boolean {
		if (!super.equals(obj))
			return false;
		if (this === obj)
			return true;
		
		const other: Threshold = obj as Threshold;
		
		return this.count === other.getCount() && 
			   Utils.equalsEntitys(this.interval, other.getInterval());
	}

	public override checkValidInitialize(): void {
		if (this.count < 0) {
			throw new ObjectValidationError("count cannot be negative", this);
		}
		if (this.interval) {
			this.interval.checkValidInitialize();
		}
	}
	// @Override
	// public String toString() {
	// 	return new ToStringBuilder(this).
	// 		       append("count", count).
	// 		       append("interval", interval).
	// 		       toString();
	// }
	
}

class Response  extends AppsensorEntity {
	
	/** User the response is for */
	private user?: User | null | undefined;
	
	/** When the event occurred */
	private timestamp?: Date | undefined;
	
	/** String representing response action name */
	private action: string = '';
	
	/** Interval response should last for, if applicable. Ie. block access for 30 minutes */
	private interval?: Interval | null | undefined;

	/** Client application name that response applies to. */
	private detectionSystem?: DetectionSystem | null | undefined;
	
	/** Represent extra metadata, anything client wants to send */
	private metadata?: KeyValuePair[] | undefined;
	
	private active?: boolean;

	/** ADDITION TO THE ORIGINAL CODE TO TRACE WHAT CAUSED THIS RESPONSE
	 *  ESSENTIAL FOR REPORTING
	 *  Detection Point that was triggered */
	private detectionPoint: DetectionPoint | null = null;

	/** ADDITION TO THE ORIGINAL CODE TO TRACE WHAT CAUSED THIS RESPONSE
	 *  ESSENTIAL FOR REPORTING
	 *  Rule that was triggered */
	private rule: Rule | null = null;

	
	public constructor(user: User | null | undefined = undefined, 
		               action: string = '', 
					   timestamp: Date | undefined = undefined, 
					   detectionSystem: DetectionSystem | null | undefined = undefined, 
					   interval: Interval | null | undefined = undefined) {
		super();
		if (user !== undefined) {
			this.user = user;
		}

		this.action = action;

		if (timestamp !== undefined) {
			this.timestamp = timestamp;
		}

		if (detectionSystem !== undefined) {
			this.detectionSystem = detectionSystem;
		}

		if (interval !== undefined) {
			this.interval = interval;
		}
	}
	
	public getUser(): User | null | undefined {
		return this.user;
	}

	public setUser(user: User | null | undefined): Response {
		this.user = user;
		return this;
	}

	public getTimestamp(): Date | undefined {
		return this.timestamp;
	}

	public setTimestamp(timestamp: Date | undefined): Response {
		if (timestamp) {
			this.timestamp = new Date(timestamp);
		} else {
			this.timestamp = new Date();
		}
		return this;
	}

	public getAction(): string {
		return this.action;
	}

	public setAction(action: string): Response {
		this.action = action;
		return this;
	}

	public getInterval(): Interval | null | undefined {
		return this.interval;
	}

	public setInterval(interval: Interval | null | undefined): Response {
		this.interval = interval;
		return this;
	}

	public getDetectionSystem(): DetectionSystem | null | undefined {
		return this.detectionSystem;
	}

	public setDetectionSystem(detectionSystem: DetectionSystem | null | undefined): Response {
		this.detectionSystem = detectionSystem;
		return this;
	}
	
	public getMetadata(): KeyValuePair[] | undefined {
		return this.metadata;
	}

	public setMetadata(metadata: KeyValuePair[]): void {
		this.metadata = metadata;
	}
	
	public isActive(): boolean {
		
		// if there is no interval, the response is executed immediately and hence does not have active/inactive state
		if (this.interval === null || this.interval === undefined || 
			this.timestamp === undefined) {
			return false;
		}
		
		let localActive: boolean = false;
		
		
		const responseStartTime = this.timestamp;
		const responseEndTime = new Date(responseStartTime.getTime() + this.interval.toMillis());
		
		const now = Date.now();
		
		// only active if current time between response start and end time
		if (responseStartTime.getTime() < now && responseEndTime.getTime() > now) {
			localActive = true;
		}
		
		this.active = localActive;
		
		return this.active;
	}
	
	public getDetectionPoint(): DetectionPoint | null {
		return this.detectionPoint;
	}

	public setDetectionPoint(detectionPoint: DetectionPoint | null): Response {
		this.detectionPoint = detectionPoint;
		return this;
	}

	public getRule(): Rule | null {
		return this.rule;
	}

	public setRule(rule: Rule | null): Response {
		this.rule = rule;
		return this;
	}

	public override equals(obj: Object | null): boolean {
		if (!super.equals(obj)) {
			return false;
		}
		
		const other = obj as Response;
		
		const otherTimestamp = other.getTimestamp();
		return Utils.equalsEntitys(this.user, other.getUser()) &&
			   ((this.timestamp === null && otherTimestamp === null) ||
			    (this.timestamp === undefined && otherTimestamp === undefined) ||	
			    (this.timestamp instanceof Date &&  otherTimestamp instanceof Date && 
				 this.timestamp.getTime() === otherTimestamp.getTime())) &&
			   this.action === other.getAction() && 
			   Utils.equalsEntitys(this.interval, other.getInterval()) &&
			   Utils.equalsEntitys(this.detectionSystem, other.getDetectionSystem()) &&
			   Utils.equalsArrayEntitys(this.metadata, other.getMetadata()) &&
			   Utils.equalsEntitys(this.detectionPoint, other.getDetectionPoint()) &&
			   Utils.equalsEntitys(this.rule, other.getRule());
	}
	
	public override checkValidInitialize(): void {
		if (this.action.trim().length === 0) {
			throw new ObjectValidationError("action cannot be empty string", this);
		}

		if (this.user) {
			this.user.checkValidInitialize();
		}

		if (this.detectionSystem) {
			this.detectionSystem.checkValidInitialize();
		}

		if (this.interval) {
			this.interval.checkValidInitialize();
		}
		
		if (this.metadata) {
			this.metadata.forEach(element => {
				element.checkValidInitialize();
			});
		}

		if (this.detectionPoint === undefined) {
			this.detectionPoint = null;
		}
		
		if (this.rule === undefined) {
			this.rule = null;
		}
		
	}
	// @Override
	// public String toString() {
	// 	return new ToStringBuilder(this).
	// 		       append("user", user).
	// 		       append("timestamp", timestamp).
	// 		       append("action", action).
	// 		       append("interval", interval).
	// 		       append("detectionSystem", detectionSystem).
	// 		       append("metadata", metadata).
	// 		       toString();
	// }
	
}


class Category {
	public static REQUEST 				= "Request";
	public static AUTHENTICATION 		= "Authentication";
	public static SESSION_MANAGEMENT 	= "Session Management";
	public static ACCESS_CONTROL 		= "Access Control";
	public static INPUT_VALIDATION 	= "Input Validation";
	public static OUTPUT_ENCODING 		= "Output Encoding";
	public static COMMAND_INJECTION 	= "Command Injection";
	public static FILE_IO 				= "File IO";
	public static HONEY_TRAP 			= "Honey Trap";
	public static USER_TREND 			= "User Trend";
	public static SYSTEM_TREND 		= "System Trend";
	public static REPUTATION 			= "Reputation";
}

class DetectionPoint  extends AppsensorEntity {

	protected guid?: string | undefined;

	/**
	 * Category identifier for the detection point. (ex. "Request", "AccessControl", "SessionManagement")
	 */
	private category: string = '';

	/**
	 * Identifier for the detection point. (ex. "IE1", "RE2")
	 */
	private label?: string | undefined;

	/**
	 * {@link Threshold} for determining whether given detection point (associated {@link Event})
	 * should be considered an {@link Attack}.
	 */
	private threshold: Threshold  | null = null;

	/**
	 * Set of {@link Response}s associated with given detection point.
	 */
	private responses: Response[] = [];

	public constructor(category: string = '', 
					   label: string | undefined = undefined, 
	                   threshold: Threshold  | null = null, 
					   responses: Response[] = [], 
					   guid: string | undefined = undefined
					   ) {
		super();
		this.category = category;

		this.label = label;
		//here we set id as well since it hasn't been set so far
		this.id = this.label;

		this.threshold = threshold;
		this.responses = responses;

		if (guid !== undefined) {
			this.guid = guid;
		}
	}

	public getCategory(): string {
		return this.category;
	}

	// public setCategory(category: string): DetectionPoint {
	// 	this.category = category;
	// 	return this;
	// }

	public getLabel(): string | undefined {
		return this.label;
	}

	public setLabel(label: string | undefined): DetectionPoint {
		this.label = label;
		return this;
	}

	public getGuid(): string | undefined {
		return this.guid;
	}

	public setGuid(guid: string): void {
		this.guid = guid;
	}

	public  getThreshold(): Threshold  | null {
		return this.threshold;
	}

	public setThreshold(threshold: Threshold  | null): DetectionPoint {
		this.threshold = threshold;
		return this;
	}

	public getResponses(): Response[] {
		return this.responses;
	}

	public setResponses(responses: Response[]): DetectionPoint {
		this.responses = responses;
		return this;
	}

	public typeMatches(other: DetectionPoint): boolean {
		if (other == null) {
			throw new Error("other must be non-null");
		}

		let matches: boolean = true;

		matches &&= (this.category !== null) ? this.category === other.getCategory() : true;
		matches &&= (this.label) ? this.label === other.getLabel() : true;

		return matches;
	}

	public typeAndThresholdMatches(other: DetectionPoint): boolean {
		if (other == null) {
			throw new Error("other must be non-null");
		}

		let matches: boolean = true;

		matches &&= (this.category !== null) ? this.category === other.getCategory() : true;
		matches &&= (this.label) ? this.label === other.getLabel() : true;
		matches &&= (this.threshold !== null) ? Utils.equalsEntitys(this.threshold, other.getThreshold()) : true;

		return matches;
	}

	public override equals(obj: Object | null): boolean {
		if (!super.equals(obj))
			return false;
		if (this === obj)
			return true;

		const other = obj as DetectionPoint;

		return this.category === other.getCategory() &&
		       this.label === other.getLabel() &&
			   Utils.equalsEntitys(this.threshold, other.getThreshold()) &&
			   Utils.equalsArrayEntitys(this.responses, other.getResponses()) &&
			   this.guid === other.getGuid();
	}

	public override checkValidInitialize(): void {
		if (this.category.trim().length === 0) {
			throw new ObjectValidationError('category cannot be empty string!', this);
		}

		//label can be empty when it is read from a configuration
		//but in this case it is set to be equal to id
		//for more details about that change in the original java code 
		//see https://github.com/jtmelton/appsensor/issues/18
		if (this.label && this.label.trim().length === 0) {
			throw new ObjectValidationError('label cannot be empty string!', this);
		}

		if (this.guid && this.guid.trim().length === 0) {
			throw new ObjectValidationError('guid, when defined, cannot be empty string', this);
		}

		if (this.threshold) {
			this.threshold.checkValidInitialize();
		}

	}
	// @Override
	// public String toString() {
	// 	return new ToStringBuilder(this).
	// 			   append("category", category).
	// 		       append("label", label).
	// 		       append("threshold", threshold).
	// 		       append("responses", responses).
	// 		       append("guid", guid).
	// 		       toString();
	// }
}

class IPAddress extends AppsensorEntity {

	private address: string = '';
	
	private geoLocation: GeoLocation  | null = null;

	public constructor(address: string = '', 
	                   geoLocation: GeoLocation  | null = null) {
		super();
		this.address = address.trim();
		this.geoLocation = geoLocation;

		this.address = IPAddress.localhostToAddress(this.address);
	}

	public static localhostToAddress(address: string): string {
		if (address.trim().toLowerCase() === "localhost") {
			return "127.0.0.1";
		}
		return address;
	}
	
	public static async fromString(ipString: string, geoLocator: GeoLocator | null = null): Promise<IPAddress> {
		ipString = IPAddress.localhostToAddress(ipString);

		if (!ipaddrlib.isValid(ipString)) {
			throw new Error("IP Address string is invalid: " + ipString);
		}

		let geoLocation: GeoLocation | null = null;
		if (geoLocator) {
			geoLocation = await geoLocator.readLocation(ipString);
		}

		return new IPAddress(ipString, geoLocation);
	}
	
	public setAddress(address: string): IPAddress {
		this.address = address;
		
		return this;
	}

	public getAddress(): string {
		return this.address;
	}
	
	public getGeoLocation(): GeoLocation  | null {
		return this.geoLocation;
	}
	
	public setGeoLocation(geoLocation: GeoLocation | null): IPAddress {
		this.geoLocation = geoLocation;
		
		return this;
	}

	public equalAddress(otherAddress: string): boolean {
		let equal = false;
		if (this.address.trim().length === 0 && otherAddress.trim().length === 0) {
			equal = true;
		} else {
			otherAddress = otherAddress.trim();

			otherAddress = IPAddress.localhostToAddress(otherAddress);

			try {

				const _address = ipaddrlib.process(this.address);
				const _otherAddress = ipaddrlib.process(otherAddress);

				if (_address instanceof ipaddrlib.IPv4 && _otherAddress instanceof ipaddrlib.IPv4) {
					equal = _address.toString() === _otherAddress.toString()
				} else if (_address instanceof ipaddrlib.IPv6 && _otherAddress instanceof ipaddrlib.IPv6) {
					equal = _address.toNormalizedString() === _otherAddress.toNormalizedString();
				}
			} catch (error) {
				console.error(`Cannot compare for equality addresses: '${this.address}' and '${otherAddress}'`);
				console.error(`${(error as Error).message}`);			
			}
		}

		return equal;
	}
	
	public override equals(obj: Object | null): boolean {
		if (!super.equals(obj))
			return false;
		if (this === obj)
			return true;
		
		const other: IPAddress = obj as IPAddress;
		
		return this.equalAddress(other.getAddress()) &&
		       Utils.equalsEntitys(this.geoLocation, other.getGeoLocation());
	}
	
	public override checkValidInitialize(): void {
		this.address = IPAddress.localhostToAddress(this.address);

		if (!ipaddrlib.isValid(this.address)) {
			throw new ObjectValidationError("IP Address string is invalid: " + this.address, this);
		}
		
		if (this.geoLocation) {
			this.geoLocation.checkValidInitialize();
		}
	}
	// @Override
	// public String toString() {
	// 	return new ToStringBuilder(this).
	// 			append("address", address).
	// 			append("geoLocation", geoLocation).
	// 		    toString();
	// }
	
}

class DetectionSystem extends AppsensorEntity {

	private detectionSystemId: string = '';
	
	private ipAddress: IPAddress  | null = null;
	
	public constructor(detectionSystemId: string = '', ipAddress: IPAddress  | null = null) {
		super();
		this.setIPAddress(ipAddress);
		this.setDetectionSystemId(detectionSystemId);
	}
	
	public getDetectionSystemId(): string {
		return this.detectionSystemId;
	}

	public setDetectionSystemId(detectionSystemId: string): DetectionSystem {
		this.detectionSystemId = detectionSystemId;
		
		// This logic is outside now, allowing asynchronous resolution of location
		// 
		// // if IP is used as system id, setup IP address w/ geolocation
		// if (this.ipAddress === null && this.locator != null && ipaddrlib.isValid(detectionSystemId)) { //InetAddresses.isInetAddress(detectionSystemId)) {
		// 	this.ipAddress = this.locator.fromString(detectionSystemId);
		// }
		
		return this;
	}

	public getIPAddress(): IPAddress  | null {
		return this.ipAddress;
	}

	public setIPAddress(ipAddress: IPAddress  | null): DetectionSystem {
		this.ipAddress = ipAddress;
		
		return this;
	}
	
	public override equals(obj: Object | null): boolean {
		if (!super.equals(obj))
			return false;
		if (this === obj)
			return true;
		
		const other: DetectionSystem = obj as DetectionSystem;
		
		return this.detectionSystemId === other.getDetectionSystemId();
	}
	
	public override checkValidInitialize(): void {
		
		if (this.ipAddress) {
			this.ipAddress.checkValidInitialize();
		}
	}
	// @Override
	// public String toString() {
	// 	return new ToStringBuilder(this).
	// 			append("detectionSystemId", detectionSystemId).
	// 			append("ipAddress", ipAddress).
	// 		    toString();
	// }
	
}

class User extends AppsensorEntity {

	private username: string = '';
	
	private ipAddress: IPAddress | null = null;
	
	public constructor(username: string = '', ipAddress: IPAddress | null = null) {
		super();
		//set ip first so the setUsername call to geolocate won't run if it's already explicitly set
		this.setIPAddress(ipAddress);
		this.setUsername(username);
	}

	public getUsername(): string {
		return this.username;
	}

	public setUsername(username: string): User {
		this.username = username;
		
		// This logic is outside now, allowing asynchronous resolution of location
		// 
		// // if IP is used as username, setup IP address w/ geolocation
		// if (this.locator != null && this.ipAddress == null && ipaddrlib.isValid(username)) {
		// 	this.ipAddress = this.locator.fromString(username);
		// }
		
		return this;
	}
	
	public getIPAddress(): IPAddress | null {
		return this.ipAddress;
	}
	
	public setIPAddress(ipAddress: IPAddress | null): User {
		this.ipAddress = ipAddress;
		
		return this;
	}
	
	public override equals(obj: Object | null | undefined): boolean {
		if (!super.equals(obj))
			return false;
		if (this === obj)
			return true;
		
		const other: User = obj as User;
		
		return this.username === other.getUsername();
	}
	
	public override checkValidInitialize(): void {
		
		if (this.ipAddress) {
			this.ipAddress.checkValidInitialize();
		}
	}
	// @Override
	// public String toString() {
	// 	return new ToStringBuilder(this).
	// 			append("username", username).
	// 			append("ipAddress", ipAddress).
	// 		    toString();
	// }
	
}

class Resource extends AppsensorEntity {
	
	/** 
	 * The resource being requested when a given event/attack was triggered, which can be used 
     * later to block requests to a given function.  In this implementation, 
     * the current request URI is used.
     */
	private location: string = '';

	/**
	 * The method used to request the resource. In terms of HTTP this would be GET/POST/PUT/etc.
	 * In the case, in which the resources specifies an object this could be the invoked object method.
	 */
	private method: string = '';

	constructor(location: string = '', method: string = '') {
		super();
		this.location = location;
		this.method = method;
	}

	public getLocation(): string {
		return this.location;
	}

	public  setLocation(location: string): void {
		this.location = location;
	}

	public getMethod(): string {
		return this.method;
	}

	public setMethod(method: string): void {
		this.method = method;
	}

	public override equals(obj: Object | null): boolean {
		if (!super.equals(obj))
			return false;
		if (this === obj)
			return true;

		const other: Resource = obj as Resource;

		return this.location === other.getLocation() && this.method === other.getMethod();
	}

	public override checkValidInitialize(): void {
		if (this.location.trim().length === 0) {
			throw new ObjectValidationError('location cannot be empty string!', this);
		}

		if (this.method.trim().length === 0) {
			throw new ObjectValidationError('method cannot be empty string!', this);
		}
	}
}

class AppSensorEvent extends AppsensorEntity {

	/** User who triggered the event, could be anonymous user */
	private user: User | null = null;

	/** Detection Point that was triggered */
	private detectionPoint: DetectionPoint | null = null;

	/** When the event occurred */
	private timestamp: Date = new Date();

	/**
	 * Identifier label for the system that detected the event.
	 * This will be either the client application, or possibly an external
	 * detection system, such as syslog, a WAF, network IDS, etc.  */
	private detectionSystem: DetectionSystem | null = null;

	/**
	 * The resource being requested when the event was triggered, which can be used
     * later to block requests to a given function.
     */
    private resource: Resource | null = null;

	/** Represent extra metadata, anything client wants to send */
	private metadata: KeyValuePair[] = [];

	public constructor(user: User | null = null, 
		               detectionPoint: DetectionPoint | null = null, 
					   detectionSystem: DetectionSystem | null = null, 
					   timestamp: Date | null = null) {
		super();
		this.setUser(user);
		this.setDetectionPoint(detectionPoint);
		this.setTimestamp(timestamp);
		this.setDetectionSystem(detectionSystem);
	}

	public getUser(): User | null {
		return this.user;
	}

	public setUser(user: User | null): AppSensorEvent {
		this.user = user;
		return this;
	}

	public getDetectionPoint(): DetectionPoint | null {
		return this.detectionPoint;
	}

	public setDetectionPoint(detectionPoint: DetectionPoint | null): AppSensorEvent {
		this.detectionPoint = detectionPoint;
		return this;
	}

	public getTimestamp(): Date {
		return this.timestamp;
	}

	public setTimestamp(timestamp: Date | null): AppSensorEvent {
		if (timestamp) {
			this.timestamp = new Date(timestamp);
		} else {
			this.timestamp = new Date();
		}
		return this;
	}

	public getDetectionSystem(): DetectionSystem | null {
		return this.detectionSystem;
	}

	public setDetectionSystem(detectionSystem: DetectionSystem | null): AppSensorEvent {
		this.detectionSystem = detectionSystem;
		return this;
	}

	public getResource(): Resource | null {
		return this.resource;
	}

	public  setResource(resource: Resource | null): AppSensorEvent {
		this.resource = resource;
		return this;
	}

	public getMetadata(): KeyValuePair[] {
		return this.metadata;
	}

	public setMetadata(metadata: KeyValuePair[] ): void {
		this.metadata = metadata;
	}

	public static getTimeAscendingComparator(e1: AppSensorEvent, e2: AppSensorEvent) {
		if (e1 === null || e2 === null) {
			throw new Error('e1 and e2 cannot be null');
		} 

		if (e1.getTimestamp().getTime() < e2.getTimestamp().getTime()) {
			return -1;
		}
		else if (e1.getTimestamp().getTime() > e2.getTimestamp().getTime()) {
			return 1;
		}
		else {
			return 0;
		}
	}

	public override equals(obj: Object | null): boolean {
		if (!super.equals(obj))
			return false;
		if (this === obj)
			return true;

		const other: AppSensorEvent = obj as AppSensorEvent;

		return Utils.equalsEntitys(this.user, other.getUser()) &&
			   Utils.equalsEntitys(this.detectionPoint, other.getDetectionPoint()) &&	
			   this.timestamp.getTime() === other.getTimestamp().getTime() &&
			   Utils.equalsEntitys(this.detectionSystem, other.getDetectionSystem()) &&
			   Utils.equalsEntitys(this.resource, other.getResource()) &&
			   Utils.equalsArrayEntitys(this.metadata, other.getMetadata());
	}

	public override checkValidInitialize(): void {
		if (this.user) {
			this.user.checkValidInitialize();
		}

		if (this.detectionSystem) {
			this.detectionSystem.checkValidInitialize();
		}

		if (this.detectionPoint) {
			this.detectionPoint.checkValidInitialize();
		}

		if (this.resource) {
			this.resource.checkValidInitialize();
		}

		if (this.metadata) {
			this.metadata.forEach(element => {
				element.checkValidInitialize();
			});
		} else {
			this.metadata = [];
		}
	}
	// @Override
	// public String toString() {
	// 	return new ToStringBuilder(this).
	// 			append("user", user).
	// 			append("detectionPoint", detectionPoint).
	// 			append("timestamp", timestamp).
	// 			append("detectionSystem", detectionSystem).
	// 			append("resource", resource).
	// 			append("metadata", metadata).
	// 		    toString();
	// }
}

class Attack extends AppsensorEntity {

	/** User who triggered the attack, could be anonymous user */
	private user: User | null = null;

	/** Detection Point that was triggered */
	private detectionPoint: DetectionPoint | null = null;

	/** When the attack occurred */
	private timestamp: Date = new Date();

	/**
	 * Identifier label for the system that detected the attack.
	 * This will be either the client application, or possibly an external
	 * detection system, such as syslog, a WAF, network IDS, etc.  */
	private detectionSystem: DetectionSystem | null = null;

	/**
	 * The resource being requested when the attack was triggered, which can be used
     * later to block requests to a given function.
     */
    private resource: Resource | null = null;

	/** Rule that was triggered */
	private rule: Rule | null = null;

	/** Represent extra metadata, anything client wants to send */
	private metadata: KeyValuePair[] = [];

	public constructor(event: AppSensorEvent | null = null, 
		               user: User | null = null, 
					   detectionPoint: DetectionPoint | null = null, 
					   timestamp: Date | null = null, 
					   detectionSystem: DetectionSystem | null = null, 
					   resource: Resource | null = null) {
		super();
		if (event) {
			this.setUser(event.getUser());
			this.setDetectionPoint(event.getDetectionPoint());
			this.setTimestamp(event.getTimestamp());
			this.setDetectionSystem(event.getDetectionSystem());
			this.setResource(event.getResource());
		} else {
			this.setUser(user);
			this.setDetectionPoint(detectionPoint);
			this.setTimestamp(timestamp);
			this.setDetectionSystem(detectionSystem);
			this.setResource(resource);
		}
	}

	public getUser(): User | null {
		return this.user;
	}

	public setUser(user: User | null): Attack {
		this.user = user;
		return this;
	}

	public getDetectionPoint(): DetectionPoint | null {
		return this.detectionPoint;
	}

	public setDetectionPoint(detectionPoint: DetectionPoint | null): Attack {
		this.detectionPoint = detectionPoint;
		return this;
	}

	public getTimestamp(): Date {
		return this.timestamp;
	}

	public setTimestamp(timestamp: Date | null): Attack {
		if (timestamp) {
			this.timestamp = new Date(timestamp);
		} else {
			this.timestamp = new Date();
		}
		
		return this;
	}

	public getDetectionSystem(): DetectionSystem | null {
		return this.detectionSystem;
	}

	public setDetectionSystem(detectionSystem: DetectionSystem | null): Attack {
		this.detectionSystem = detectionSystem;
		return this;
	}

	public getResource(): Resource | null {
		return this.resource;
	}

	public setResource(resource: Resource | null): Attack {
		this.resource = resource;
		return this;
	}

	public getRule(): Rule | null {
		return this.rule;
	}

	public setRule(rule: Rule | null): Attack {
		this.rule = rule;
		return this;
	}

	public getMetadata(): KeyValuePair[] {
		return this.metadata;
	}

	public setMetadata(metadata: KeyValuePair[]): void {
		this.metadata = metadata;
	}

	public  getName(): string | undefined {
		let name: string | undefined = "";

		if (this.rule === null) {
			name = Utils.getDetectionPointLabel(this.detectionPoint);
		} else if (this.rule) {
			name = this.rule.getName() == null ? this.rule.getGuid() : this.rule.getName();
		}

		return name;
	}

	public override equals(obj: Object): boolean {
		if (!super.equals(obj))
			return false;
		if (this === obj)
			return true;

		const other: Attack = obj as Attack;

		return Utils.equalsEntitys(this.user, other.getUser()) &&
			   Utils.equalsEntitys(this.detectionPoint, other.getDetectionPoint()) &&
			   this.timestamp.getTime() === other.getTimestamp().getTime() &&
			   Utils.equalsEntitys(this.detectionSystem, other.getDetectionSystem()) &&
			   Utils.equalsEntitys(this.resource, other.getResource()) &&
			   Utils.equalsEntitys(this.rule, other.getRule()) &&
			   Utils.equalsArrayEntitys(this.metadata, other.getMetadata());
	}

	public override checkValidInitialize(): void {
		if (this.user) {
			this.user.checkValidInitialize();
		}

		if (this.detectionSystem) {
			this.detectionSystem.checkValidInitialize();
		}

		if (this.detectionPoint) {
			this.detectionPoint.checkValidInitialize();
		}

		if (this.resource) {
			this.resource.checkValidInitialize();
		}

		if (this.rule) {
			this.rule.checkValidInitialize();
		}

		if (this.metadata) {
			this.metadata.forEach(element => {
				element.checkValidInitialize();
			});
		} else {
			this.metadata = [];
		}
	}
	// @Override
	// public String toString() {
	// 	return new ToStringBuilder(this).
	// 		       append("user", user).
	// 		       append("detectionPoint", detectionPoint).
	// 		       append("rule", rule).
	// 		       append("timestamp", timestamp).
	// 		       append("detectionSystem", detectionSystem).
	// 		       append("resource", resource).
	// 		       append("metadata", metadata).
	// 		       toString();
	// }

}

interface RequestHandler {
	
	// APPSENSOR_CLIENT_APPLICATION_IDENTIFIER_ATTR: string = "APPSENSOR_CLIENT_APPLICATION_IDENTIFIER_ATTR";
	
	/**
	 * Add an Event.
	 * 
	 * @param event Event to add
	 */
	addEvent(event: AppSensorEvent): Promise<void>;
	
	/**
	 * Add an Attack
	 * @param attack Attack to add
	 */
	addAttack(attack: Attack): Promise<void>;
	
	/**
	 * Retrieve any responses generated that apply to this client application 
	 * since the last time the client application called this method.
	 *  
	 * @param earliest Timestamp in the http://tools.ietf.org/html/rfc3339 format
	 * @return a Collection of Response objects 
	 */
	getResponses(earliest: Date): Promise<Response[]>;
	
}

class ClientApplication implements IEquals {
	
	/** The name of the client application */
	private name: string = '';
	
	/** The collection of {@link Role}s associated with this client application */
	private roles: Role[] = [];

	/** The {@link IPAddress} of the client application, optionally set in the server configuration */
	private ipAddress?: IPAddress | undefined;
	
	constructor(name: string = '', roles: Role[] = []) {
		this.name = name;
		this.roles = roles;
	}

	public getName(): string {
		return this.name;
	}

	public setName(name: string): ClientApplication {
		this.name = name;
		return this;
	}

	public getRoles(): Role[] {
		return this.roles;
	}

	public getIPAddress(): IPAddress | undefined {
		return this.ipAddress;
	}

	public setIPAddress(ipAddress: IPAddress): ClientApplication {
		this.ipAddress = ipAddress;
		return this;
	}
	
	public equals(obj: Object | null): boolean {
		if (this === obj)
			return true;
		if (obj === null)
			return false;
		if (this.constructor.name !== obj.constructor.name)
			return false;

		const other: ClientApplication = obj as ClientApplication;

		let equals = this.name === other.getName() && 
		             Utils.equalsEntitys(this.ipAddress, other.getIPAddress());
		
		if (equals) {
			const _roles: Role[] = this.roles;
			_roles.sort();

			const _otherRoles: Role[] = other.getRoles();
			_otherRoles.sort();

			if (_roles.length === _otherRoles.length) {
				for (let i = 0; i < _roles.length; i++) {
					if (_roles[i] !== _otherRoles[i]) {
						return false;
					}
				}
			}

			return true;

		} else {
			return false;
		}
	}

}

class AppSensorClient {
	
	private configuration: ClientConfiguration | null = null;
	
	private eventManager: EventManager | null = null; 

	private responseHandler: ResponseHandler | null = null;
	
	private userManager: UserManager | null = null;
	
	public constructor() { }
	
	public getConfiguration(): ClientConfiguration | null {
		return this.configuration;
	}
	
	public setConfiguration(updatedConfiguration: ClientConfiguration | null): void {
		this.configuration = updatedConfiguration;
	}

	public getEventManager(): EventManager | null {
		return this.eventManager;
	}

	public setEventManager(eventManager: EventManager | null): void {
		this.eventManager = eventManager;
	}

	public getResponseHandler(): ResponseHandler | null {
		return this.responseHandler;
	}

	public setResponseHandler(responseHandler: ResponseHandler | null): void {
		this.responseHandler = responseHandler;
	}

	public getUserManager(): UserManager | null {
		return this.userManager;
	}

	public setUserManager(userManager: UserManager | null): void {
		this.userManager = userManager;
	}
	
}

class AppSensorServer {
	
	private configuration: ServerConfiguration | null = null;
	
	private eventStore: EventStore | null = null;
	
	private attackStore: AttackStore | null = null;
	
	private responseStore: ResponseStore | null = null;
	
	private eventAnalysisEngines: EventAnalysisEngine[] = [];
	
	private attackAnalysisEngines: AttackAnalysisEngine[] = [];
	
	private responseAnalysisEngines: ResponseAnalysisEngine[] = [];
	
	private accessController: AccessController | null = null;
	
	public constructor() { }
	
	/**
	 * Accessor for ServerConfiguration object
	 * @return ServerConfiguration object
	 */
	public getConfiguration(): ServerConfiguration | null {
		return this.configuration;
	}
	
	public setConfiguration(updatedConfiguration: ServerConfiguration | null): void {
		this.configuration = updatedConfiguration;
	}
	
	public getEventStore(): EventStore | null {
		return this.eventStore;
	}

	public getAttackStore(): AttackStore | null {
		return this.attackStore;
	}

	public getResponseStore(): ResponseStore | null {
		return this.responseStore;
	}

	public getEventAnalysisEngines(): EventAnalysisEngine[] {
		return this.eventAnalysisEngines;
	}

	public getAttackAnalysisEngines(): AttackAnalysisEngine[] {
		return this.attackAnalysisEngines;
	}
	
	public getResponseAnalysisEngines(): ResponseAnalysisEngine[] {
		return this.responseAnalysisEngines;
	}

	public getAccessController(): AccessController | null {
		return this.accessController;
	}
	
	public setEventStore(eventStore: EventStore | null): void {
		this.eventStore = eventStore;
	}

	public setAttackStore(attackStore: AttackStore | null): void {
		this.attackStore = attackStore;
	}

	public setResponseStore(responseStore: ResponseStore | null): void {
		this.responseStore = responseStore;
	}

	public setEventAnalysisEngines(eventAnalysisEngines: EventAnalysisEngine[]): void {
		this.eventAnalysisEngines = eventAnalysisEngines;
	}

	public setAttackAnalysisEngines(attackAnalysisEngines: AttackAnalysisEngine[]): void {
		this.attackAnalysisEngines = attackAnalysisEngines;
	}

	public setResponseAnalysisEngines(responseAnalysisEngines: ResponseAnalysisEngine[]): void {
		this.responseAnalysisEngines = responseAnalysisEngines;
	}
	
	public setAccessController(accessController: AccessController | null): void {
		this.accessController = accessController;
	}
	
}

class Utils {
	//expected entities of same type 
	public static equalsEntitys(ent1: IEquals | null | undefined, 
		                        ent2: IEquals | null | undefined): boolean {
		return (ent1 === ent2) ||
		       (ent1 !== null && ent1 !== undefined && ent1.equals(ent2))
	}

	public static equalsArrayEntitys(ent1: IEquals[] | null | undefined, 
		                             ent2: IEquals[] | null | undefined): boolean {
		if (ent1 === ent2) {
			return true;
		} else if (ent1 !== null && ent2 !== null && 
			       ent1 !== undefined && ent2 !== undefined &&
			       ent1.length === ent2.length) {
			//consider the arrays are sorted
			for (let i = 0; i < ent1.length; i++) {
				if (!ent1[i].equals(ent2[i])) {
					return false;
				}
			}

			return true;

		} else {
			return false;
		}
	}

	public static equalsOnProperties(obj1: Object | null | undefined, 
						 			 obj2: Object | null | undefined, 
									 propMap: Map<string, string[]>,
						 			 propertyNamesFunc: (obj: Object, propMap: Map<string, string[]>) => string[]): boolean {
		if (obj1 === obj2) {
			return true;
		}

		if (!(obj1 !== null && obj1 !== undefined &&
			  obj2 !== null && obj2 !== undefined)) {
			return false;
		}

		if (obj1.constructor.name !== obj2.constructor.name) {
			return false;
		}

		const properties = propertyNamesFunc(obj1, propMap);
		
		let equal = true;

		for (let index = 0; index < properties.length; index++) {
			const propName = properties[index];

			const propDescr1 = Object.getOwnPropertyDescriptor(obj1, propName);
			const propDescr2 = Object.getOwnPropertyDescriptor(obj2, propName);

			if (!propDescr1 && !propDescr2) {
				continue;
			}

			if ((propDescr1 && !propDescr2) || 
			    (!propDescr1 && propDescr2)) {
				equal = false;

				const val1 = propDescr1 ? propDescr1.value : undefined;
				const val2 = propDescr2 ? propDescr2.value : undefined; 
				// console.debug(`equalsOnProperties: class: ${obj1.constructor.name}, property: ${propName} '${val1}' <> '${val2}'`);

				break;
			}

			if (propDescr1!.value instanceof Array) {
				equal = Utils.equalsArrayEntitysOnProperties(propDescr1!.value, 
															 propDescr2!.value, 
															 propMap,
															 propertyNamesFunc);

			} else if (propDescr1!.value instanceof Object) {
				equal = Utils.equalsOnProperties(propDescr1!.value, 
					                             propDescr2!.value, 
												 propMap,
												 propertyNamesFunc);

			} else {
				equal = propDescr1!.value === propDescr2!.value;
			}

			if (!equal) {
				// console.debug(`equalsOnProperties: class: ${obj1.constructor.name}, property: ${propName} '${propDescr1!.value}' <> '${propDescr2!.value}'`);

				break;
			}
		}

		return equal;	
	}

	public static equalsArrayEntitysOnProperties(obj1: Object[] | null | undefined, 
		                             			 obj2: Object[] | null | undefined,
												 propMap: Map<string, string[]>,
												 propertyNamesFunc: (obj: Object, propMap: Map<string, string[]>) => string[]): boolean {
		if (obj1 === obj2) {
			return true;
		} else if (obj1 !== null && obj2 !== null && 
			       obj1 !== undefined && obj2 !== undefined &&
			       obj1.length === obj2.length) {
			//consider the arrays are sorted
			for (let i = 0; i < obj1.length; i++) {
				if (!Utils.equalsOnProperties(obj1[i], obj2[i], propMap, propertyNamesFunc)) {
					return false;
				}
			}

			return true;

		} else {
			return false;
		}
	}

	public static allOrOnlySpecifiedProperties(obj: Object | null | undefined, 
											   onlyPropertiesToCompareMap: Map<string, string[]>): string[] {
		let propertiesToCompare: string[] = [];
		if (obj) {
			propertiesToCompare = Object.getOwnPropertyNames(obj);

			let onlyPropertiesToCompare = onlyPropertiesToCompareMap.get(obj.constructor.name);
			if (!onlyPropertiesToCompare) {
				onlyPropertiesToCompare = onlyPropertiesToCompareMap.get('*');
			}
				
			if (onlyPropertiesToCompare) {
				propertiesToCompare = onlyPropertiesToCompare;
			}
		}

		return propertiesToCompare;	
	}


	public static allOrWithoutExcludedProperties(obj: Object | null | undefined,
												 excludedPropertiesFromCompareMap: Map<string, string[]>): string[] {
		
		let propertiesToCompare: string[] = [];
		if (obj) {
			propertiesToCompare = Object.getOwnPropertyNames(obj);

			let propertiesToIgnore = excludedPropertiesFromCompareMap.get(obj.constructor.name);
			if (!propertiesToIgnore) {
				propertiesToIgnore = excludedPropertiesFromCompareMap.get('*');

			}

			if (propertiesToIgnore) {
				propertiesToCompare = propertiesToCompare.filter(el => propertiesToIgnore!.indexOf(el) === -1);
			}
		}

		return propertiesToCompare;
	}

	public static getUserName(user: User | null | undefined): string | undefined {
		let userName = undefined;
        if (user) {
            userName = user.getUsername();
        }
		return userName;
	}

	public static getDetectionPointLabel(detPoint: DetectionPoint | null): string | undefined {
        let detPointLabel = undefined
        if (detPoint) {
            detPointLabel = detPoint.getLabel()
        }
		return detPointLabel;
	}

	public static getMethodFromAction(action: Action): string {
		let method = "unknown";
		switch (action) {
			case Action.ADD_ATTACK: {
				method = "addAttack";
				break;
			}
			case Action.ADD_EVENT: {
				method = "addEvent";
				break;
			}
			case Action.GET_RESPONSES: {
				method = "getResponses";
				break;
			}
		}
		return method;
	}

	public static getActionFromMethod(method: string): Action {
		let action: Action = Action.UNKNOWN;
		switch (method) {
			case "addAttack": {
				action = Action.ADD_ATTACK;
				break;
			}
			case "addEvent": {
				action = Action.ADD_EVENT;
				break;
			}
			case "getResponses": {
				action = Action.GET_RESPONSES;
				break;
			}
		}
		return action;
	}

   /**
	* Finder for attacks in the AttackStore.
	*
	* @param criteria the {@link org.owasp.appsensor.core.criteria.SearchCriteria} object to search by
	* @param attack the {@link Attack} object to match on
	* @return true or false depending on the matching of the search criteria to the {@link Attack}
	*/
	public static isMatchingAttack(criteria: SearchCriteria, attack: Attack ): boolean {
	   let match: boolean = false;

	   const user: User | null = criteria.getUser();
	   const detectionPoint: DetectionPoint | null = criteria.getDetectionPoint();
	   const detectionSystemIds: string[] = criteria.getDetectionSystemIds();
	   const earliest: Date | null = criteria.getEarliest();
	   const rule: Rule | null = criteria.getRule();

	   // check user match if user specified
	   const userMatch: boolean = (user != null) ? user.equals(attack.getUser()) : true;

	   //check detection system match if detection systems specified
	   let detectionSystemMatch: boolean = true;
	   const attDetSystemId = attack.getDetectionSystem();
	   if (detectionSystemIds != null && detectionSystemIds.length > 0 && attDetSystemId !== null) {
		   detectionSystemMatch = detectionSystemIds.indexOf(attDetSystemId.getDetectionSystemId()) > -1 ;
	   }

	   //check detection point match if detection point specified
	   let detectionPointMatch: boolean = true;
	   if (detectionPoint !== null) {
		   const attDetoint = attack.getDetectionPoint();

		   detectionPointMatch = (attDetoint !== null) ?
				   detectionPoint.typeAndThresholdMatches(attDetoint) : false;
	   }

	   //check rule match if rule specified
	   let ruleMatch: boolean = true;
	   if (rule !== null) {
		   const attRule = attack.getRule();
		   ruleMatch = (attRule !== null) ? rule.guidMatches(attRule) : false;
	   }

	   let earliestMatch: boolean = true; 
	   if (earliest !== null) {

		   const attackTimestampMillis = attack.getTimestamp().getTime();
		   const earliestMillis = earliest.getTime();

		   earliestMatch = (earliestMillis < attackTimestampMillis || earliestMillis === attackTimestampMillis)
	   }

	   if (userMatch && detectionSystemMatch && detectionPointMatch && ruleMatch && earliestMatch) {
		   match = true;
	   }

	   return match;
   }

	/**
	 * A finder for Event objects in the EventStore
	 *
	 * @param criteria the {@link org.owasp.appsensor.core.criteria.SearchCriteria} object to search by
	 * @param event the {@link Event} object to match on
	 * @return true or false depending on the matching of the search criteria to the event
	 */
	 public static isMatchingEvent(criteria: SearchCriteria, event: AppSensorEvent): boolean {
		let match: boolean = false;

		const user: User | null = criteria.getUser();
		const detectionPoint: DetectionPoint | null = criteria.getDetectionPoint();
		const detectionSystemIds: string[] = criteria.getDetectionSystemIds();
		const earliest: Date | null = criteria.getEarliest();
		const rule: Rule | null = criteria.getRule();

		// check user match if user specified
		const userMatch: boolean = (user != null) ? user.equals(event.getUser()) : true;

		//check detection system match if detection systems specified
		let detectionSystemMatch: boolean = true;
		const eventDetSystemId = event.getDetectionSystem();
		if (detectionSystemIds != null && detectionSystemIds.length > 0 && eventDetSystemId !== null) {
			detectionSystemMatch = detectionSystemIds.indexOf(eventDetSystemId.getDetectionSystemId()) > -1 ;
		}

		//check detection point match if detection point specified
		let detectionPointMatch: boolean = true;
		if (detectionPoint !== null) {
			const attDetoint = event.getDetectionPoint();

			detectionPointMatch = (attDetoint !== null) ?
					detectionPoint.typeAndThresholdMatches(attDetoint) : false;
		}

		// check rule match if rule specified
		let ruleMatch: boolean = true;
		if (rule !== null) {
			const detPoint = event.getDetectionPoint();
			ruleMatch = (detPoint !== null) ? rule.typeAndThresholdContainsDetectionPoint(detPoint) : false;
		}

		let earliestMatch: boolean = true; 
		if (earliest !== null) {

			const eventTimestampMillis = event.getTimestamp().getTime();
			const earliestMillis = earliest.getTime();

			earliestMatch =	(earliestMillis < eventTimestampMillis || earliestMillis === eventTimestampMillis)
		}
		
		if (userMatch && detectionSystemMatch && detectionPointMatch && ruleMatch && earliestMatch) {
			match = true;
		}

		return match;
	}

	public static isMatchingResponse(criteria: SearchCriteria, response: Response): boolean {
		let match: boolean = false;

		const user: User | null = criteria.getUser();
		const detectionSystemIds: string[] = criteria.getDetectionSystemIds();
		const earliest: Date | null = criteria.getEarliest();

		const detectionPoint: DetectionPoint | null = criteria.getDetectionPoint();
		const rule: Rule | null = criteria.getRule();

		// check user match if user specified
		const userMatch: boolean = (user != null) ? user.equals(response.getUser()) : true;

		//check detection system match if detection systems specified
		let detectionSystemMatch: boolean = true;
		const respDetSystemId = response.getDetectionSystem();
		if (detectionSystemIds && detectionSystemIds.length > 0 && 
			respDetSystemId) {
			detectionSystemMatch = detectionSystemIds.indexOf(respDetSystemId.getDetectionSystemId()) > -1 ;
		}
		
		const responseTimestamp = response.getTimestamp();

		let earliestMatch: boolean = true; 
		if (earliest !== null && responseTimestamp instanceof Date) {

			const responseTimestampMillis = responseTimestamp.getTime();
			const earliestMillis = earliest.getTime();

			earliestMatch =	(earliestMillis < responseTimestampMillis || earliestMillis === responseTimestampMillis)
		}
			
		//ADDITION TO THE ORIGINAL CODE TO TRACE WHAT CAUSED THIS RESPONSE
		//ESSENTIAL FOR REPORTING
		//check detection point match if detection point specified
		let detectionPointMatch: boolean = true;
		if (detectionPoint !== null) {
			const attDetoint = response.getDetectionPoint();

			detectionPointMatch = (attDetoint !== null) ?
					detectionPoint.typeAndThresholdMatches(attDetoint) : false;
		}

		//ADDITION TO THE ORIGINAL CODE TO TRACE WHAT CAUSED THIS RESPONSE
		//ESSENTIAL FOR REPORTING
		//check rule match if rule specified
		let ruleMatch: boolean = true;
		if (rule !== null) {
			const attRule = response.getRule();
			ruleMatch = (attRule !== null) ? rule.guidMatches(attRule) : false;
		}

		if (userMatch && detectionSystemMatch && earliestMatch && detectionPointMatch && ruleMatch) {
			match = true;
		}

		return match;
	}

}

export {IEquals, AppsensorEntity, KeyValuePair, IPAddress, INTERVAL_UNITS, Interval, Threshold, Response, 
	    DetectionPoint, DetectionSystem, RequestHandler, AppSensorEvent, Attack, User, ClientApplication, 
		Utils, AppSensorClient, AppSensorServer, Category, Resource, ObjectValidationError, IValidateInitialize};