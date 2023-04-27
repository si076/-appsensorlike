import { format, PoolConnection, MysqlError } from "mysql";
import * as _core from "../../core/core.js";
import * as _geolocation from "../../core/geolocation/geolocation.js";
import * as _rule from "../../core/rule/rule.js";
import { ConnectionManager } from "./connection_manager.js";
import { IArrayStoreTable, IPropertyMap, Mapping, MappingReader } from "./mapping.js";
import { Utils } from './utils.js'

import { v4 as uuidv4 } from 'uuid';
import EventEmitter from "events";

class Graph {
    private ADJACENCY_MATRIX: number[][] = [];

    constructor(nodeCount: number) {
        this.initMatrix(nodeCount);
    }

    private initMatrix(nodeCount: number) {
        for (let i = 0; i < nodeCount; i++) {

            const row: number[] = [];
            for (let j = 0; j < nodeCount; j++) {
                row.push(0);
            }

            this.ADJACENCY_MATRIX.push(row);    
        }
    }

    public getNodesWithNoIncomingEdges(): number[] {
        const edges: number[] = [];
        for (let i = 0; i < this.ADJACENCY_MATRIX.length; i++) {
            let noIncomEdges = true;
            for (let j = 0; j < this.ADJACENCY_MATRIX.length; j++) {
                if (i === j) {
                    continue;
                }

                const el = this.ADJACENCY_MATRIX[j][i];
                if (el === 1) {
                    noIncomEdges = false;
                    break;
                }
            }

            if (noIncomEdges) {
                edges.push(i);
            }
        }

        return edges;
    }

    public getDependentNodes(i: number): number[] {
        const dependentNodes: number[] = [];

        for (let j = 0; j < this.ADJACENCY_MATRIX.length; j++) {
            if (i === j) {
                continue;
            }

            const el = this.ADJACENCY_MATRIX[i][j];
            if (el === 1) {
                dependentNodes.push(j);
            }
        }

        return dependentNodes;
    }

    public addEdge(i: number, j: number) {
        this.ADJACENCY_MATRIX[i][j] = 1;
    }

    public removeEdge(i: number, j: number) {
        this.ADJACENCY_MATRIX[i][j] = 0;
    }

    public hasIncomingEdges(i: number): boolean {

        let hasIncomEdges = false;
        for (let j = 0; j < this.ADJACENCY_MATRIX.length; j++) {
            if (i === j) {
                continue;
            }

            const el = this.ADJACENCY_MATRIX[j][i];
            if (el === 1) {
                hasIncomEdges = true;
                break;
            }
        }

        return hasIncomEdges;
    }

    public graphHasEdges(): boolean {

        for (let i = 0; i < this.ADJACENCY_MATRIX.length; i++) {
            for (let j = 0; j < this.ADJACENCY_MATRIX.length; j++) {
                if (i === j) {
                    continue;
                }

                const el = this.ADJACENCY_MATRIX[i][j];
                if (el === 1) {
                    return true;
                }
            }
        }

        return false;
    }

}

type TYPE_COMPARE_FUNCTION = (obj1: Object, obj2: Object) => boolean;
type TYPE_FILTER_FUNCTION = (obj: Object) => boolean;

class DOP {

    private static cachedObjects = new Map<string, Map<number | string, Object>>();

    private static mapping: Mapping | null;

    private static CLASS_NAMES: string[] = [];
    private static TOPOLOGICALLY_SORTED_CLASS_NAMES: string[] = [];

    private static CACHE_LOADED: boolean = false;
    private static CACHE_LOADED_EVENT = "CACHE_LOADED_EVENT";
    private static EVENT_EMITTER: EventEmitter = new EventEmitter();

    private static UNDEFINED_PROP: string    = "<<<undefined>>>"

    // private static excludedPropertiesFromCompareMap = new Map<string, string[]>();
    // private static onlyPropertiesToCompareMap = new Map<string, string[]>();

    static { 
        DOP.mapping = new MappingReader().read();

        if (DOP.mapping) {

            DOP.resolveDependecies();
            //reload the cache on restart 
            //loads objects that don't depend on time
            ConnectionManager.getPool().getConnection((err, connection) => {
                if (err) {
                    
                    throw err;
                }

                DOP.loadCacheFromDB(connection);
            });
            
        }
        
    }

    public static isCacheLoaded(): boolean {
        return DOP.CACHE_LOADED
    }

    public static addCacheLoadedListener(func: () => Promise<void>) {
        DOP.EVENT_EMITTER.on(DOP.CACHE_LOADED_EVENT, func);
    }

    private static resolveDependecies() {
        if (DOP.mapping) {
            DOP.CLASS_NAMES = DOP.mapping.getClassNames();

            const graph = new Graph(DOP.CLASS_NAMES.length);

            for (let i = 0; i < DOP.CLASS_NAMES.length; i++) {

                const className = DOP.CLASS_NAMES[i];

                const propNames = DOP.mapping.getMappedClassPropertyNames(className);
                for (let p = 0; p < propNames.length; p++) {
                    const propMap = DOP.mapping.getPropertyMap(className, propNames[p]);
                    if (propMap && propMap.class) {
                        
                        if (propMap.class === 'Date') {
                            //mark timestamp fields 
                            //we have special conversion for datetime field
                            continue;
                        }

                        let referedClass = propMap.class;
                        if (referedClass === 'Array') {
                            if (!propMap.arrayElementClass) {
                                
                                continue;

                            }
                            referedClass = propMap.arrayElementClass;
                        }

                        const index = DOP.CLASS_NAMES.indexOf(referedClass);

                        if (index === -1) {
                            throw new Error(`Unmapped class '${referedClass}' is refered in the mapping!`);  
                        } else if (index === i) {
                            throw new Error(`Class '${referedClass}' in property '${propNames[p]}' refers to itself!`);
                        }

                        //there is an edge from class at DOP.CLASS_NAMES[index] to class at DOP.CLASS_NAMES[i]
                        graph.addEdge(index, i);
                    }
                }
            }

            const nodesWithNoIncomingEdges = graph.getNodesWithNoIncomingEdges();

            while (nodesWithNoIncomingEdges.length > 0) {
                const node = nodesWithNoIncomingEdges.shift();

                if (node !== undefined) {
                    DOP.TOPOLOGICALLY_SORTED_CLASS_NAMES.push(DOP.CLASS_NAMES[node]);

                    const dependentNodes = graph.getDependentNodes(node);

                    for (let d = 0; d < dependentNodes.length; d++) {
                        const dependentNode = dependentNodes[d];
                        
                        graph.removeEdge(node, dependentNode);

                        if (!graph.hasIncomingEdges(dependentNode)) {
                            nodesWithNoIncomingEdges.push(dependentNode);
                        }
                    }
                }
            }

            if (graph.graphHasEdges()) {
                throw new Error("There is a circular dependency between mapped classes!");
            }
        }
    }


    private static propertySetter = <U extends keyof T, T extends object>(obj: T) => (key: U, value: any) => { obj[key] = value };

    private static createObjectOfClass(className: string): Object {
        let obj: Object | null = null;
        let retry = 0;
        while (retry < 3) {
            try {
                switch (retry) {
                    case 0:
                        obj = new (_core as any)[className]();
                        break;
                    case 1:
                        obj = new (_geolocation as any)[className]();
                        break;
                    case 2:
                        obj = new (_rule as any)[className]();
                        break;
                            
                }
                if (obj) {
                    break;
                }
            } catch (error) {
                if (error instanceof TypeError) {
                    retry++;    
                } else {
                    throw error;
                }
                
            }
        }

        if (!obj) {
            throw new Error(`Cannot create instance of class '${className}' because the class hasn't been found!`);
        }

        return obj;
    }

    private static async loadCacheFromDB(connection: PoolConnection) {
        // console.debug('--> loadCacheFromDB');

        if (DOP.mapping) {
            for (let c = 0; c < DOP.TOPOLOGICALLY_SORTED_CLASS_NAMES.length; c++) {
                const className = DOP.TOPOLOGICALLY_SORTED_CLASS_NAMES[c];
                
                if (!DOP.mapping.isClassCachable(className)) {
                    continue;
                }

                const tableName = DOP.mapping.getTableName(className);

                let sql = "select * from `" + tableName + "`";

                const obj = DOP.createObjectOfClass(className);
        
                await Utils.executeSQLOnDBProcResAsync(sql, 
                    (results, resolve) => {
                        DOP.createAndCacheObjectsFromResult(obj, "id", results, DOP.propertySetter, connection, resolve);
                    
                    }, 
                    connection);
            }
        }

        // console.debug('<-- loadCacheFromDB');

        DOP.CACHE_LOADED = true;

        DOP.EVENT_EMITTER.emit(DOP.CACHE_LOADED_EVENT);
    }


    private static async createAndCacheObjectsFromResult<U extends keyof T, T extends object>(obj: T, 
                                                                     idColumnName: string,
                                                                     results: any, 
                                                                     propSetter: ( (obj: T) => ( (key: U, value: any) => void )),
                                                                     connection: PoolConnection,
                                                                     resolve: (value: Object[] | PromiseLike<Object[]>) => void): Promise<Object[]> {
        const result: Object[] = [];                                                                 

        const className = obj.constructor.name;

        if (DOP.mapping && results instanceof Array) {
            for (let i = 0; i < results.length; i++) {
                const element = results[i];
                
                const newObject =  Object.create(obj);

                const keys: string[] = DOP.mapping.getMappedClassPropertyNames(className);

                for (let index = 0; index < keys.length; index++) {
                    const key = keys[index];
                    
                    const propMap = DOP.mapping.getPropertyMap(className, key);
        
                    if (propMap) {
        
                        const columnName = propMap.column;

                        const columnValue = element[columnName];

                        let value = columnValue;

                        if (!(columnValue === DOP.UNDEFINED_PROP)) {
                            
                            if (propMap.class) {
                                if (propMap.class === "Array") {
                                    //load the values from the table for arrays
                                    //expected 
                                    
                                    value = await DOP.createAndCacheArrayTable(className, key, columnValue, propMap, connection);

                                } else if (propMap.class === "Date") {

                                    let dateStr: string = columnValue;
                                    dateStr += 'Z';
                                    dateStr = dateStr.replace(' ', 'T');

                                    value = new Date(dateStr);
                                } else {
                                    //look up cache for already loaded objects since we at first 
                                    //resolve dependencies and load in topological order objects from the db
                                    
                                    value = DOP.getCachedObjectForId(propMap.class, columnValue);
                                }
                            }
                            
                            propSetter(newObject)(key as U, value);
                        }
                    }
                }

                (newObject as _core.IValidate).checkValid();

                if (DOP.mapping.isClassCachable(className)) {
                    DOP.putInCache(className, element[idColumnName], newObject);
                }

                result.push(newObject);
            }

            resolve(result);
        } else {
                console.error(`Cannot create objects for class '${className}' because of internal error!`);
        }

        return result;
    }

    private static async createAndCacheArrayTable(className: string,
                                                  propName: string,
                                                  uuid: string, 
                                                  propMap: IPropertyMap,
                                                  connection: PoolConnection) {
        const array: any[] = [];
        if (DOP.mapping && uuid !== null) {
            const tableForArry = propMap.arrayTable;                                            

            if (!tableForArry) {
                throw new Error(`array table name hasn't been specified in the mapping under classesToTablesMap/${className}/properties/${propName}'!`);
            }

            const tableColumnsDef: IArrayStoreTable | null = DOP.mapping.getArrayTableDef(tableForArry);
                
            if (tableColumnsDef) {
                
                let sql = `select ${tableColumnsDef.valueColumnName} from ${tableForArry} where ${tableColumnsDef.uuidColumnName} = '${uuid}'`;

                
                await Utils.executeSQLOnDB(sql, 
                                            (results: any[]) => {
                                                const arrayElementClass = propMap.arrayElementClass; //just to convince TS that propMap.arrayElementClass won't change in the meantime 

                                                results.forEach(element => {
                                                    const propDescr = Object.getOwnPropertyDescriptor(element, tableColumnsDef.valueColumnName);
                                                    if (propDescr) {
                                                        if (arrayElementClass) {
                                                            //element should be the id of already cached object
                                                            const obj = DOP.getCachedObjectForId(arrayElementClass, propDescr.value);
                                                            array.push(obj);
                                                        } else {
                                                            array.push(propDescr.value);
                                                        }
                                                    }
                                                });
                                                
                                            }, 
                                            connection);
                
                DOP.putInCache("Array", uuid, array);

            } else {
                throw new Error(`table '${tableForArry}' definition hasn't been found in the mapping under arrayTables!`);
            }
        }

        return array;
    }

    private static compareOnMappedProps(obj1: Object, obj2: Object): boolean {
        let equal = false;

        if (DOP.mapping) {

            let obj = obj1;
            if (obj1 instanceof Array && obj2 instanceof Array) {
                //elements are expected to be of the same type
                //since we compare properties of objects of the same class

                if (obj1.length > 0 && obj1[0] instanceof Object) {

                    obj = obj1[0];

                } else if (obj1.length === 0 && obj2.length === 0) {

                    return true;

                } else {
                    //different length or elements are not objects
                    //we expect in this comparison only arrays with objects
                    //
                    return false;
                }
                
            }

            const propertyNamesMap = DOP.mapping.getMappedClassPropertyNamesMap();
            
            
            equal =  ((obj1 instanceof Array && obj2 instanceof Array &&
                       _core.Utils.equalsArrayEntitysOnProperties(obj1, obj2, propertyNamesMap, _core.Utils.allOrOnlySpecifiedProperties)) || 
                      _core.Utils.equalsOnProperties(obj1, obj2, propertyNamesMap, _core.Utils.allOrOnlySpecifiedProperties));
        }

        return equal;
    }

    //for test purpose only
    public static clearCache() {
        DOP.cachedObjects.clear();
    }

    private static putInCache(className: string, id: number | string, obj: Object) {
        let idObjMap = DOP.cachedObjects.get(className);

        if (!idObjMap) {
            idObjMap = new Map<number | string, Object>();
            DOP.cachedObjects.set(className, idObjMap);
        }

        idObjMap.set(id, obj);

        // console.debug(`<-- putInCache: object of class: ${className}, with id: ${id}`);
    }

    private static getCachedObjectId(obj: Object, 
                                    compareFunc: TYPE_COMPARE_FUNCTION): number | string | null {
        let id = null;

        const className = obj.constructor.name;

        const idObjMap = DOP.cachedObjects.get(className);
        if (idObjMap) {
            const entries = idObjMap.entries();
            for (const entry of entries) {
                
                if (compareFunc(obj, entry[1])) {
                    id = entry[0];

                    break;
                }
            }
        }

        // console.debug(`<-- getCachedObjectId: class: ${className}, id: ${id}`);

        return id;
    }

    private static getCachedObjectIds(className: string, 
                                      filterFunc: TYPE_FILTER_FUNCTION): (number | string)[] {
        const result: (number | string)[] = [];

        const idObjMap = DOP.cachedObjects.get(className);
        if (idObjMap) {
            const entries = idObjMap.entries();
            for (const entry of entries) {
                
                if (filterFunc(entry[1])) {
                    result.push(entry[0]);
                }
            }
        }

        // console.debug(`<-- getCachedObjectIds: class: ${className}, result: ${result}`);

        return result;
    }

    private static getCachedObjectForId(className: string,
                                        id: number | string): Object | null {
        let obj: Object | null = null;

        const idObjMap = DOP.cachedObjects.get(className);
        if (idObjMap) {
            const entries = idObjMap.entries();
            for (const entry of entries) {
                
                if (id === entry[0]) {
                    obj = entry[1];

                    break;
                }
            }
        }

        const msg = obj ? 'found' : 'not found';
        // console.debug(`<-- getCachedObjectForId: class: ${className}, id: ${id}, object: ${msg}`);

        return obj;
    }

    public static async findObjects(className: string, propFilterFuncMap: Map<string, TYPE_FILTER_FUNCTION | string>): Promise<Object[]> {
        // console.debug('--> findObjects');

        let result: Object[] = [];

        if (DOP.mapping) {

            const tableName = DOP.mapping.getTableName(className);
            
            let sql = `select * from ${tableName}`
            
            if (propFilterFuncMap.size > 0) {
                sql += ' where '
            }

            const propsToCompare = propFilterFuncMap.keys();

            let execSQL = true;
            let i = -1;
            for (const propName of propsToCompare) {
                i++;

                if (i > 0) {
                    sql += ' AND '; 
                }

                const propMap = DOP.mapping.getPropertyMap(className, propName);
                if (propMap) {

                    const funcOrCondition = propFilterFuncMap.get(propName);
                    if (propMap.class && propMap.class !== 'Date') {

                        if (funcOrCondition && typeof funcOrCondition === "function") {
                            const ids = DOP.getCachedObjectIds(propMap.class, funcOrCondition);

                            //this acts as AND condition
                            //If for some specified property there are no results, we discontinue search
                            //it's like the search in base storage class isMatchingEvent method, but
                            //expressed with sql in order not to select all attacks, events and responses and loop on them
                            if (ids.length === 0) {
                                execSQL = false;

                                break;
                            }
                            
                            sql += propMap.column + ' in ' + '(' + ids.join(',') + ')';
                        } else {
                            throw new Error(`Expected filter function for  ${className}'s property ${propName}`);
                        }

                    } else {

                        if (funcOrCondition && typeof funcOrCondition === "string") {
                            sql += '(' + funcOrCondition + ')';
                        } else {
                            throw new Error(`Expected condition as string for ${className}'s property ${propName}`);
                        }

                    }

                } else {
                    throw new Error(`A mapping is not specified for ${className}'s property ${propName}`);
                }
            }

            if (execSQL) {
                const obj = DOP.createObjectOfClass(className);
        
                const connection: PoolConnection = await ConnectionManager.getConnection();

                result = await Utils.executeSQLOnDBProcResAsync(sql, 
                    (results, resolve) => {
                        let res: Object[] = [];

                        DOP.createAndCacheObjectsFromResult(obj, "id", results, DOP.propertySetter, connection, resolve);

                        //actual result is resolved thru resolve function
                        //
                        return res;
                    
                    }, 
                    connection);
                
            }

        }

        // console.debug('<-- findObjects');

        return result;
    }

    public static async persistMany(objs: _core.IEquals[], 
                                    //connetionErrorHandler: ((error: MysqlError) => void) = ConnectionManager.defaultErrorHandler
                                    ) {
        for (let i = 0; i < objs.length; i++) {
            await DOP.persist(objs[i]);
        }
    }

    
    public static async persist(obj: Object,
                                //connetionErrorHandler: ((error: MysqlError) => void) = ConnectionManager.defaultErrorHandler
                                ) {
        return await Utils.executeInTransaction(obj, DOP._persist);

    }   

    private static async _persist(obj: Object, 
                                  //connetionErrorHandler: ((error: MysqlError) => void) = ConnectionManager.defaultErrorHandler, 
                                  connection: PoolConnection): Promise<number | string | null> {
        const className = obj.constructor.name;

        // console.debug(`--> persist: obj of class '${className}'`);

        let id = DOP.getCachedObjectId(obj, DOP.compareOnMappedProps);

        if (id !== null) {
            return id;
        }

        if (DOP.mapping) {
            
            const keyValue = new Map<string, any>();

            const keys: string[] = DOP.mapping.getMappedClassPropertyNames(className);

            for (let index = 0; index < keys.length; index++) {
                const key = keys[index];
                
                const propMap = DOP.mapping.getPropertyMap(className, key);
                const propDescr = Object.getOwnPropertyDescriptor(obj, key);

                if (propMap) {

                    if (propDescr) {

                        if (propMap.class === 'Array') {
                        
                            const persistedObjID = await DOP.persistArray(className, 
                                                                        key,
                                                                        propDescr.value,
                                                                        connection);

                            keyValue.set(key, persistedObjID);
                                
                        } else if (propMap.class === 'Date') {
                            //special treatment because we want milliseconds as well to be stored
                            //msql driver library utilized here will convert Date object to string YYYY-mm-dd HH:ii:ss
                            //omitting milliseconds

                            const dateStr = propDescr.value.toISOString().replace('T', ' ').replace('Z', '');

                            keyValue.set(key, dateStr);

                        } else if (propMap.class && propDescr.value) {
            
                            const persistedObjID = await DOP._persist(propDescr.value, connection);

                            keyValue.set(key, persistedObjID);
                        } else {
                            keyValue.set(key, propDescr.value);
                        }

                    } else {

                        if (propMap.class) {
                            keyValue.set(key, null);
                        } else {
                            keyValue.set(key, DOP.UNDEFINED_PROP);
                        }
                    }
                }
            };


            const tableName = DOP.mapping.getTableName(className);

            let sql = "insert into `" + tableName + "` set ";

            let i = 0;

            const inserts = [];

            const keyValueEntries = keyValue.entries();
            for (const keyValueEntry of keyValueEntries) {

                let value = keyValueEntry[1];

                if (i > 0) {
                    sql += ',';
                }
                
                sql += ' ??=?';

                const columnName = DOP.mapping.getColumnName(className, keyValueEntry[0]);

                inserts.push(columnName, value);

                i++;
            }

            sql = format(sql, inserts);

            id = await Utils.executeSQLOnDB(sql, 
                                            (results) => {
                                                return results.insertId;
                                            }, 
                                            connection);

            if (DOP.mapping.isClassCachable(className) && id !== null) {
                //cache objects that are refered in other objects and don't depend on time
                DOP.putInCache(className, id, obj);
            }
        }

        // console.debug(`<-- persist: obj of class '${className}'`);

        return id;
    }

    private static async persistArray(className: string, 
                                      propName: string,
                                      array: any[],
                                      connection: PoolConnection): Promise<string | null> {
        // console.log('--> persistArray');

        let uuid: string | number | null = null;     
        if (array && array.length > 0) {
            uuid = DOP.getCachedObjectId(array, DOP.compareOnMappedProps);
        } else {
            return null;
        }                    
        
        if (uuid !== null) {
            return uuid as string;
        }

        const persistValues = [];
        for (let a = 0; a < array.length; a++) {
            const arEl = array[a];

            if (arEl instanceof Object) {
                const persistedObjID = await DOP._persist(arEl as _core.IEquals, connection);

                persistValues.push(persistedObjID);
            } else {
                persistValues.push(arEl);
            }
        }

        let tableForArry: string | null = null;

        if (DOP.mapping) {
            tableForArry = DOP.mapping.getArrayTableName(className, propName);                                            

            if (!tableForArry) {
                throw new Error(`array table name hasn't been specified in the mapping under classesToTablesMap/${className}/properties/${propName}'!`);
            }

            const tableColumnsDef: IArrayStoreTable | null = DOP.mapping.getArrayTableDef(tableForArry);
                
            if (tableColumnsDef) {
                
                uuid = uuidv4();

                let sql = `insert into ${tableForArry} (${tableColumnsDef.uuidColumnName}, ${tableColumnsDef.valueColumnName}) values `;

                for (let i = 0; i < persistValues.length; i++) {
                    if (i > 0) {
                        sql += `,`;
                    }

                    sql += `('${uuid}', '${persistValues[i]}')`; 
                }
            
                await Utils.executeSQLOnDB(sql, 
                                            (results) => {
                                                return uuid as string;
                                            }, 
                                            connection);
                
                DOP.putInCache("Array", uuid, array);

            } else {
                throw new Error(`table '${tableForArry}' definition hasn't been found in the mapping under arrayTables!`);
            }
        }

        // console.log('<-- persistArray');
        
        return uuid;
    }

}

export {DOP, TYPE_COMPARE_FUNCTION, TYPE_FILTER_FUNCTION}
