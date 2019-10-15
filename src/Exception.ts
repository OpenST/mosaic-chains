export class InvalidMosaicConfigException extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'InvalidMosaicConfigException';
    this.message = message;
  }
}

export class MosaicConfigNotFoundException extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'MosaicConfigNotFoundException';
    this.message = message;
  }
}

export class InvalidGatewayConfigException extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'InvalidGatewayConfigException';
    this.message = message;
  }
}

export class GatewayConfigNotFoundException extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'GatewayConfigNotFoundException';
    this.message = message;
  }
}
