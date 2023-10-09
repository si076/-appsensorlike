import { IPAddress, ObjectValidationError } from "../core.js";

import * as assert from 'assert';


class IPAddressTests {
	
	static ipAddress: IPAddress = new IPAddress();

	public static async testFromStringInvalidAddress() {
        const address = "123.123.123.456";

        await assert.rejects(IPAddress.fromString(address),
                             {
                                 name: "Error",
                                 message: `IP Address string is invalid: ${address}`
                             }
        );

        const ipAddress = new IPAddress(address);
        assert.throws(() => {
                        ipAddress.checkValidInitialize();
                      },
                      new ObjectValidationError("IP Address string is invalid: " + address, ipAddress)
        );
	}
	
	public static async testFromStringValid() {
        await assert.doesNotReject(IPAddress.fromString("localhost"));

        await assert.doesNotReject(IPAddress.fromString("1.2.3.4"));
		
        await assert.doesNotReject(IPAddress.fromString("255.255.255.255"));
		
        await assert.doesNotReject(IPAddress.fromString("2001:cdba:0000:0000:0000:0000:3257:9652"));
		
        await assert.doesNotReject(IPAddress.fromString("2001:cdba:0:0:0:0:3257:9652"));
		
        await assert.doesNotReject(IPAddress.fromString("2001:cdba::3257:9652"));
		
	}

    public static testEquality() {
        let ipv4_1 = new IPAddress("127.0.0.1");
        let ipv4_2 = new IPAddress("localhost");
        assert.equal(ipv4_1.equals(ipv4_2), true);

        let ipv6_1 = new IPAddress("::ffff:127.0.0.1");
        assert.equal(ipv6_1.equals(ipv4_1), true);

        ipv4_1 = new IPAddress("255.255.255.255");
        ipv4_2 = new IPAddress("255.255.255.255");
        assert.equal(ipv4_1.equals(ipv4_2), true);

        ipv4_1 = new IPAddress("200.0.0.1");
        ipv4_2 = new IPAddress("255.255.255.255");
        assert.equal(ipv4_1.equals(ipv4_2), false);


        ipv6_1 = new IPAddress("2001:cdba:0000:0000:0000:0000:3257:9652");
        let ipv6_2 = new IPAddress("2001:cdba:0:0:0:0:3257:9652");
        assert.equal(ipv6_1.equals(ipv6_2), true);

        ipv6_1 = new IPAddress("2001:cdba:0:0:0:0:3257:9652");
        assert.equal(ipv6_1.equals(ipv6_2), true);

        ipv6_2 = new IPAddress("2001:cdba::3257:9652");
        assert.equal(ipv6_1.equals(ipv6_2), true);

        ipv6_2 = new IPAddress("2001:db8:1234::1");
        assert.equal(ipv6_1.equals(ipv6_2), false);
    }
	
    public static async runTests() {
        console.log();
        console.log('-> Start of IPAddressTests');

        await IPAddressTests.testFromStringInvalidAddress();
        await IPAddressTests.testFromStringValid();
        IPAddressTests.testEquality();

        console.log('<- End of IPAddressTests');
    }
}

export {IPAddressTests};