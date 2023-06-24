/**
 * This exception is for anytime the configuration for appsensor is invalid.
 * 
 * This is used by the {@link ClientConfigurationReader}
 * and the {@link ServerConfigurationReader}
 */
 class ConfigurationException extends Error  {

	public constructor(message: string) {
		super(message);
	}
}

/**
 * This exception is meant to be thrown by the {@link RequestHandler}
 * when a {@link ClientApplication} is not providing appropriate
 * authentication credentials
 */
 class NotAuthenticatedException extends Error  {

	public constructor(message: string) {
		super(message);
	}
}

/**
 * This exception is thrown by the {@link AccessController}
 * when a {@link ClientApplication} is not authorized to perform a 
 * specific action
 */
 class NotAuthorizedException extends Error  {

	public constructor(message: string) {
		super(message);
	}
}

export {ConfigurationException, NotAuthenticatedException, NotAuthorizedException};