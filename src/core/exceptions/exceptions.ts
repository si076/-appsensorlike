class ConfigurationException extends Error  {

	public constructor(message: string) {
		super(message);
	}
}

class NotAuthenticatedException extends Error  {

	public constructor(message: string) {
		super(message);
	}
}

class NotAuthorizedException extends Error  {

	public constructor(message: string) {
		super(message);
	}
}

export {ConfigurationException, NotAuthenticatedException, NotAuthorizedException};