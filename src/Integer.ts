import Logger from './Logger'

export default class Integer {
  /**
   * Convert a given decimal string to a number. Always radix 10.
   * @throws If the given input is not parseable into an int.
   */
  public static parseString(input: string): number {
    const output = parseInt(input, 10);

    if (isNaN(output)) {
      const message: string = 'could not convert chain id to integer';
      Logger.error(message, { input });
      throw new Error(message);
    }

    return output;
  }
}
