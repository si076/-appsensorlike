# Changelog


## 0.30.0

**Changes:**

- Now more than one IP address can be specified in configuration file appsensor-server-config.json under ClientApplication.ipAddresses. If IPs are specified in this section, they restrict clients to only mentioned here. Patterns are not implemented yet. *This  is a breaking change for your configuration file! You have to change your configuration file if you have already specified any IP!*
- Added shell scripts for build, test, and publish.
- Updated dependencies due to found security vulnerabilities 

