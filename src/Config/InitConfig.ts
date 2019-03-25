import * as fs from 'fs';
import * as path from 'path';

export default class InitConfig {
  public originTxOptions: { from: string };
  public originBounty: string;
  public originMaxStateRoots: string;
  public originAmountOstToStake: string;
  public originOstAddress: string;
  public originBurnerAddress: string;
  public auxiliaryChainId: string;

  constructor(initialValues: any) {
    Object.apply(this, initialValues);
  }

  public static createFromFile(auxiliaryChainId: string): InitConfig {
    const fileValues = JSON.parse(
      fs.readFileSync(
        path.join(
          __dirname,
          '..',
          '..',
          'initialize',
          `${auxiliaryChainId}.json`,
        ),
        { encoding: 'utf8' },
      )
    );

    fileValues.auxiliaryChainId = auxiliaryChainId;

    return new InitConfig(fileValues);
  }
}
