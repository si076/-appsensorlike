import { AggregateAttackAnalysisEngine, AggregateEventAnalysisEngine, AggregateResponseAnalysisEngine } from "../../../../analysis-engines/appsensor-analysis-rules/appsensor-analysis-rules.js";
import { EventAnalysisEngine } from "../../../../core/analysis/analysis.js";
import { ServerConfiguration } from "../../../../core/configuration/server/server_configuration.js";
import { AppSensorClient, AppSensorEvent, AppSensorServer, Category, DetectionPoint, DetectionSystem, Interval, Response, Threshold, User } from "../../../../core/core.js";
import { SearchCriteria } from "../../../../core/criteria/criteria.js";
import { NoopUserManager, UserManager } from "../../../../core/response/response.js";
import { Clause, Expression, MonitorPoint, Rule } from "../../../../core/rule/rule.js";
import { InMemoryAttackStore, InMemoryEventStore, InMemoryResponseStore } from "../../../../storage-providers/appsensor-storage-in-memory/appsensor-storage-in-memory.js";
import { LocalEventManager } from "../../event/event.js";
import { LocalRequestHandler } from "../../handler/handler.js";
import { LocalResponseHandler } from "../../response/response.js";

import assert from "assert";
import { ServerConfigurationReaderImpl } from "../config/config.js";

class AggregateEventAnalysisEngineIntegrationTest {

	private static bob = new User("bob");

	private static detectionPoint1 = new DetectionPoint();

	private static detectionPoint2 = new DetectionPoint();

	private static detectionPoint3 = new DetectionPoint();

	private static detectionPoint4 = new DetectionPoint();

	private static detectionPoint5 = new DetectionPoint();

	private static detectionSystems1: string[] = [];

	private static detectionSystem1 = new DetectionSystem("localhostme");

	private static criteria = new Map<string, SearchCriteria>();

	private static myEngine: AggregateEventAnalysisEngine | null = null;

	private static rules: Rule[] = [];

	protected sleepAmount: number = 10;

	// @Inject
	private appSensorServer: AppSensorServer | null = null;

	// @Inject
	private appSensorClient: AppSensorClient | null = null;

	private static generateResponses(): Response[] {
		const minutes5 = new Interval(5, Interval.MINUTES);

		const log = new Response();
		log.setAction("log");

		const logout = new Response();
		logout.setAction("logout");

		const disableUser = new Response();
		disableUser.setAction("disableUser");

		const disableComponentForSpecificUser5 = new Response();
		disableComponentForSpecificUser5.setAction("disableComponentForSpecificUser");
		disableComponentForSpecificUser5.setInterval(minutes5);

		const disableComponentForAllUsers5 = new Response();
		disableComponentForAllUsers5.setAction("disableComponentForAllUsers");
		disableComponentForAllUsers5.setInterval(minutes5);

		const responses: Response[] = [];
		responses.push(log);
		responses.push(logout);
		responses.push(disableUser);
		responses.push(disableComponentForSpecificUser5);
		responses.push(disableComponentForAllUsers5);

		return responses;
	}

	private static generateRules(): Rule[] {
		const configuredRules: Rule[] = [];
		// intervals
		const minutes5 = new Interval(5, Interval.MINUTES);
		const minutes6 = new Interval(6, Interval.MINUTES);
		const minutes10 = new Interval(10, Interval.MINUTES);
		const minutes16 = new Interval(16, Interval.MINUTES);

		// detection points
		const point1 = new MonitorPoint(new DetectionPoint(Category.INPUT_VALIDATION, "IE1", new Threshold(3, minutes5)));
		point1.setGuid("00000000-0000-0000-0000-000000000000");
		const point2 = new MonitorPoint(new DetectionPoint(Category.INPUT_VALIDATION, "IE2", new Threshold(12, minutes5)));
		const point3 = new MonitorPoint(new DetectionPoint(Category.INPUT_VALIDATION, "IE3", new Threshold(13, minutes6)));
		const point4 = new MonitorPoint(new DetectionPoint(Category.INPUT_VALIDATION, "IE4", new Threshold(4, minutes10)));

		// clauses
		const points1: DetectionPoint[] = [];
		points1.push(point1);

		const points1and2: DetectionPoint[] = [];
		points1and2.push(point1);
		points1and2.push(point2);

		const points2: DetectionPoint[] = [];
		points2.push(point2);

		const points2and3: DetectionPoint[] = [];
		points2and3.push(point2);
		points2and3.push(point3);

		const points1and3: DetectionPoint[] = [];
		points1and3.push(point1);
		points1and3.push(point3);

		const points1and4: DetectionPoint[] = [];
		points1and4.push(point1);
		points1and4.push(point4);

		const clause1 = new Clause(points1);
		const clause1and2 = new Clause(points1and2);
		const clause2 = new Clause(points2);
		const clause2and3 = new Clause(points2and3);
		const clause1and3 = new Clause(points1and3);
		const clause1and4 = new Clause(points1and4);

		// responses
		const responses: Response[] = AggregateEventAnalysisEngineIntegrationTest.generateResponses();

		//rule 1: DP1
		const clauses1: Clause[] = [];
		clauses1.push(clause1);

		const expression1 = new Expression(minutes5, clauses1);

		const expressions1: Expression[] = [];
		expressions1.push(expression1);

		configuredRules.push(new Rule("00000000-0000-0000-0000-000000000011", minutes16, expressions1, responses, "Rule 1"));

		//rule 2: DP1 AND DP2
		const clauses1and2: Clause[] = [];
		clauses1and2.push(clause1and2);

		const expression1and2 = new Expression(minutes5, clauses1and2);

		const expressions1and2: Expression[] = [];
		expressions1and2.push(expression1and2);

		configuredRules.push(new Rule("Rule 2", minutes5, expressions1and2, responses));

		//rule 3: DP1 OR DP2
		const clauses1or2: Clause[] = [];
		clauses1or2.push(clause1);
		clauses1or2.push(clause2);

		const expression1or2 = new Expression(minutes5, clauses1or2);

		const expressions1or2: Expression[] = [];
		expressions1or2.push(expression1or2);

		configuredRules.push(new Rule("Rule 3", minutes5, expressions1or2, responses));

		//rule4: DP1 OR DP2 AND DP3
		const clauses1or2and3: Clause[] = [];
		clauses1or2and3.push(clause1);
		clauses1or2and3.push(clause2and3);

		const expression1or2and3 = new Expression(minutes5, clauses1or2and3);

		const expressions1or2and3: Expression[] = [];
		expressions1or2and3.push(expression1or2and3);

		configuredRules.push(new Rule("Rule 4", minutes5, expressions1or2and3, responses));

		//rule 5: DP1 THEN DP2
		const clauses2: Clause[] = [];
		clauses2.push(clause2);

		const expression2 = new Expression(minutes6, clauses2);

		const expressions1then2: Expression[] = [];
		expressions1then2.push(expression1);
		expressions1then2.push(expression2);

		configuredRules.push(new Rule("Rule 5", minutes6, expressions1then2, responses));

		//rule 6: DP1 THEN DP2 THEN DP1 OR DP2
		const expressions1then2then1or2: Expression[] = [];
		expressions1then2then1or2.push(expression1);
		expressions1then2then1or2.push(expression2);
		expressions1then2then1or2.push(expression1or2);

		configuredRules.push(new Rule("Rule 6", minutes16, expressions1then2then1or2, responses));

		//rule 7: DP1 AND DP4 OR DP1 AND DP3 THEN DP1
		const clauses1and4or1and3: Clause[] = [];
		clauses1and4or1and3.push(clause1and4);
		clauses1and4or1and3.push(clause1and3);

		const expression1and4or1and3 = new Expression(minutes10, clauses1and4or1and3);
		const expressions1and4or1and3then1: Expression[] = [];
		expressions1and4or1and3then1.push(expression1and4or1and3);
		expressions1and4or1and3then1.push(expression1);

		configuredRules.push(new Rule("Rule 7", minutes16, expressions1and4or1and3then1, responses));

		return configuredRules;
	}

	// @BeforeClass
	static {
		AggregateEventAnalysisEngineIntegrationTest.detectionPoint1.setCategory(Category.INPUT_VALIDATION);
		AggregateEventAnalysisEngineIntegrationTest.detectionPoint1.setLabel("IE1");
		//detectionPoint1.setThreshold(new Threshold(3, new Interval(5, Interval.MINUTES)));

		AggregateEventAnalysisEngineIntegrationTest.detectionPoint2.setCategory(Category.INPUT_VALIDATION);
		AggregateEventAnalysisEngineIntegrationTest.detectionPoint2.setLabel("IE2");
		AggregateEventAnalysisEngineIntegrationTest.detectionPoint2.setThreshold(new Threshold(12, new Interval(5, Interval.MINUTES)));

		AggregateEventAnalysisEngineIntegrationTest.detectionPoint3.setCategory(Category.INPUT_VALIDATION);
		AggregateEventAnalysisEngineIntegrationTest.detectionPoint3.setLabel("IE3");
		AggregateEventAnalysisEngineIntegrationTest.detectionPoint3.setThreshold(new Threshold(13, new Interval(6, Interval.MINUTES)));

		AggregateEventAnalysisEngineIntegrationTest.detectionPoint4.setCategory(Category.INPUT_VALIDATION);
		AggregateEventAnalysisEngineIntegrationTest.detectionPoint4.setLabel("IE4");


		AggregateEventAnalysisEngineIntegrationTest.detectionPoint5.setCategory(Category.INPUT_VALIDATION);
		AggregateEventAnalysisEngineIntegrationTest.detectionPoint5.setLabel("IE5");

		AggregateEventAnalysisEngineIntegrationTest.detectionSystems1.push(AggregateEventAnalysisEngineIntegrationTest.detectionSystem1.getDetectionSystemId());

		AggregateEventAnalysisEngineIntegrationTest.criteria.set("all", new SearchCriteria().setDetectionSystemIds(AggregateEventAnalysisEngineIntegrationTest.detectionSystems1));

		AggregateEventAnalysisEngineIntegrationTest.criteria.set("dp1", new SearchCriteria().
				setUser(AggregateEventAnalysisEngineIntegrationTest.bob).
				setDetectionPoint(AggregateEventAnalysisEngineIntegrationTest.detectionPoint1).
				setDetectionSystemIds(AggregateEventAnalysisEngineIntegrationTest.detectionSystems1));

        AggregateEventAnalysisEngineIntegrationTest.criteria.set("dp2", new SearchCriteria().
				setUser(AggregateEventAnalysisEngineIntegrationTest.bob).
				setDetectionPoint(AggregateEventAnalysisEngineIntegrationTest.detectionPoint2).
				setDetectionSystemIds(AggregateEventAnalysisEngineIntegrationTest.detectionSystems1));

        AggregateEventAnalysisEngineIntegrationTest.criteria.set("dp3", new SearchCriteria().
				setUser(AggregateEventAnalysisEngineIntegrationTest.bob).
				setDetectionPoint(AggregateEventAnalysisEngineIntegrationTest.detectionPoint3).
				setDetectionSystemIds(AggregateEventAnalysisEngineIntegrationTest.detectionSystems1));

        AggregateEventAnalysisEngineIntegrationTest.criteria.set("dp5", new SearchCriteria().
				setUser(AggregateEventAnalysisEngineIntegrationTest.bob).
				setDetectionPoint(AggregateEventAnalysisEngineIntegrationTest.detectionPoint5).
				setDetectionSystemIds(AggregateEventAnalysisEngineIntegrationTest.detectionSystems1));

        AggregateEventAnalysisEngineIntegrationTest.rules = AggregateEventAnalysisEngineIntegrationTest.generateRules();

		AggregateEventAnalysisEngineIntegrationTest.criteria.set("rule1", new SearchCriteria().
				setUser(AggregateEventAnalysisEngineIntegrationTest.bob).
				setRule(AggregateEventAnalysisEngineIntegrationTest.rules[0]).
				setDetectionSystemIds(AggregateEventAnalysisEngineIntegrationTest.detectionSystems1));

        AggregateEventAnalysisEngineIntegrationTest.criteria.set("rule2", new SearchCriteria().
				setUser(AggregateEventAnalysisEngineIntegrationTest.bob).
				setRule(AggregateEventAnalysisEngineIntegrationTest.rules[1]).
				setDetectionSystemIds(AggregateEventAnalysisEngineIntegrationTest.detectionSystems1));

        AggregateEventAnalysisEngineIntegrationTest.criteria.set("rule3", new SearchCriteria().
				setUser(AggregateEventAnalysisEngineIntegrationTest.bob).
				setRule(AggregateEventAnalysisEngineIntegrationTest.rules[2]).
				setDetectionSystemIds(AggregateEventAnalysisEngineIntegrationTest.detectionSystems1));

        AggregateEventAnalysisEngineIntegrationTest.criteria.set("rule4", new SearchCriteria().
				setUser(AggregateEventAnalysisEngineIntegrationTest.bob).
				setRule(AggregateEventAnalysisEngineIntegrationTest.rules[3]).
				setDetectionSystemIds(AggregateEventAnalysisEngineIntegrationTest.detectionSystems1));

        AggregateEventAnalysisEngineIntegrationTest.criteria.set("rule5", new SearchCriteria().
				setUser(AggregateEventAnalysisEngineIntegrationTest.bob).
				setRule(AggregateEventAnalysisEngineIntegrationTest.rules[4]).
				setDetectionSystemIds(AggregateEventAnalysisEngineIntegrationTest.detectionSystems1));

        AggregateEventAnalysisEngineIntegrationTest.criteria.set("rule6", new SearchCriteria().
				setUser(AggregateEventAnalysisEngineIntegrationTest.bob).
				setRule(AggregateEventAnalysisEngineIntegrationTest.rules[5]).
				setDetectionSystemIds(AggregateEventAnalysisEngineIntegrationTest.detectionSystems1));
	}

	private static loadMockedDetectionPoints(): DetectionPoint[] {
		const configuredDetectionPoints: DetectionPoint[] = [];

		const responses: Response[] = AggregateEventAnalysisEngineIntegrationTest.generateResponses();

		const minutes5 = new Interval(5, Interval.MINUTES);
		const minutes6 = new Interval(6, Interval.MINUTES);

		const events3minutes5 = new Threshold(3, minutes5);
		const events12minutes5 = new Threshold(12, minutes5);
		const events13minutes6 = new Threshold(13, minutes6);

		const point1 = new DetectionPoint(Category.INPUT_VALIDATION, "IE1", events3minutes5, responses);
		const point2 = new DetectionPoint(Category.INPUT_VALIDATION, "IE2", events12minutes5, responses);
		const point3 = new DetectionPoint(Category.INPUT_VALIDATION, "IE3", events13minutes6, responses);

		configuredDetectionPoints.push(point1);
		configuredDetectionPoints.push(point2);
		configuredDetectionPoints.push(point3);

		return configuredDetectionPoints;
	}

	private setRule(server: AppSensorServer | null, rule: Rule): void {
		const rules: Rule[] = [];
		rules.push(rule);

		const updatedConfiguration: ServerConfiguration | null = this.appSensorServer!.getConfiguration();
		if (updatedConfiguration) {
			updatedConfiguration.setRules(rules);
		}
		
		this.appSensorServer!.setConfiguration(updatedConfiguration);
	}

	private clearStores(): void {
        if (this.appSensorServer) {
            (this.appSensorServer.getAttackStore() as InMemoryAttackStore).clearAll();
            (this.appSensorServer.getEventStore() as InMemoryEventStore).clearAll();
        }
	}


	// @Before
	public initializeTest(): void {
		if (AggregateEventAnalysisEngineIntegrationTest.myEngine == null) {
			this.initialSetup();
		}
		this.clearStores();

		// clear rules
		// this.setRule(this.appSensorServer, null);
	}

	public initialSetup(): void {
		//instantiate server
        this.appSensorServer = new AppSensorServer();

		this.appSensorServer.setConfiguration(new ServerConfigurationReaderImpl().read());

		const eventStore = new InMemoryEventStore();
        this.appSensorServer.setEventStore(eventStore);

		const attackStore = new InMemoryAttackStore();
        this.appSensorServer.setAttackStore(attackStore);

		const responseStore = new InMemoryResponseStore();
        this.appSensorServer.setResponseStore(responseStore);

        // const attEngine = new AggregateAttackAnalysisEngine();
        // attEngine.setAppSensorServer(this.appSensorServer);
        // this.appSensorServer.setAttackAnalysisEngines([attEngine]);

        const eventEngine = new AggregateEventAnalysisEngine();
        eventEngine.setAppSensorServer(this.appSensorServer);
        this.appSensorServer.setEventAnalysisEngines([eventEngine]);

		eventStore.registerListener(eventEngine);
        // const respEngine = new AggregateResponseAnalysisEngine();
        // this.appSensorServer.setResponseAnalysisEngines([respEngine]);

		const updatedConfiguration: ServerConfiguration | null = this.appSensorServer.getConfiguration();
        if (updatedConfiguration) {
            updatedConfiguration.setDetectionPoints(AggregateEventAnalysisEngineIntegrationTest.loadMockedDetectionPoints());
        }
		
		this.appSensorServer.setConfiguration(updatedConfiguration);

		const engines: EventAnalysisEngine[] = this.appSensorServer.getEventAnalysisEngines();

		for (const engine of engines) {
			if (engine instanceof AggregateEventAnalysisEngine){
				AggregateEventAnalysisEngineIntegrationTest.myEngine = engine as AggregateEventAnalysisEngine;
			}
		}

        const requestHandler: LocalRequestHandler = new LocalRequestHandler(this.appSensorServer);
        const eventManager: LocalEventManager = new LocalEventManager(requestHandler);
        const userManager: UserManager = new NoopUserManager();
        const responseHandler: LocalResponseHandler = new LocalResponseHandler(userManager);

        this.appSensorClient = new AppSensorClient();
        this.appSensorClient.setEventManager(eventManager);
        this.appSensorClient.setResponseHandler(responseHandler);
        this.appSensorClient.setUserManager(userManager);
	}

	// this method doesn't actually wait, it just adds events with a predetermined time
	// does not check anything
	private addEvent(detectionPoint: DetectionPoint, time: Date): void {
        this.appSensorClient!.getEventManager()!.addEvent(
            new AppSensorEvent(AggregateEventAnalysisEngineIntegrationTest.bob, 
                                detectionPoint, 
                                new DetectionSystem("localhostme"),
                                time));
	}

	//assumes no rules will be triggered until last event
	private async generateEvents(time: number, 
                           detectionPoint: DetectionPoint, 
                           eventCount: number, 
                           ruleName: string) {
        const attackStore = this.appSensorServer!.getAttackStore();
        const attackCount: number = attackStore!.findAttacks(AggregateEventAnalysisEngineIntegrationTest.criteria.get(ruleName)!).length;

        // let dateTime = new Date();

        const millis = time/eventCount;

        for (let i = 0; i < eventCount; i++) {
            assert.equal(attackCount, attackStore!.findAttacks(AggregateEventAnalysisEngineIntegrationTest.criteria.get(ruleName)!).length);

            // this.appSensorClient!.getEventManager()!.addEvent(new AppSensorEvent(AggregateEventAnalysisEngineIntegrationTest.bob, detectionPoint, new DetectionSystem("localhostme"), dateTime));
            this.appSensorClient!.getEventManager()!.addEvent(new AppSensorEvent(AggregateEventAnalysisEngineIntegrationTest.bob, detectionPoint, new DetectionSystem("localhostme")));
            // Thread.sleep(time/eventCount);
            // dateTime = new Date(dateTime.getTime() + millis);
			await new Promise((resolve, reject) => {
				setTimeout(() => {
					resolve(null);
				}, millis);
			});
        }
	}

	private assertEventsAndAttacks (eventCount: number, 
                                    attackCount: number, 
                                    criteria: SearchCriteria): void {
        if (criteria.getRule() === null) {
            assert.equal(eventCount, this.appSensorServer!.getEventStore()!.findEvents(criteria).length);
        }
        assert.equal(attackCount, this.appSensorServer!.getAttackStore()!.findAttacks(criteria).length);
	}

	// @Test
	public async test1_DP1() {
		console.log('-> test1_DP1');
		//Add rule
		this.setRule(this.appSensorServer, AggregateEventAnalysisEngineIntegrationTest.rules[0]);

		//is empty
		this.assertEventsAndAttacks(0, 0, AggregateEventAnalysisEngineIntegrationTest.criteria.get("all")!);

		// 3 events and triggered attack
		await this.generateEvents(this.sleepAmount * 3, 
                            AggregateEventAnalysisEngineIntegrationTest.detectionPoint1, 
                            3, 
                            "rule1");
		this.assertEventsAndAttacks(3, 1, AggregateEventAnalysisEngineIntegrationTest.criteria.get("dp1")!);
		assert.equal(1, this.appSensorServer!.getAttackStore()!.findAttacks(AggregateEventAnalysisEngineIntegrationTest.criteria.get("rule1")!).length);

		// 1 event and no new attack
		await this.generateEvents(this.sleepAmount, 
                            AggregateEventAnalysisEngineIntegrationTest.detectionPoint1, 
                            1,
                            "rule1");
		this.assertEventsAndAttacks(4, 1, AggregateEventAnalysisEngineIntegrationTest.criteria.get("dp1")!);
		assert.equal(1, this.appSensorServer!.getAttackStore()!.findAttacks(AggregateEventAnalysisEngineIntegrationTest.criteria.get("rule1")!).length);

		// 2 events and 2 total attack
		await this.generateEvents(this.sleepAmount * 2, 
                            AggregateEventAnalysisEngineIntegrationTest.detectionPoint1, 
                            2, 
                            "rule1");
		this.assertEventsAndAttacks(6, 2, AggregateEventAnalysisEngineIntegrationTest.criteria.get("dp1")!);
		assert.equal(2, this.appSensorServer!.getAttackStore()!.findAttacks(AggregateEventAnalysisEngineIntegrationTest.criteria.get("rule1")!).length);

		console.log('<- test1_DP1');
	}

	// @Test
	public async test2_DP1andDP2() {
		console.log('-> test2_DP1andDP2');
		//Add rule
		this.setRule(this.appSensorServer, AggregateEventAnalysisEngineIntegrationTest.rules[1]);

		//is empty
		this.assertEventsAndAttacks(0, 0, AggregateEventAnalysisEngineIntegrationTest.criteria.get("all")!);

		//triggers attack
		await this.generateEvents(this.sleepAmount * 3, 
                            AggregateEventAnalysisEngineIntegrationTest.detectionPoint1, 
                            3, 
                            "rule2");
		this.assertEventsAndAttacks(3, 1, AggregateEventAnalysisEngineIntegrationTest.criteria.get("dp1")!);
		this.assertEventsAndAttacks(0, 0, AggregateEventAnalysisEngineIntegrationTest.criteria.get("rule2")!);

		await this.generateEvents(this.sleepAmount * 12, 
                            AggregateEventAnalysisEngineIntegrationTest.detectionPoint2, 
                            12, 
                            "rule2");
		this.assertEventsAndAttacks(12, 1, AggregateEventAnalysisEngineIntegrationTest.criteria.get("dp2")!);
		this.assertEventsAndAttacks(0, 1, AggregateEventAnalysisEngineIntegrationTest.criteria.get("rule2")!);

		//check since last attack
		await this.generateEvents(this.sleepAmount, AggregateEventAnalysisEngineIntegrationTest.detectionPoint1, 1, "rule2");
		this.assertEventsAndAttacks(4, 1, AggregateEventAnalysisEngineIntegrationTest.criteria.get("dp1")!);
		this.assertEventsAndAttacks(0, 1, AggregateEventAnalysisEngineIntegrationTest.criteria.get("rule2")!);

		await this.generateEvents(this.sleepAmount, AggregateEventAnalysisEngineIntegrationTest.detectionPoint2, 1, "rule2");
		this.assertEventsAndAttacks(13, 1, AggregateEventAnalysisEngineIntegrationTest.criteria.get("dp2")!);
		this.assertEventsAndAttacks(0, 1, AggregateEventAnalysisEngineIntegrationTest.criteria.get("rule2")!);

		//triggers attack in reverse
		await this.generateEvents(this.sleepAmount*11, AggregateEventAnalysisEngineIntegrationTest.detectionPoint2, 11, "rule2");
		this.assertEventsAndAttacks(24, 2, AggregateEventAnalysisEngineIntegrationTest.criteria.get("dp2")!);
		this.assertEventsAndAttacks(0, 1, AggregateEventAnalysisEngineIntegrationTest.criteria.get("rule2")!);

		await this.generateEvents(this.sleepAmount*2, AggregateEventAnalysisEngineIntegrationTest.detectionPoint1, 2, "rule2");
		this.assertEventsAndAttacks(6, 2, AggregateEventAnalysisEngineIntegrationTest.criteria.get("dp1")!);
		this.assertEventsAndAttacks(0, 2, AggregateEventAnalysisEngineIntegrationTest.criteria.get("rule2")!);

		// trigger dp1 two times, no new attack
		await this.generateEvents(this.sleepAmount*3, AggregateEventAnalysisEngineIntegrationTest.detectionPoint1, 3, "rule2");
		this.assertEventsAndAttacks(9, 3, AggregateEventAnalysisEngineIntegrationTest.criteria.get("dp1")!);
		this.assertEventsAndAttacks(0, 2, AggregateEventAnalysisEngineIntegrationTest.criteria.get("rule2")!);

		await this.generateEvents(this.sleepAmount*3, AggregateEventAnalysisEngineIntegrationTest.detectionPoint1, 3, "rule2");
		this.assertEventsAndAttacks(12, 4, AggregateEventAnalysisEngineIntegrationTest.criteria.get("dp1")!);
		this.assertEventsAndAttacks(0, 2, AggregateEventAnalysisEngineIntegrationTest.criteria.get("rule2")!);

		// trigger dp2, attack
		await this.generateEvents(this.sleepAmount*12, AggregateEventAnalysisEngineIntegrationTest.detectionPoint2, 12, "rule2");
		this.assertEventsAndAttacks(36, 3, AggregateEventAnalysisEngineIntegrationTest.criteria.get("dp2")!);
		this.assertEventsAndAttacks(0, 3, AggregateEventAnalysisEngineIntegrationTest.criteria.get("rule2")!);

		console.log('<- test2_DP1andDP2');
	}

	// @Test
	public async test3_DP1orDP2() {
		console.log('-> test3_DP1orDP2');
		//Add rule
		this.setRule(this.appSensorServer, AggregateEventAnalysisEngineIntegrationTest.rules[2]);;

		//is empty
		this.assertEventsAndAttacks(0, 0, AggregateEventAnalysisEngineIntegrationTest.criteria.get("all")!);

		//triggers attack
		await this.generateEvents(this.sleepAmount*3, AggregateEventAnalysisEngineIntegrationTest.detectionPoint1, 3, "rule3");
		this.assertEventsAndAttacks(3, 1, AggregateEventAnalysisEngineIntegrationTest.criteria.get("dp1")!);
		this.assertEventsAndAttacks(0, 1, AggregateEventAnalysisEngineIntegrationTest.criteria.get("rule3")!);

		await this.generateEvents(this.sleepAmount*12, AggregateEventAnalysisEngineIntegrationTest.detectionPoint2, 12, "rule3");
		this.assertEventsAndAttacks(12, 1, AggregateEventAnalysisEngineIntegrationTest.criteria.get("dp2")!);
		this.assertEventsAndAttacks(0, 2, AggregateEventAnalysisEngineIntegrationTest.criteria.get("rule3")!);

		//check since last attack
		await this.generateEvents(this.sleepAmount, AggregateEventAnalysisEngineIntegrationTest.detectionPoint1, 1, "rule3");
		this.assertEventsAndAttacks(4, 1, AggregateEventAnalysisEngineIntegrationTest.criteria.get("dp1")!);
		this.assertEventsAndAttacks(0, 2, AggregateEventAnalysisEngineIntegrationTest.criteria.get("rule3")!);

		await this.generateEvents(this.sleepAmount, AggregateEventAnalysisEngineIntegrationTest.detectionPoint2, 1, "rule3");
		this.assertEventsAndAttacks(13, 1, AggregateEventAnalysisEngineIntegrationTest.criteria.get("dp2")!);
		this.assertEventsAndAttacks(0, 2, AggregateEventAnalysisEngineIntegrationTest.criteria.get("rule3")!);

		//triggers attack in reverse order
		await this.generateEvents(this.sleepAmount*11, AggregateEventAnalysisEngineIntegrationTest.detectionPoint2, 11, "rule3");
		this.assertEventsAndAttacks(24, 2, AggregateEventAnalysisEngineIntegrationTest.criteria.get("dp2")!);
		this.assertEventsAndAttacks(0, 3, AggregateEventAnalysisEngineIntegrationTest.criteria.get("rule3")!);

		//won't trigger because attack already happened
		await this.generateEvents(this.sleepAmount*2, AggregateEventAnalysisEngineIntegrationTest.detectionPoint1, 2, "rule3");
		this.assertEventsAndAttacks(6, 2, AggregateEventAnalysisEngineIntegrationTest.criteria.get("dp1")!);
		this.assertEventsAndAttacks(0, 3, AggregateEventAnalysisEngineIntegrationTest.criteria.get("rule3")!);

		//now it will trigger
		await this.generateEvents(this.sleepAmount, AggregateEventAnalysisEngineIntegrationTest.detectionPoint1, 1, "rule3");
		this.assertEventsAndAttacks(7, 2, AggregateEventAnalysisEngineIntegrationTest.criteria.get("dp1")!);
		this.assertEventsAndAttacks(0, 4, AggregateEventAnalysisEngineIntegrationTest.criteria.get("rule3")!);

		console.log('<- test3_DP1orDP2');
	}

	// @Test
	public async test4_DP1orDP2andDP3() {
		console.log('-> test4_DP1orDP2andDP3');
		//Add rule
		this.setRule(this.appSensorServer, AggregateEventAnalysisEngineIntegrationTest.rules[3]);

		//is empty
		this.assertEventsAndAttacks(0, 0, AggregateEventAnalysisEngineIntegrationTest.criteria.get("all")!);

		//DP1 - trigger attack
		await this.generateEvents(this.sleepAmount*3, AggregateEventAnalysisEngineIntegrationTest.detectionPoint1, 3, "rule4");
		this.assertEventsAndAttacks(3, 1, AggregateEventAnalysisEngineIntegrationTest.criteria.get("dp1")!);
		this.assertEventsAndAttacks(0, 1, AggregateEventAnalysisEngineIntegrationTest.criteria.get("rule4")!);

		//DP1 - trigger attack
		await this.generateEvents(this.sleepAmount*3, AggregateEventAnalysisEngineIntegrationTest.detectionPoint1, 3, "rule4");
		this.assertEventsAndAttacks(6, 2, AggregateEventAnalysisEngineIntegrationTest.criteria.get("dp1")!);
		this.assertEventsAndAttacks(0, 2, AggregateEventAnalysisEngineIntegrationTest.criteria.get("rule4")!);

		//DP3 AND DP2 - trigger attack
		await this.generateEvents(this.sleepAmount*13, AggregateEventAnalysisEngineIntegrationTest.detectionPoint3, 13, "rule4");
		this.assertEventsAndAttacks(13, 1, AggregateEventAnalysisEngineIntegrationTest.criteria.get("dp3")!);
		this.assertEventsAndAttacks(0, 2, AggregateEventAnalysisEngineIntegrationTest.criteria.get("rule4")!);

		await this.generateEvents(this.sleepAmount*12, AggregateEventAnalysisEngineIntegrationTest.detectionPoint2, 12, "rule4");
		this.assertEventsAndAttacks(12, 1, AggregateEventAnalysisEngineIntegrationTest.criteria.get("dp2")!);
		this.assertEventsAndAttacks(0, 3, AggregateEventAnalysisEngineIntegrationTest.criteria.get("rule4")!);

		//DP1 - trigger attack
		await this.generateEvents(this.sleepAmount*3, AggregateEventAnalysisEngineIntegrationTest.detectionPoint1, 3, "rule4");
		this.assertEventsAndAttacks(9, 3, AggregateEventAnalysisEngineIntegrationTest.criteria.get("dp1")!);
		this.assertEventsAndAttacks(0, 4, AggregateEventAnalysisEngineIntegrationTest.criteria.get("rule4")!);

		//DP3 no new attack
		await this.generateEvents(this.sleepAmount*13, AggregateEventAnalysisEngineIntegrationTest.detectionPoint3, 13, "rule4");
		this.assertEventsAndAttacks(26, 2, AggregateEventAnalysisEngineIntegrationTest.criteria.get("dp3")!);
		this.assertEventsAndAttacks(0, 4, AggregateEventAnalysisEngineIntegrationTest.criteria.get("rule4")!);

		//DP1 - trigger attack
		await this.generateEvents(this.sleepAmount*3, AggregateEventAnalysisEngineIntegrationTest.detectionPoint1, 3, "rule4");
		this.assertEventsAndAttacks(12, 4, AggregateEventAnalysisEngineIntegrationTest.criteria.get("dp1")!);
		this.assertEventsAndAttacks(0, 5, AggregateEventAnalysisEngineIntegrationTest.criteria.get("rule4")!);

		//DP2 - no new attack
		await this.generateEvents(this.sleepAmount*12, AggregateEventAnalysisEngineIntegrationTest.detectionPoint2, 12, "rule4");
		this.assertEventsAndAttacks(24, 2, AggregateEventAnalysisEngineIntegrationTest.criteria.get("dp2")!);
		this.assertEventsAndAttacks(0, 5, AggregateEventAnalysisEngineIntegrationTest.criteria.get("rule4")!);

		//DP3 trigger attack
		await this.generateEvents(this.sleepAmount*13, AggregateEventAnalysisEngineIntegrationTest.detectionPoint3, 13, "rule4");
		this.assertEventsAndAttacks(39, 3, AggregateEventAnalysisEngineIntegrationTest.criteria.get("dp3")!);
		this.assertEventsAndAttacks(0, 6, AggregateEventAnalysisEngineIntegrationTest.criteria.get("rule4")!);

		console.log('<- test4_DP1orDP2andDP3');
	}

	// @Test
	public async test5_DP1thenDP2() {
		console.log('-> test5_DP1thenDP2');
		//Add rule
		this.setRule(this.appSensorServer, AggregateEventAnalysisEngineIntegrationTest.rules[4]);

		//is empty
		this.assertEventsAndAttacks(0, 0, AggregateEventAnalysisEngineIntegrationTest.criteria.get("all")!);

		//DP1 - no attack
		await this.generateEvents(this.sleepAmount*3, AggregateEventAnalysisEngineIntegrationTest.detectionPoint1, 3, "rule5");
		this.assertEventsAndAttacks(3, 1, AggregateEventAnalysisEngineIntegrationTest.criteria.get("dp1")!);
		this.assertEventsAndAttacks(0, 0, AggregateEventAnalysisEngineIntegrationTest.criteria.get("rule5")!);

		//DP2 - trigger attack
		await this.generateEvents(this.sleepAmount*12, AggregateEventAnalysisEngineIntegrationTest.detectionPoint2, 12, "rule5");
		this.assertEventsAndAttacks(12, 1, AggregateEventAnalysisEngineIntegrationTest.criteria.get("dp2")!);
		this.assertEventsAndAttacks(0, 1, AggregateEventAnalysisEngineIntegrationTest.criteria.get("rule5")!);

		//DP2 - no attack
		await this.generateEvents(this.sleepAmount*11, AggregateEventAnalysisEngineIntegrationTest.detectionPoint2, 11, "rule5");
		this.assertEventsAndAttacks(23, 1, AggregateEventAnalysisEngineIntegrationTest.criteria.get("dp2")!);
		this.assertEventsAndAttacks(0, 1, AggregateEventAnalysisEngineIntegrationTest.criteria.get("rule5")!);

		await this.generateEvents(this.sleepAmount*1, AggregateEventAnalysisEngineIntegrationTest.detectionPoint2, 1, "rule5");
		this.assertEventsAndAttacks(24, 2, AggregateEventAnalysisEngineIntegrationTest.criteria.get("dp2")!);
		this.assertEventsAndAttacks(0, 1, AggregateEventAnalysisEngineIntegrationTest.criteria.get("rule5")!);

		//DP1 - no attack
		await this.generateEvents(this.sleepAmount*3, AggregateEventAnalysisEngineIntegrationTest.detectionPoint1, 3, "rule5");
		this.assertEventsAndAttacks(6, 2, AggregateEventAnalysisEngineIntegrationTest.criteria.get("dp1")!);
		this.assertEventsAndAttacks(0, 1, AggregateEventAnalysisEngineIntegrationTest.criteria.get("rule5")!);

		//DP2 - trigger attack
		await this.generateEvents(this.sleepAmount*12, AggregateEventAnalysisEngineIntegrationTest.detectionPoint2, 12, "rule5");
		this.assertEventsAndAttacks(36, 3, AggregateEventAnalysisEngineIntegrationTest.criteria.get("dp2")!);
		this.assertEventsAndAttacks(0, 2, AggregateEventAnalysisEngineIntegrationTest.criteria.get("rule5")!);

		console.log('<- test5_DP1thenDP2');
	}

	// @Test
	public async test6_DP1thenDP2thenDP1orDP2() {
		console.log('-> test6_DP1thenDP2thenDP1orDP2');
		//Add rule
		this.setRule(this.appSensorServer, AggregateEventAnalysisEngineIntegrationTest.rules[5]);

		//is empty
		this.assertEventsAndAttacks(0, 0, AggregateEventAnalysisEngineIntegrationTest.criteria.get("all")!);

		//DP1 - no attack
		await this.generateEvents(this.sleepAmount*3, AggregateEventAnalysisEngineIntegrationTest.detectionPoint1, 3, "rule6");
		this.assertEventsAndAttacks(3, 1, AggregateEventAnalysisEngineIntegrationTest.criteria.get("dp1")!);
		this.assertEventsAndAttacks(0, 0, AggregateEventAnalysisEngineIntegrationTest.criteria.get("rule6")!);

		//DP2 - no attack
		await this.generateEvents(this.sleepAmount*12, AggregateEventAnalysisEngineIntegrationTest.detectionPoint2, 12, "rule6");
		this.assertEventsAndAttacks(12, 1, AggregateEventAnalysisEngineIntegrationTest.criteria.get("dp2")!);
		this.assertEventsAndAttacks(0, 0, AggregateEventAnalysisEngineIntegrationTest.criteria.get("rule6")!);

		//DP1 - trigger attack
		await this.generateEvents(this.sleepAmount*3, AggregateEventAnalysisEngineIntegrationTest.detectionPoint1, 3, "rule6");
		this.assertEventsAndAttacks(6, 2, AggregateEventAnalysisEngineIntegrationTest.criteria.get("dp1")!);
		this.assertEventsAndAttacks(0, 1, AggregateEventAnalysisEngineIntegrationTest.criteria.get("rule6")!);

		//DP1 - no attack
		await this.generateEvents(this.sleepAmount*3, AggregateEventAnalysisEngineIntegrationTest.detectionPoint1, 3, "rule6");
		this.assertEventsAndAttacks(9, 3, AggregateEventAnalysisEngineIntegrationTest.criteria.get("dp1")!);
		this.assertEventsAndAttacks(0, 1, AggregateEventAnalysisEngineIntegrationTest.criteria.get("rule6")!);

		this.clearStores();

		//DP2 - no attack
		await this.generateEvents(this.sleepAmount*12, AggregateEventAnalysisEngineIntegrationTest.detectionPoint2, 12, "rule6");
		this.assertEventsAndAttacks(12, 1, AggregateEventAnalysisEngineIntegrationTest.criteria.get("dp2")!);
		this.assertEventsAndAttacks(0, 0, AggregateEventAnalysisEngineIntegrationTest.criteria.get("rule6")!);

		//DP1 - no attack
		await this.generateEvents(this.sleepAmount*3, AggregateEventAnalysisEngineIntegrationTest.detectionPoint1, 3, "rule6");
		this.assertEventsAndAttacks(3, 1, AggregateEventAnalysisEngineIntegrationTest.criteria.get("dp1")!);
		this.assertEventsAndAttacks(0, 0, AggregateEventAnalysisEngineIntegrationTest.criteria.get("rule6")!);

		//DP2 - no attack
		await this.generateEvents(this.sleepAmount*12, AggregateEventAnalysisEngineIntegrationTest.detectionPoint2, 12, "rule6");
		this.assertEventsAndAttacks(24, 2, AggregateEventAnalysisEngineIntegrationTest.criteria.get("dp2")!);
		this.assertEventsAndAttacks(0, 0, AggregateEventAnalysisEngineIntegrationTest.criteria.get("rule6")!);

		//DP2 - attack
		await this.generateEvents(this.sleepAmount*12, AggregateEventAnalysisEngineIntegrationTest.detectionPoint2, 12, "rule6");
		this.assertEventsAndAttacks(36, 3, AggregateEventAnalysisEngineIntegrationTest.criteria.get("dp2")!);
		this.assertEventsAndAttacks(0, 1, AggregateEventAnalysisEngineIntegrationTest.criteria.get("rule6")!);

		//DP1 - no attack
		await this.generateEvents(this.sleepAmount*3, AggregateEventAnalysisEngineIntegrationTest.detectionPoint1, 3, "rule6");
		this.assertEventsAndAttacks(6, 2, AggregateEventAnalysisEngineIntegrationTest.criteria.get("dp1")!);
		this.assertEventsAndAttacks(0, 1, AggregateEventAnalysisEngineIntegrationTest.criteria.get("rule6")!);

		//DP1 - no attack
		await this.generateEvents(this.sleepAmount*3, AggregateEventAnalysisEngineIntegrationTest.detectionPoint1, 3, "rule6");
		this.assertEventsAndAttacks(9, 3, AggregateEventAnalysisEngineIntegrationTest.criteria.get("dp1")!);
		this.assertEventsAndAttacks(0, 1, AggregateEventAnalysisEngineIntegrationTest.criteria.get("rule6")!);

		//DP2 - no attack
		await this.generateEvents(this.sleepAmount*12, AggregateEventAnalysisEngineIntegrationTest.detectionPoint2, 12, "rule6");
		this.assertEventsAndAttacks(48, 4, AggregateEventAnalysisEngineIntegrationTest.criteria.get("dp2")!);
		this.assertEventsAndAttacks(0, 1, AggregateEventAnalysisEngineIntegrationTest.criteria.get("rule6")!);

		//DP2 - trigger attack
		await this.generateEvents(this.sleepAmount*12, AggregateEventAnalysisEngineIntegrationTest.detectionPoint2, 12, "rule6");
		this.assertEventsAndAttacks(60, 5, AggregateEventAnalysisEngineIntegrationTest.criteria.get("dp2")!);
		this.assertEventsAndAttacks(0, 2, AggregateEventAnalysisEngineIntegrationTest.criteria.get("rule6")!);

		console.log('<- test6_DP1thenDP2thenDP1orDP2');
	}

	// test the scheduling bug
	// @Test
	public test7_DP1andDP4orDP1andDP3thenDP1(): void {
		console.log('-> test7_DP1andDP4orDP1andDP3thenDP1');

		let time = new Date(100 * 60 * 60 * 1000);
		const ruleCriteria = new SearchCriteria().
			setUser(AggregateEventAnalysisEngineIntegrationTest.bob).
			setRule(AggregateEventAnalysisEngineIntegrationTest.rules[6]).
			setDetectionSystemIds(AggregateEventAnalysisEngineIntegrationTest.detectionSystems1);

        this.setRule(this.appSensorServer, AggregateEventAnalysisEngineIntegrationTest.rules[6]);

		this.addEvent(AggregateEventAnalysisEngineIntegrationTest.detectionPoint1, time);
		this.addEvent(AggregateEventAnalysisEngineIntegrationTest.detectionPoint1, new Date(time.getTime() + 1 * 60 * 1000));
		this.addEvent(AggregateEventAnalysisEngineIntegrationTest.detectionPoint1, new Date(time.getTime() + 2 * 60 * 1000));
		this.addEvent(AggregateEventAnalysisEngineIntegrationTest.detectionPoint4, new Date(time.getTime() + 3 * 60 * 1000));
		this.addEvent(AggregateEventAnalysisEngineIntegrationTest.detectionPoint4, new Date(time.getTime() + 4 * 60 * 1000));
		this.addEvent(AggregateEventAnalysisEngineIntegrationTest.detectionPoint4, new Date(time.getTime() + 5 * 60 * 1000));
		this.addEvent(AggregateEventAnalysisEngineIntegrationTest.detectionPoint4, new Date(time.getTime() + 6 * 60 * 1000));
		this.addEvent(AggregateEventAnalysisEngineIntegrationTest.detectionPoint1, new Date(time.getTime() + 8 * 60 * 1000));
		this.addEvent(AggregateEventAnalysisEngineIntegrationTest.detectionPoint1, new Date(time.getTime() + 9 * 60 * 1000));
		this.addEvent(AggregateEventAnalysisEngineIntegrationTest.detectionPoint1, new Date(time.getTime() + 10 * 60 * 1000));

		assert.equal(1, this.appSensorServer!.getAttackStore()!.findAttacks(ruleCriteria).length);

		time = new Date(time.getTime() + 1 * 60 * 60 * 1000);

		this.addEvent(AggregateEventAnalysisEngineIntegrationTest.detectionPoint1, time);
		this.addEvent(AggregateEventAnalysisEngineIntegrationTest.detectionPoint1, new Date(time.getTime() + 2 * 60 * 1000));
		this.addEvent(AggregateEventAnalysisEngineIntegrationTest.detectionPoint4, new Date(time.getTime() + 2 * 60 * 1000));
		this.addEvent(AggregateEventAnalysisEngineIntegrationTest.detectionPoint1, new Date(time.getTime() + 3 * 60 * 1000));
		this.addEvent(AggregateEventAnalysisEngineIntegrationTest.detectionPoint4, new Date(time.getTime() + 3 * 60 * 1000));
		this.addEvent(AggregateEventAnalysisEngineIntegrationTest.detectionPoint3, new Date(time.getTime() + 3 * 60 * 1000));
		this.addEvent(AggregateEventAnalysisEngineIntegrationTest.detectionPoint3, new Date(time.getTime() + 3 * 60 * 1000 + 30 * 1000));
		this.addEvent(AggregateEventAnalysisEngineIntegrationTest.detectionPoint4, new Date(time.getTime() + 4 * 60 * 1000));
		this.addEvent(AggregateEventAnalysisEngineIntegrationTest.detectionPoint3, new Date(time.getTime() + 4 * 60 * 1000));
		this.addEvent(AggregateEventAnalysisEngineIntegrationTest.detectionPoint3, new Date(time.getTime() + 4 * 60 * 1000 + 30 * 1000));
		this.addEvent(AggregateEventAnalysisEngineIntegrationTest.detectionPoint3, new Date(time.getTime() + 5 * 60 * 1000));
		this.addEvent(AggregateEventAnalysisEngineIntegrationTest.detectionPoint3, new Date(time.getTime() + 5 * 60 * 1000 + 30 * 1000));
		this.addEvent(AggregateEventAnalysisEngineIntegrationTest.detectionPoint3, new Date(time.getTime() + 6 * 60 * 1000));
		this.addEvent(AggregateEventAnalysisEngineIntegrationTest.detectionPoint3, new Date(time.getTime() + 6 * 60 * 1000 + 30 * 1000));
		this.addEvent(AggregateEventAnalysisEngineIntegrationTest.detectionPoint3, new Date(time.getTime() + 7 * 60 * 1000));
		this.addEvent(AggregateEventAnalysisEngineIntegrationTest.detectionPoint3, new Date(time.getTime() + 7 * 60 * 1000 + 30 * 1000));
		this.addEvent(AggregateEventAnalysisEngineIntegrationTest.detectionPoint3, new Date(time.getTime() + 8 * 60 * 1000));
		this.addEvent(AggregateEventAnalysisEngineIntegrationTest.detectionPoint3, new Date(time.getTime() + 8 * 60 * 1000 + 30 * 1000));
		this.addEvent(AggregateEventAnalysisEngineIntegrationTest.detectionPoint3, new Date(time.getTime() + 9 * 60 * 1000));
		this.addEvent(AggregateEventAnalysisEngineIntegrationTest.detectionPoint4, new Date(time.getTime() + 11 * 60 * 1000));
		this.addEvent(AggregateEventAnalysisEngineIntegrationTest.detectionPoint1, new Date(time.getTime() + 13 * 60 * 1000));
		this.addEvent(AggregateEventAnalysisEngineIntegrationTest.detectionPoint1, new Date(time.getTime() + 14 * 60 * 1000));
		this.addEvent(AggregateEventAnalysisEngineIntegrationTest.detectionPoint1, new Date(time.getTime() + 15 * 60 * 1000));

		assert.equal(2, this.appSensorServer!.getAttackStore()!.findAttacks(ruleCriteria).length);

		console.log('<- test7_DP1andDP4orDP1andDP3thenDP1');
	}

	// test the earliest attack bug
		// @Test
    public test8_DP1(): void {
		console.log('-> test8_DP1');

        let time = new Date(100 * 60 * 60 * 1000);
        const ruleCriteria = new SearchCriteria().
            setUser(AggregateEventAnalysisEngineIntegrationTest.bob).
            setRule(AggregateEventAnalysisEngineIntegrationTest.rules[0]).
            setDetectionSystemIds(AggregateEventAnalysisEngineIntegrationTest.detectionSystems1);

        this.setRule(this.appSensorServer, AggregateEventAnalysisEngineIntegrationTest.rules[0]);

        this.addEvent(AggregateEventAnalysisEngineIntegrationTest.detectionPoint1, time);
        this.addEvent(AggregateEventAnalysisEngineIntegrationTest.detectionPoint1, new Date(time.getTime() + 1 * 60 * 1000));
        this.addEvent(AggregateEventAnalysisEngineIntegrationTest.detectionPoint1, new Date(time.getTime() + 2));

        assert.equal(1, this.appSensorServer!.getAttackStore()!.findAttacks(ruleCriteria).length);

        this.addEvent(AggregateEventAnalysisEngineIntegrationTest.detectionPoint1, new Date(time.getTime() + 3 * 60 * 1000));
        this.addEvent(AggregateEventAnalysisEngineIntegrationTest.detectionPoint1, new Date(time.getTime() + 4 * 60 * 1000));

        assert.equal(1, this.appSensorServer!.getAttackStore()!.findAttacks(ruleCriteria).length);

        time = new Date(time.getTime() + 1 * 60 * 60 * 1000);

        this.addEvent(AggregateEventAnalysisEngineIntegrationTest.detectionPoint1, time);

        assert.equal(1, this.appSensorServer!.getAttackStore()!.findAttacks(ruleCriteria).length);

        this.addEvent(AggregateEventAnalysisEngineIntegrationTest.detectionPoint1, new Date(time.getTime() + 1 * 60 * 1000));
        this.addEvent(AggregateEventAnalysisEngineIntegrationTest.detectionPoint1, new Date(time.getTime() + 2 * 60 * 1000));

        assert.equal(2, this.appSensorServer!.getAttackStore()!.findAttacks(ruleCriteria).length);

		console.log('<- test8_DP1');
    }

	public static async runTests() {
		console.log('Run AggregateEventAnalysisEngineIntegrationTest');
		const instance = new AggregateEventAnalysisEngineIntegrationTest();

		instance.initializeTest();
		await instance.test1_DP1();

		instance.initializeTest();
		await instance.test2_DP1andDP2();

		instance.initializeTest();
		await instance.test3_DP1orDP2();

		instance.initializeTest();
		await instance.test4_DP1orDP2andDP3();

		instance.initializeTest();
		await instance.test5_DP1thenDP2();

		instance.initializeTest();
		await instance.test6_DP1thenDP2thenDP1orDP2();

		instance.initializeTest();
		instance.test7_DP1andDP4orDP1andDP3thenDP1();

		instance.initializeTest();
		instance.test8_DP1();
	}

}

export {AggregateEventAnalysisEngineIntegrationTest};