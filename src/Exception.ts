export class InvalidMosaicConfigException extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'InvalidMosaicConfigException';
    this.message = message;
  }
}

export class MissingMosaicConfigException extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'MissingMosaicConfigException';
    this.message = message;
  }
}