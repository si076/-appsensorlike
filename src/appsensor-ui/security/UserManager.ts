import { MySQLUserDetailsService } from "./mysql/MySQLUserDetailsService.js";
import { UserDetails, UserDetailsService } from "./UserDetailsService.js";

import {LRUCache} from 'lru-cache';

class UserManager implements UserDetailsService {

    private delegate: UserDetailsService;
    private lruCache: LRUCache<string, UserDetails>;

    constructor(delegate: UserDetailsService | null = null) {
        if (delegate) {
            this.delegate = delegate;
        } else {
            this.delegate = new MySQLUserDetailsService();
        }

        const options : LRUCache.OptionsSizeLimit<string, UserDetails, unknown> = {
            maxSize: 10485760, //10Mb
            sizeCalculation: this.roughSizeOfObject
        };

        this.lruCache = new LRUCache<string, UserDetails>(options);
    }

    private roughSizeOfObject<K, V>(value: V, key: K): LRUCache.Size {
        const objectList = [];
        const stack = [value];
        const bytes = [0];
        while (stack.length) {
          const _value: any = stack.pop();
          if (_value == null) bytes[0] += 4;
          else if (typeof _value === 'boolean') bytes[0] += 4;
          else if (typeof _value === 'string') bytes[0] += _value.length * 2;
          else if (typeof _value === 'number') bytes[0] += 8;
          else if (typeof _value === 'object' && objectList.indexOf(_value) === -1) {
            objectList.push(_value);
            if (typeof _value.byteLength === 'number') bytes[0] += _value.byteLength;
            else if (_value[Symbol.iterator]) {
              // eslint-disable-next-line no-restricted-syntax
              for (const v of _value) stack.push(v);
            } else {
              Object.keys(_value).forEach(k => { 
                 bytes[0] += k.length * 2; stack.push(_value[k]);
              });
            }
          }
        }
        // console.log('roughSizeOfObject: ' + bytes[0] + ' bytes');
        return bytes[0];
    }    

    async loadUserByUsername(username: string): Promise<UserDetails | null> {
        let userDetails: UserDetails | null | undefined = this.lruCache.get(username);
        if (userDetails) {
            return Promise.resolve(userDetails);
        } else {
            userDetails = await this.delegate.loadUserByUsername(username);

            if (userDetails) {
                this.lruCache.set(username, userDetails);

                return Promise.resolve(userDetails);
            } else {
                return Promise.resolve(null);
            }

        }
        
    }

    logoutUser(username: string) {
        this.lruCache.delete(username);
    }

    

}

export {UserManager};