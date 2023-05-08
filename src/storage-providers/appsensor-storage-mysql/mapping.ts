import fs from 'fs';
import { JSONConfigReadValidate } from '../../utils/Utils.js';

interface IPropertyMap {
    column: string,
    class?: string,
    arrayElementClass?: string,
    arrayTable?: string
}

interface IClassToTableMap {
    table: string,
    properties: {
        [propertyName: string]: IPropertyMap;
    }
}

interface IArrayStoreTable {
    uuidColumnName: string,
    valueColumnName: string
}

interface IMapping {
    arrayStoreTables: {
        [tableName: string]: IArrayStoreTable
    };

    classesToTablesMap: {
        [className: string]: IClassToTableMap;
    };

    cacheControl: {
        doNotCacheClasses: string[]
    };
}

class Mapping implements IMapping {

    private static classPropertyNamesMap: Map<string, string[]> | null = null;
    private static classPropsMapMap: Map<string, Map<string, IPropertyMap>> | null = null;

    arrayStoreTables: { [tableName: string]: IArrayStoreTable; } = {};
    classesToTablesMap: { [className: string]: IClassToTableMap; } = {};
    cacheControl: {doNotCacheClasses: string[]} = {doNotCacheClasses: []};
    
    public isClassMapped(className: string): boolean {
        let mapped = false;

        const propDescr = Object.getOwnPropertyDescriptor(this.classesToTablesMap, className);
        if (propDescr) {
            mapped = true;
        }

        return mapped;
    }
 
    public getTableName(className: string): string {
        return this.classesToTablesMap[className].table
    }

    public getClassNames(): string[] {
        const classNames: string[] = [];

        const entries = Object.entries(this.classesToTablesMap);
        for (const entry of entries) {
            classNames.push(entry[0]);
        }

        return classNames;
    }

    public isClassCachable(className: string): boolean {
        return this.cacheControl.doNotCacheClasses.indexOf(className) === -1;
    }

    private getClassPropertiesMapMap(): Map<string, Map<string, IPropertyMap>> {
        if (!Mapping.classPropsMapMap) {
            Mapping.classPropsMapMap = new Map<string, Map<string, IPropertyMap>>();

            const classNames = Object.getOwnPropertyNames(this.classesToTablesMap);

            for (let i = 0; i < classNames.length; i++) {
                const className = classNames[i];

                const propDescr = Object.getOwnPropertyDescriptor(this.classesToTablesMap, className);
                if (propDescr) {

                    let propNamePropMap = Mapping.classPropsMapMap.get(className);
                    if (!propNamePropMap) {
                        propNamePropMap = new Map<string, IPropertyMap>();

                        Mapping.classPropsMapMap.set(className, propNamePropMap);
                    }

                    const mappedProperties = Object.entries((propDescr.value as IClassToTableMap).properties);
                    for (const propMap of mappedProperties) {
                        propNamePropMap.set(propMap[0], propMap[1]);
                    }
                }
            }

        }

        return Mapping.classPropsMapMap;
    }

    public getPropertyMap(className: string, propertyName: string): IPropertyMap | null {
        let propMap = null;

        const classPropsMapMap = this.getClassPropertiesMapMap();

        const propNamePropMap = classPropsMapMap.get(className);
        if (propNamePropMap) {
            const propMapTmp = propNamePropMap.get(propertyName);
            if (propMapTmp) {
                propMap = propMapTmp;
            }
        }

        return propMap;
    }

    public getColumnName(className: string, propertyName: string): string {
        let columnName = propertyName;

        const propMap = this.getPropertyMap(className, propertyName);
        if (propMap && propMap.column !== undefined) {
            columnName = propMap.column;
        }

        return columnName;
    }

    public getMappedClassPropertyNamesMap(): Map<string, string[]> {
        if (!Mapping.classPropertyNamesMap) {
            Mapping.classPropertyNamesMap = new Map<string, string[]>();

            const classNames = Object.getOwnPropertyNames(this.classesToTablesMap);

            for (let i = 0; i < classNames.length; i++) {
                const className = classNames[i];

                const propDescr = Object.getOwnPropertyDescriptor(this.classesToTablesMap, className);
                if (propDescr) {
                    const propNames = Object.getOwnPropertyNames((propDescr.value as IClassToTableMap).properties);
                    Mapping.classPropertyNamesMap.set(className, propNames);
                }
            }
        }

        return Mapping.classPropertyNamesMap;
    }

    public getMappedClassPropertyNames(className: string): string[] {
        let mappedProps: string[] = [];

        const classNamePropsMap = this.getMappedClassPropertyNamesMap();

        const props = classNamePropsMap.get(className);
        if (props) {
            mappedProps = props;
        }

        return mappedProps;
    }

    public getArrayTableName(className: string, propertyName: string): string | null {
        let arrayTableName = null;

        const propMap = this.getPropertyMap(className, propertyName);
        if (propMap && propMap.arrayTable) {
            arrayTableName = propMap.arrayTable;
        }

        return arrayTableName;
    }

    public getArrayTableDef(tableName: string): IArrayStoreTable | null {
        let arrayTableDef: IArrayStoreTable | null = null;

        const propDescr = Object.getOwnPropertyDescriptor(this.arrayStoreTables, tableName);
        if (propDescr) {
            arrayTableDef = propDescr.value;
        }

        return arrayTableDef;
    }

}

class MappingReader extends JSONConfigReadValidate {

    constructor() {
        super("./storage-providers/appsensor-storage-mysql/mapping.json",
              "./storage-providers/appsensor-storage-mysql/mapping_schema.json",
              Mapping.prototype);
    }
}

export {IArrayStoreTable, IClassToTableMap, IPropertyMap, Mapping, MappingReader};