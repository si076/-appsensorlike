import { AttackAnalysisEngine, EventAnalysisEngine, ResponseAnalysisEngine } from "../../core/analysis/analysis.js";
import { AppSensorEvent, AppSensorServer, Attack, DetectionPoint, Interval, Response, Utils } from "../../core/core.js";
import { SearchCriteria } from "../../core/criteria/criteria.js";

class ReferenceAttackAnalysisEngine extends AttackAnalysisEngine {

	// private Logger logger;

	private appSensorServer: AppSensorServer = new AppSensorServer();

	public getAppSensorServer(): AppSensorServer {
		return this.appSensorServer;
	}

	public setAppSensorServer(appSensorServer: AppSensorServer): void {
		this.appSensorServer = appSensorServer;
	}
	
	/**
	 * This method analyzes {@link Attack} objects that are added
	 * to the system (either via direct addition or generated by the event analysis
	 * engine), generates an appropriate {@link Response} object,
	 * and adds it to the configured {@link ResponseStore}
	 *
	 * @param event the {@link Attack} that was added to the {@link AttackStore}
	 */
	// @Override
	public analyze(attack: Attack): void {
		if (attack !== null && attack.getDetectionPoint() !== null) {
			const response: Response = this.findAppropriateResponse(attack);

			if (response !== null) {
                let userName = '';
                const user = attack.getUser();
                if (user !== null) {
                    userName = user.getUsername();
                }
				console.info("Response set for user <" + userName  + "> - storing response action " + response.getAction());
                const responseStore = this.appSensorServer.getResponseStore();
                if (responseStore !== null) {
                    responseStore.addResponse(response);
                }
				
			}
		}
	}

	/**
	 * Find/generate {@link Response} appropriate for specified {@link Attack}.
	 *
	 * @param attack {@link Attack} that is being analyzed
	 * @return {@link Response} to be executed for given {@link Attack}
	 */
	protected findAppropriateResponse(attack: Attack): Response {
		const triggeringDetectionPoint: DetectionPoint | null = attack.getDetectionPoint();

        
		const criteria: SearchCriteria = new SearchCriteria().
				setUser(attack.getUser()).
				setDetectionPoint(triggeringDetectionPoint);

        const serverConfig = this.appSensorServer.getConfiguration();
        if (serverConfig !== null) {
            criteria.setDetectionSystemIds(serverConfig.getRelatedDetectionSystems(attack.getDetectionSystem()));
        }
				

		//grab any existing responses
        let existingResponses: Response[] = [];
        const responseStore = this.appSensorServer.getResponseStore();
        if (responseStore !== null) {
            existingResponses = responseStore.findResponses(criteria);
        }

		let responseAction: string = '';
		let interval: Interval | null | undefined = null; 

		const possibleResponses: Response[] = this.findPossibleResponses(triggeringDetectionPoint);

		if (existingResponses === null || existingResponses.length === 0) {
			//no responses yet, just grab first configured response from detection point
            if (possibleResponses.length > 0) {
                const response: Response = possibleResponses[0];

                responseAction = response.getAction();
                interval = response.getInterval();
                    
            }
		} else {
			for (const configuredResponse of possibleResponses) {
				responseAction = configuredResponse.getAction();
				interval = configuredResponse.getInterval();

				if (! this.isPreviousResponse(configuredResponse, existingResponses)) {
					//if we find that this response doesn't already exist, use it
					break;
				}

				//if we reach here, we will just use the last configured response (repeat last response)
			}
		}

		if(responseAction == null) {
            let label = Utils.getDetectionPointLabel(triggeringDetectionPoint);

			throw new Error("No appropriate response was configured for this detection point: " + label);
		}

		const response = new Response();
		response.setUser(attack.getUser());
		response.setTimestamp(attack.getTimestamp());
		response.setAction(responseAction);
		response.setInterval(interval);
		response.setDetectionSystem(attack.getDetectionSystem());

		return response;
	}

	/**
	 * Lookup configured {@link Response} objects for specified {@link DetectionPoint}
	 *
	 * @param triggeringDetectionPoint {@link DetectionPoint} that triggered {@link Attack}
	 * @return collection of {@link Response} objects for given {@link DetectionPoint}
	 */
	protected findPossibleResponses(triggeringDetectionPoint: DetectionPoint | null): Response[] {
		let possibleResponses: Response[] = [];

        const serverConfig = this.appSensorServer.getConfiguration();
        if (serverConfig !== null && triggeringDetectionPoint !== null) {
            for (const configuredDetectionPoint of serverConfig.getDetectionPoints()) {
                if (configuredDetectionPoint.typeAndThresholdMatches(triggeringDetectionPoint)) {
                    possibleResponses = configuredDetectionPoint.getResponses();
                    break;
                }
            }
        }

		return possibleResponses;
	}

	/**
	 * Test a given {@link Response} to see if it's been executed before.
	 *
	 * @param response {@link Response} to test to see if it's been executed before
	 * @param existingResponses set of previously executed {@link Response}s
	 * @return true if {@link Response} has been executed before
	 */
	protected isPreviousResponse(response: Response, existingResponses: Response[]): boolean {
		let previousResponse: boolean = false;

		for (const existingResponse of existingResponses) {
			if (response.getAction() === existingResponse.getAction()) {
				previousResponse = true;
			}
		}

		return previousResponse;
	}

}

class ReferenceEventAnalysisEngine extends EventAnalysisEngine {

	// private Logger logger;

	private appSensorServer: AppSensorServer = new AppSensorServer();

	public getAppSensorServer(): AppSensorServer {
		return this.appSensorServer;
	}

	public setAppSensorServer(appSensorServer: AppSensorServer): void {
		this.appSensorServer = appSensorServer;
	}

	/**
	 * This method analyzes statistical {@link Event}s that are added to the system and
	 * detects if the configured {@link Threshold} has been crossed. If so, an {@link Attack} is
	 * created and added to the system.
	 *
	 * @param event the {@link Event} that was added to the {@link EventStore}
	 */
	// @Override
	public analyze(event: AppSensorEvent): void {

		const criteria: SearchCriteria = new SearchCriteria().
				setUser(event.getUser()).
				setDetectionPoint(event.getDetectionPoint());

        const serverConfig = this.appSensorServer.getConfiguration();
        if (serverConfig !== null) {
            criteria.setDetectionSystemIds(serverConfig.getRelatedDetectionSystems(event.getDetectionSystem()));
        }
				

		// find all events matching this event for this user
		let existingEvents: AppSensorEvent[] = [];
        const eventStore = this.appSensorServer.getEventStore();
        if (eventStore !== null) {
            existingEvents = eventStore.findEvents(criteria);
        }
        

		let configuredDetectionPoints: DetectionPoint[] = [];
        if (serverConfig !== null) {
            let detectionSystemId: string | null = null;
            const detectionSystem = event.getDetectionSystem();
            if (detectionSystem) {
                detectionSystemId = detectionSystem.getDetectionSystemId()
            }
            
            configuredDetectionPoints = serverConfig.findDetectionPoints(event.getDetectionPoint(), detectionSystemId);
        }

		if (configuredDetectionPoints.length > 0) {

			for(const configuredDetectionPoint of configuredDetectionPoints) {

				// filter and count events that match this detection point (filtering by threshold)
				// and that are after the most recent attack (filter by timestamp)
				let eventCount: number = this.countEvents(existingEvents, event, configuredDetectionPoint);

				// if the event count is 0, reset to 1 -> we know at least 1 event has occurred (the one we're considering)
				// this can occur sometimes when testing with dates out of the given range or due to clock drift
				if (eventCount == 0) {
					eventCount = 1;
				}

				// examples for the below code
				// 1. count is 5, t.count is 10 (5%10 = 5, No Violation)
				// 2. count is 45, t.count is 10 (45%10 = 5, No Violation)
				// 3. count is 10, t.count is 10 (10%10 = 0, Violation Observed)
				// 4. count is 30, t.count is 10 (30%10 = 0, Violation Observed)

				let thresholdCount = 0;

                const threshold = configuredDetectionPoint.getThreshold();
                if (threshold) {
                    thresholdCount = threshold.getCount();
                }

				if (eventCount % thresholdCount == 0) {
                    let userName = '';
                    const user = event.getUser();
                    if (user !== null) {
                        userName = user.getUsername();
                    }
					console.info("Violation Observed for user <" + userName + "> - storing attack");

					//have determined this event triggers attack
					//ensure appropriate detection point is being used (associated responses, etc.)
					const attack: Attack = new Attack(null,
							event.getUser(),
							configuredDetectionPoint,
							event.getTimestamp(),
							event.getDetectionSystem(),
							event.getResource()
							);

                    const attackStore = this.appSensorServer.getAttackStore();
                    if (attackStore !== null) {
                        attackStore.addAttack(attack);
                    }
					
				}
			}
		} else {
            const label = Utils.getDetectionPointLabel(event.getDetectionPoint());
            
			console.error("Could not find detection point configured for this type: " + label);
		}
	}

	/**
	 * Count the number of {@link Event}s over a time {@link Interval} specified in milliseconds.
	 *
	 * @param existingEvents set of {@link Event}s matching triggering {@link Event} id/user pulled from {@link Event} storage
	 * @param triggeringEvent the {@link Event} that triggered analysis
	 * @param configuredDetectionPoint the {@link DetectionPoint} we are currently considering
	 * @return number of {@link Event}s matching time {@link Interval} and configured {@link DetectionPoint}
	 */
	protected countEvents(existingEvents: AppSensorEvent[], 
                          triggeringEvent: AppSensorEvent, 
                          configuredDetectionPoint: DetectionPoint): number {
		let count: number = 0;

		let intervalInMillis: number = 0;
        const threshold = configuredDetectionPoint.getThreshold();
        if (threshold !== null) {
            const interval = threshold.getInterval();
            if (interval !== null) {
                intervalInMillis = interval.toMillis();
            }
        }

		//grab the startTime to begin counting from based on the current time - interval
		const startTime: Date = new Date(Date.now() - intervalInMillis);

		//count events after most recent attack.
		const mostRecentAttackTime: Date = this.findMostRecentAttackTime(triggeringEvent, configuredDetectionPoint);

		for (const event of existingEvents) {

			const eventTimestamp: Date = event.getTimestamp();
			//ensure only events that have occurred since the last attack are considered
			if (eventTimestamp.getTime() > mostRecentAttackTime.getTime()) {
				if (intervalInMillis > 0) {
					if (eventTimestamp.getTime() > startTime.getTime()) {
						//only increment when event occurs within specified interval
						count++;
					}
				} else {
					//no interval - all events considered
					count++;
				}
			}
		}

		return count;
	}

	/**
	 * Find most recent {@link Attack} matching the given {@link Event} {@link User}, {@link DetectionPoint}
	 * matching the currently configured detection point (supporting multiple detection points per label),
	 * detection system and find it's timestamp.
	 *
	 * The {@link Event} should only be counted if they've occurred after the most recent {@link Attack}.
	 *
	 * @param event {@link Event} to use to find matching {@link Attack}s
	 * @param configuredDetectionPoint {@link DetectionPoint} to use to find matching {@link Attack}s
	 * @return timestamp representing last matching {@link Attack}, or -1L if not found
	 */
	protected findMostRecentAttackTime(event: AppSensorEvent, configuredDetectionPoint: DetectionPoint): Date {
		let newest: Date = new Date(0);

		const criteria: SearchCriteria = new SearchCriteria().
				setUser(event.getUser()).
				setDetectionPoint(configuredDetectionPoint);
        const serverConfig = this.appSensorServer.getConfiguration();
        if (serverConfig !== null) {
            criteria.setDetectionSystemIds(serverConfig.getRelatedDetectionSystems(event.getDetectionSystem()));
        }
				
        const attackStore = this.appSensorServer.getAttackStore();
        if (attackStore !== null) {
            const attacks: Attack[] = attackStore.findAttacks(criteria);

            for (const attack of attacks) {
				const attackTimestamp = attack.getTimestamp();

				if (attackTimestamp.getTime() > newest.getTime()) {
					newest = new Date(attackTimestamp);
				}
					
            }
        }

		return newest;
	}

}

class ReferenceResponseAnalysisEngine extends ResponseAnalysisEngine {

	// private Logger logger;
	
	/**
	 * This method simply logs responses.
	 * 
	 * @param response {@link Response} that has been added to the {@link ResponseStore}.
	 */
	// @Override
	public analyze(response: Response): void {
		if (response != null) {
            let userName = Utils.getUserName(response.getUser());

			console.info("NO-OP Response for user <" + userName + "> - should be executing response action " + response.getAction());
		}
	}
	
}

export {ReferenceAttackAnalysisEngine, ReferenceEventAnalysisEngine, ReferenceResponseAnalysisEngine};