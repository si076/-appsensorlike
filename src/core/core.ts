import ipaddrlib from 'ipaddr.js';
import { AccessController, Role } from './accesscontrol/accesscontrol.js';
import { AttackAnalysisEngine, EventAnalysisEngine, ResponseAnalysisEngine } from './analysis/analysis.js';
import { ClientConfiguration } from './configuration/client/client_configuration.js';
import { ServerConfiguration } from './configuration/server/server_configuration.js';
import { EventManager } from './event/event.js';
import {GeoLocation, GeoLocator} from './geolocation/geolocation.js';
import { ResponseHandler, UserManager } from './response/response.js';
import {Rule} from './rule/rule.js'
import { AttackStore, EventStore, ResponseStore } from './storage/storage.js';

interface IEquals {

	equals(obj: Object | null | undefined): boolean

}

interface IAppsensorEntity extends IEquals {

   getId(): string | undefined;

   setId(id: string): void;
}

class AppsensorEntity implements IAppsensorEntity {
	// @Id
	// @Column(columnDefinition = "integer")
	// @GeneratedValue
	protected id?: string | undefined = '';

	public  getId(): string | undefined {
		return this.id;
	}

	public setId(id: string): void {
		this.id = id;
	}

	public equals(obj: Object | null | undefined): boolean {
		if (obj === null || obj === undefined)
			return false;
		if (this.constructor.name !== obj.constructor.name)
			return false;
		
		return true;	
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

    // public hashCode(): number {
    // 	int hashKey = key != null ? key.hashCode() : 0;
    // 	int hashValue = value != null ? value.hashCode() : 0;

    // 	return (hashKey + hashValue) * hashValue + hashKey;
    // }

    public override equals(other: Object | null): boolean {
		if (!super.equals(other))
			return false;
		if (this === other)
			return true;

		let otherPair = other as KeyValuePair;
		return this.key === otherPair.key  && this.value === otherPair.value;
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
	// @Column
	private duration: number = 0;
	
	/** 
	 * Unit portion of interval, ie. 'minutes' if you wanted 
	 * to represent an interval of '3 minutes'.
	 * Constants are provided in the Interval class for the 
	 * units supported by the reference implementation, ie.
	 * SECONDS, MINUTES, HOURS, DAYS.
	 */
	// @Column
	private unit: string = INTERVAL_UNITS.MINUTES;

	public constructor(duration: number = 0, unit: string = INTERVAL_UNITS.MINUTES) {
		super();
		if (duration === 0) {
			console.warn("Interval's duration is 0");
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

	public setUnit(unit: string): Interval {
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
	
	// @Override
	// public int hashCode() {
	// 	return new HashCodeBuilder(17,31).
	// 			append(duration).
	// 			append(unit).
	// 			toHashCode();
	// }
	
	public override equals(obj: Object | null): boolean {
		if (!super.equals(obj))
			return false;
		if (this === obj)
			return true;
		
		const other:Interval = obj as Interval;
		
		return this.duration === other.getDuration() && this.unit === other.getUnit();
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
	// @Column(name="t_count")
	private count: number = 0;
	
	/** 
	 * The time frame within which 'count' number of actions has to be detected in order to
	 * trigger this threshold.
	 */
	// @ManyToOne(cascade = CascadeType.ALL)
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
	
	// @Override
	// public int hashCode() {
	// 	return new HashCodeBuilder(17,31).
	// 			append(count).
	// 			append(interval).
	// 			toHashCode();
	// }
	
	public override equals(obj: Object | null): boolean {
		if (!super.equals(obj))
			return false;
		if (this === obj)
			return true;
		
		const other: Threshold = obj as Threshold;
		
		return this.count === other.getCount() && 
			   Utils.equalsEntitys(this.interval, other.getInterval());
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
	// @ManyToOne(cascade = CascadeType.ALL)
	private user?: User | null | undefined = null;
	
	/** When the event occurred */
	// @Column
	private timestamp?: Date | undefined = new Date();
	
	/** String representing response action name */
	// @Column
	private action: string = '';
	
	/** Interval response should last for, if applicable. Ie. block access for 30 minutes */
	// @ManyToOne(cascade = CascadeType.ALL)
	private interval: Interval | null | undefined = null;

	/** Client application name that response applies to. */
	// @ManyToOne(cascade = CascadeType.ALL)
	private detectionSystem?: DetectionSystem | null | undefined = null;
	
	/** Represent extra metadata, anything client wants to send */
	// @ElementCollection
	// @OneToMany(cascade = CascadeType.ALL)
	private metadata?: KeyValuePair[] = [];
	
	private active?: boolean = false;
	
	public constructor(user: User | null = null, 
		               action: string = '', 
					   timestamp: Date | null = null, 
					   detectionSystem: DetectionSystem | null = null, 
					   interval: Interval | null = null) {
		super();
		this.setUser(user);
		this.setAction(action);
		this.setTimestamp(timestamp);
		this.setDetectionSystem(detectionSystem);
		this.setInterval(interval);
	}
	
	public getUser(): User | null | undefined {
		return this.user;
	}

	public setUser(user: User | null): Response {
		this.user = user;
		return this;
	}

	public getTimestamp(): Date | undefined {
		return this.timestamp;
	}

	public setTimestamp(timestamp: Date | null): Response {
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

	public setDetectionSystem(detectionSystem: DetectionSystem | null): Response {
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
	
	// @Override
	// public int hashCode() {
	// 	return new HashCodeBuilder(17,31).
	// 			append(user).
	// 			append(timestamp).
	// 			append(action).
	// 			append(interval).
	// 			append(detectionSystem).
	// 			append(metadata).
	// 			toHashCode();
	// }
	
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
			   Utils.equalsArrayEntitys(this.metadata, other.getMetadata());
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

	// @Column
	private guid?: string = '';


	/**
	 * Category identifier for the detection point. (ex. "Request", "AccessControl", "SessionManagement")
	 */
	// @Column
	private category: string = '';

	/**
	 * Identifier for the detection point. (ex. "IE1", "RE2")
	 */
	// @Column
	private label?: string | undefined = '';

	/**
	 * {@link Threshold} for determining whether given detection point (associated {@link Event})
	 * should be considered an {@link Attack}.
	 */
	// @ManyToOne(cascade = CascadeType.ALL)
	// @JsonProperty("threshold")
	private threshold: Threshold  | null = null;

	/**
	 * Set of {@link Response}s associated with given detection point.
	 */
	// @Transient
	// @JsonProperty("responses")
	// private Collection<Response> responses = new ArrayList<Response>();
	private responses: Response[] = [];

	public constructor(category: string = '', 
					   label: string = '', 
	                   threshold: Threshold  | null = null, 
					   responses: Response[] = [], 
					   guid: string = '') {
		super();
		this.setCategory(category);
		this.setLabel(label);
		this.setThreshold(threshold);
		this.setResponses(responses);
		this.setGuid(guid);
	}

	public getCategory(): string {
		return this.category;
	}

	public setCategory(category: string): DetectionPoint {
		this.category = category;
		return this;
	}

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

	// @XmlTransient
	// @JsonProperty("threshold")
	public  getThreshold(): Threshold  | null {
		return this.threshold;
	}

	// @JsonProperty("threshold")
	public setThreshold(threshold: Threshold  | null): DetectionPoint {
		this.threshold = threshold;
		return this;
	}

	// @XmlTransient
	// @JsonProperty("responses")
	public getResponses(): Response[] {
		return this.responses;
	}

	// @JsonProperty("responses")
	public setResponses(responses: Response[]): DetectionPoint {
		this.responses = responses;
		return this;
	}

	// @Override
	// public int hashCode() {
	// 	return new HashCodeBuilder(17,31).
	// 			append(category).
	// 			append(label).
	// 			append(threshold).
	// 			append(responses).
	// 			toHashCode();
	// }

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

class InetAddress {
	ipStr: string;

	constructor(ipStr: string) {
		this.ipStr = ipStr;
	}
}

class IPAddress extends AppsensorEntity {

	private address: string = '';
	
	// @JsonProperty("geoLocation")
	private geoLocation: GeoLocation  | null = null;

	// @Autowired(required = false)
	// private transient GeoLocator geoLocator;
	private geoLocator: GeoLocator  | null = null;

	public constructor(address: string = '', 
	                   geoLocation: GeoLocation  | null = null, 
					   geoLocator: GeoLocator  | null = null) {
		super();
		if (address !== '' && !ipaddrlib.isValid(address)) {// InetAddresses.isInetAddress(address)) {
			throw new Error("IP Address string is invalid: " + address);
		}
		this.address = address;
		this.geoLocation = geoLocation;
		this.geoLocator = geoLocator;
	}
	
	public fromString(ipString: string): IPAddress {
		if (!ipaddrlib.isValid(ipString)) { //InetAddresses.isInetAddress(ipString)) {
			throw new Error("IP Address string is invalid: " + ipString);
		}

		let localGeo: GeoLocation | null = null;
		
		if(this.geoLocator != null) {
			localGeo = this.geoLocator.readLocation(this.asInetAddress(ipString));
		}

		return new IPAddress(ipString, localGeo);
	}
	
	//??
	// private InetAddress asInetAddress(ipString: string) {
	// 	switch (arguments.length) {
	// 		case 1:
	// 			return InetAddresses.forString(ipString);
		
	// 		default:
	// 			return InetAddresses.forString(this.getAddressAsString())
	// 	}
	// }
	private asInetAddress(ipString: string): InetAddress {
		switch (arguments.length) {
			case 1:
				return new InetAddress(ipString);//InetAddresses.forString(ipString);
		
			default:
				return new InetAddress(this.getAddressAsString()); //InetAddresses.forString(this.getAddressAsString())
		}
	}

	public setAddress(address: string): IPAddress {
		this.address = address;
		
		return this;
	}

	public getAddress(): string {
		return this.address;
	}
	
	public getAddressAsString(): string {
		return this.address;
	}
	
	// @JsonProperty("geoLocation")
	public getGeoLocation(): GeoLocation  | null {
		return this.geoLocation;
	}
	
	// @JsonProperty("geoLocation")
	public setGeoLocation(geoLocation: GeoLocation | null): IPAddress {
		this.geoLocation = geoLocation;
		
		return this;
	}

	public getGeoLocator(): GeoLocator  | null {
		return this.geoLocator;
	}

	public setGeoLocator(geoLocator: GeoLocator  | null) {
		this.geoLocator = geoLocator;
	}

	// @Override
	// public int hashCode() {
	// 	return new HashCodeBuilder(17,31).
	// 			append(address).
	// 			toHashCode();
	// }
	
	public override equals(obj: Object | null): boolean {
		if (!super.equals(obj))
			return false;
		if (this === obj)
			return true;
		
		const other: IPAddress = obj as IPAddress;
		
		return this.address === other.getAddressAsString() &&
		       Utils.equalsEntitys(this.geoLocation, other.getGeoLocation());
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
	
	// @JsonProperty("ipAddress")
	private ipAddress: IPAddress  | null = null;
	
	// private transient IPAddress locator;
	private locator: IPAddress | null = null;

	public constructor(detectionSystemId: string = '', ipAddress: IPAddress  | null = null) {
		super();
		this.setDetectionSystemId(detectionSystemId);
		this.setIPAddress(ipAddress);
	}
	
	public getDetectionSystemId(): string {
		return this.detectionSystemId;
	}

	public setDetectionSystemId(detectionSystemId: string): DetectionSystem {
		this.detectionSystemId = detectionSystemId;
		
		// if IP is used as system id, setup IP address w/ geolocation
		if (this.locator != null && ipaddrlib.isValid(detectionSystemId)) { //InetAddresses.isInetAddress(detectionSystemId)) {
			this.ipAddress = this.locator.fromString(detectionSystemId);
		}
		
		return this;
	}

	// @JsonProperty("ipAddress")
	public getIPAddress(): IPAddress  | null {
		return this.ipAddress;
	}

	// @JsonProperty("ipAddress")
	public setIPAddress(ipAddress: IPAddress  | null): DetectionSystem {
		this.ipAddress = ipAddress;
		
		return this;
	}

	// @Override
	// public int hashCode() {
	// 	return new HashCodeBuilder(17,31).
	// 			append(detectionSystemId).
	// 			toHashCode();
	// }
	
	public override equals(obj: Object | null): boolean {
		if (!super.equals(obj))
			return false;
		if (this === obj)
			return true;
		
		const other: DetectionSystem = obj as DetectionSystem;
		
		return this.detectionSystemId === other.getDetectionSystemId();
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
	
	// @JsonProperty("ipAddress")
	private ipAddress: IPAddress | null = null;
	
	// private transient IPAddress locator;
	private locator: IPAddress | null = null;

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
		
		// if IP is used as username, setup IP address w/ geolocation
		if (this.locator != null && this.ipAddress == null && ipaddrlib.isValid(username)) { //InetAddresses.isInetAddress(username)) {
			this.ipAddress = this.locator.fromString(username);
		}
		
		return this;
	}
	
	// @JsonProperty("ipAddress")
	public getIPAddress(): IPAddress | null {
		return this.ipAddress;
	}
	
	// @JsonProperty("ipAddress")
	public setIPAddress(ipAddress: IPAddress | null): User {
		this.ipAddress = ipAddress;
		
		return this;
	}

	// @Override
	// public int hashCode() {
	// 	return new HashCodeBuilder(17,31).
	// 			append(username).
	// 			toHashCode();
	// }
	
	public override equals(obj: Object | null | undefined): boolean {
		if (!super.equals(obj))
			return false;
		if (this === obj)
			return true;
		
		const other: User = obj as User;
		
		return this.username === other.getUsername();
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
	// @Column
	private location: string = '';

	/**
	 * The method used to request the resource. In terms of HTTP this would be GET/POST/PUT/etc.
	 * In the case, in which the resources specifies an object this could be the invoked object method.
	 */
	// @Column
	private method: string = '';

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
}

class AppSensorEvent extends AppsensorEntity {

	/** User who triggered the event, could be anonymous user */
	//@ManyToOne(cascade = CascadeType.ALL)
	private user: User | null = null;

	/** Detection Point that was triggered */
	//@ManyToOne(cascade = CascadeType.ALL)
	private detectionPoint: DetectionPoint | null = null;

	/** When the event occurred */
	// @Column
	private timestamp: Date = new Date();

	/**
	 * Identifier label for the system that detected the event.
	 * This will be either the client application, or possibly an external
	 * detection system, such as syslog, a WAF, network IDS, etc.  */
	// @ManyToOne(cascade = CascadeType.ALL)
	private detectionSystem: DetectionSystem | null = null;

	/**
	 * The resource being requested when the event was triggered, which can be used
     * later to block requests to a given function.
     */
	// @ManyToOne(cascade = CascadeType.ALL)
    private resource: Resource | null = null;

	/** Represent extra metadata, anything client wants to send */
	// @ElementCollection
	// @OneToMany(cascade = CascadeType.ALL)
	// private Collection<KeyValuePair> metadata = new ArrayList<>();
	private metadata: KeyValuePair[] = [];

    // public AppSensorEvent () {}

	// public AppSensorEvent (User user, DetectionPoint detectionPoint, DetectionSystem detectionSystem) {
	// 	this(user, detectionPoint, DateUtils.getCurrentTimestampAsString(), detectionSystem);
	// }

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

	// @Override
	// public int hashCode() {
	// 	return new HashCodeBuilder(17,31).
	// 			append(user).
	// 			append(detectionPoint).
	// 			append(timestamp).
	// 			append(detectionSystem).
	// 			append(resource).
	// 			append(metadata).
	// 			toHashCode();
	// }

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
	// @ManyToOne(cascade = CascadeType.ALL)
	private user: User | null = null;

	/** Detection Point that was triggered */
	// @ManyToOne(cascade = CascadeType.ALL)
	private detectionPoint: DetectionPoint | null = null;

	/** When the attack occurred */
	// @Column
	private timestamp: Date = new Date();

	/**
	 * Identifier label for the system that detected the attack.
	 * This will be either the client application, or possibly an external
	 * detection system, such as syslog, a WAF, network IDS, etc.  */
	// @ManyToOne(cascade = CascadeType.ALL)
	private detectionSystem: DetectionSystem | null = null;

	/**
	 * The resource being requested when the attack was triggered, which can be used
     * later to block requests to a given function.
     */
	// @ManyToOne(cascade = CascadeType.ALL)
    private resource: Resource | null = null;

	/** Rule that was triggered */
	// @ManyToOne(cascade = CascadeType.ALL)
	private rule: Rule | null = null;

	/** Represent extra metadata, anything client wants to send */
	// @ElementCollection
	// @OneToMany(cascade = CascadeType.ALL)
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

	// @Override
	// public int hashCode() {
	// 	return new HashCodeBuilder(17,31).
	// 			append(user).
	// 			append(detectionPoint).
	// 			append(timestamp).
	// 			append(detectionSystem).
	// 			append(resource).
	// 			append(metadata).
	// 			toHashCode();
	// }

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
			   Utils.equalsArrayEntitys(this.metadata, other.getMetadata());
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
	addEvent(event: AppSensorEvent): void;
	
	/**
	 * Add an Attack
	 * @param attack Attack to add
	 */
	addAttack(attack: Attack): void;
	
	/**
	 * Retrieve any responses generated that apply to this client application 
	 * since the last time the client application called this method.
	 *  
	 * @param earliest Timestamp in the http://tools.ietf.org/html/rfc3339 format
	 * @return a Collection of Response objects 
	 */
	getResponses(earliest: Date): Response[];
	
}

class ClientApplication implements IEquals {
	
	/** The name of the client application */
	private name: string = '';
	
	/** The collection of {@link Role}s associated with this client application */
	private roles: Role[] = [];

	/** The {@link IPAddress} of the client application, optionally set in the server configuration */
	private ipAddress?: IPAddress | null | undefined = null;
	
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

	public getIpAddress(): IPAddress | null | undefined {
		return this.ipAddress;
	}

	public setIpAddress(ipAddress: IPAddress | null): void {
		this.ipAddress = ipAddress;
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
		             Utils.equalsEntitys(this.ipAddress, other.getIpAddress());
		
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
	
	// @SuppressWarnings("unused")
	// private Logger logger;
	
	/** accessor for {@link org.owasp.appsensor.core.configuration.client.ClientConfiguration} */
	private configuration: ClientConfiguration | null = null;
	
	/** accessor for {@link org.owasp.appsensor.core.event.EventManager} */
	private eventManager: EventManager | null = null; 

	/** accessor for {@link org.owasp.appsensor.core.response.ResponseHandler} */
	private responseHandler: ResponseHandler | null = null;
	
	/** accessor for {@link org.owasp.appsensor.core.response.UserManager} */
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
	
	// @SuppressWarnings("unused")
	// private Logger logger;
	
	/** accessor for {@link org.owasp.appsensor.core.configuration.server.ServerConfiguration} */
	private configuration: ServerConfiguration | null = null;
	
	/** accessor for {@link org.owasp.appsensor.core.storage.EventStore} */
	private eventStore: EventStore | null = null;
	
	/** accessor for {@link org.owasp.appsensor.core.storage.AttackStore} */
	private attackStore: AttackStore | null = null;
	
	/** accessor for {@link org.owasp.appsensor.core.storage.ResponseStore} */
	private responseStore: ResponseStore | null = null;
	
	/** accessor for {@link org.owasp.appsensor.core.analysis.EventAnalysisEngine} */
	private eventAnalysisEngines: EventAnalysisEngine[] = [];
	
	/** accessor for {@link org.owasp.appsensor.core.analysis.AttackAnalysisEngine} */
	private attackAnalysisEngines: AttackAnalysisEngine[] = [];
	
	/** accessor for {@link org.owasp.appsensor.core.analysis.ResponseAnalysisEngine} */
	private responseAnalysisEngines: ResponseAnalysisEngine[] = [];
	
	/** accessor for {@link org.owasp.appsensor.core.accesscontrol.AccessController} */
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
		return (ent1 === null && ent2 === null) || 
		       (ent1 === undefined && ent2 === undefined) ||
		       (ent1 !== null && ent1 !== undefined && ent1.equals(ent2))
	}

	public static equalsArrayEntitys(ent1: IEquals[] | null | undefined, ent2: IEquals[] | null | undefined): boolean {
		if ((ent1 === null && ent2 === null) || 
		    (ent1 === undefined && ent2 === undefined)) {
			return true;
		} else if (ent1 !== null && ent2 !== null && 
			       ent1 !== undefined && ent2 !== undefined &&
			       ent1.length === ent2.length) {
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
}

export {IEquals, AppsensorEntity, KeyValuePair, InetAddress, IPAddress, INTERVAL_UNITS, Interval, Threshold, Response, 
	    DetectionPoint, DetectionSystem, RequestHandler, AppSensorEvent, Attack, User, ClientApplication, 
		Utils, AppSensorClient, AppSensorServer, Category, Resource};