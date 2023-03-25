import { IPAddress } from "../core.js";

import * as assert from 'assert';

import ipaddrlib from 'ipaddr.js';

class IPAddressTests {
	
	static ipAddress: IPAddress = new IPAddress();

	// @Test(expected=java.lang.IllegalArgumentException.class)
	public static testFromStringInvalidFormat(): void {
        const address = "1234";
        // this.ipAddress.fromString(address);
        // assert.throws(() => {
		//                 this.ipAddress.fromString(address);
        //               },
        //               {
        //                 name: "Error",
        //                 message: `IP Address string is invalid: ${address}`
        //               }
        // );
        let addr: ipaddrlib.IPv4 | ipaddrlib.IPv6 = ipaddrlib.parse(address);
        console.log(addr.toString());

        addr = ipaddrlib.parse("123.123.123.123");
        console.log(addr.toString());
	}
	
	// @Test(expected=java.lang.IllegalArgumentException.class)
	public static testFromStringInvalidAddress(): void {
        const address = "123.123.123.456";
        assert.throws(() => {
		                this.ipAddress.fromString(address);
                      },
                      {
                        name: "Error",
                        message: `IP Address string is invalid: ${address}`
                      }
        );
	}
	
	// @Test
	public static testFromStringValid(): void {
        assert.doesNotThrow(() => {
            this.ipAddress.fromString("1.2.3.4");
        });
		
        assert.doesNotThrow(() => {
            this.ipAddress.fromString("255.255.255.255");
        });
		
        assert.doesNotThrow(() => {
            this.ipAddress.fromString("2001:cdba:0000:0000:0000:0000:3257:9652");
        });
		
        assert.doesNotThrow(() => {
            this.ipAddress.fromString("2001:cdba:0:0:0:0:3257:9652");
        });
		
        assert.doesNotThrow(() => {
            this.ipAddress.fromString("2001:cdba::3257:9652");
        });
		
	}
	
	// @Test
	// public testAsInetAddress(): void {
	// 	const a1: IPAddress = this.ipAddress.fromString("1.2.3.4");
	// 	Assert.assertEquals("1.2.3.4", a1.asInetAddress().getHostAddress());
	// 	const a2: IPAddress = this.ipAddress.fromString("255.255.255.255");
	// 	Assert.assertEquals("255.255.255.255", a2.asInetAddress().getHostAddress());
	// 	const a3: IPAddress = this.ipAddress.fromString("2001:cdba:0000:0000:0000:0000:3257:9652");
	// 	Assert.assertEquals("2001:cdba:0:0:0:0:3257:9652", a3.asInetAddress().getHostAddress());
	// 	const a4: IPAddress = this.ipAddress.fromString("2001:cdba:0:0:0:0:3257:9652");
	// 	Assert.assertEquals("2001:cdba:0:0:0:0:3257:9652", a4.asInetAddress().getHostAddress());
	// 	const a5: IPAddress = this.ipAddress.fromString("2001:cdba::3257:9652");
	// 	Assert.assertEquals("2001:cdba:0:0:0:0:3257:9652", a5.asInetAddress().getHostAddress());
	// }
	
    public static runTests() {
        console.log();
        console.log('-> Start of IPAddressTests');

        IPAddressTests.testFromStringInvalidFormat();
        IPAddressTests.testFromStringInvalidAddress();
        IPAddressTests.testFromStringValid();

        console.log('<- End of IPAddressTests');
    }
}

export {IPAddressTests};