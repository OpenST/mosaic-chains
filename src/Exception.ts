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

export class InvalidTokenConfigException extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'InvalidTokenConfigException';
    this.message = message;
  }
}

export class TokenConfigNotFoundException extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'TokenConfigNotFoundException';
    this.message = message;
  }
}
