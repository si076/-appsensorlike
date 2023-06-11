class  WebSocketJsonObject {
    dataType: string;
	dataValue: Object;
	
	public constructor(dataType: string, dataValue: Object) {
		this.dataType = dataType;
		this.dataValue = dataValue;
	}

	public getDataType(): string {
		return this.dataType;
	}

	public getDataValue(): Object {
		return this.dataValue;
	}
}

export {WebSocketJsonObject};