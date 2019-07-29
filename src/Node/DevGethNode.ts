import GethNode from './GethNode';
import Shell from '../Shell';

export const AUXILIARY_ADDRESSES='0x41ac401c408456f50b5cd30e79acd01e7e3548cb,0x8dfdb7f00e13ab72bb34e440d16a7030be423709,0x9f668fc260c442cb41bf312ba48ae6571e7d08fe,0x0c08bd1f850b23543af9a3f3b1577adacadee86a,0x4e28a6906b454f5aa5faed5c6efeef34a939e1cc,0xa3d8a8511316094de9c0916278b3acc96c095996,0x21bbb3883843611b9b41964c34c5826861f2a7e5,0x707e5cbb8a3663a2d07d9cee558a42b42fb5bd39,0x93a9949dc8ca70c594f90ebaf7ba2a0047806336,0x4a6fd6499d55aa4bd29bdb56c08264632cce0261,0xa381b1bc7886fae876f167b1aa050af5123dc736,0xa530acfd8650021f2540cc594693d7bb48550e98,0x5df7341a956f17e75eb8708cfb46c0122a540353,0x275605cba18458f45c67a1a3b8899f481e79bb18,0x1318a9e299405c899bf6f47ba58c7db4fb558bc7,0x6e26f708182c75ae92e87e3d055d7aa4261b4029,0x94d36b54fc193aadf2ca813b7815f1a29e501994,0x6ea338ef7277d420ed4242c0bc1089a7a6151596,0x57e2ea1e74da1e6292b1367d337a0f83e594b6ac,0x52d242db7c37faba315df2faf928a7f63d1799c6';
export const AUXILIARY_SEALER_ADDRESS='0xa5bcdd4ad7aaf2959ea164901086b38a01e43af5';
export const ORIGIN_ADDRESSES='0x40ebe1ce3428b9cbaddbc20af27f1c4780b7d49f,0x970cadd1c487c66b05ef108e506ae16ae471cf04,0xaf9327b0a8f1af06992ff7f24eca6541c5653b30,0xeca13364a7c4aba548bdfc20d27751869b85854a,0x206a3effd972aa17a609d7708cc2b4ed1f2ff8d5,0x21b5c4ac39a15c4a4a33606a848aa7d8b00298e1,0xbb84f0861325e77397ec42ade981cef2358ebf2c,0x9dc82f76b2985851ea5c73ea8368137cbc143c4a,0x6725a1becba2c74dda4ab86876527d53e36648b4,0x22365c6a6d377effe262896fa7b34d5d12e96f87,0xfe7147289537c23be75da959576d03f31a5e942f,0x6142ae2e46a9675cfb62e290dded0dae870ef538,0xcb91e14adda50c059e1f2bcf973f057984cf8414,0xa2bdfcb744a7032a2a3808f365fe12454a496442,0x26b207c59253fc9e1213e5a237ff189261ee5f26,0x8af0deae57623ee9e8cf25026092b6edba188267,0x39ac06efaef9a4f4b8fd8e2d8dc938166245f4c4,0x0db3406ed416725256ff1f171b86bb41cf67e920,0xef464575795f60a0a0752a7d5317f417a77f0e6b';
export const ORIGIN_SEALER_ADDRESS='0x76a313020034b955C4a030761B75E7021d13dF68';

export default class DevGethNode extends GethNode {
  /**
   * Starts the container that runs this chain node.
   */
  public start(): void {
    super.initializeDirectories();
    super.ensureNetworkExists();

    this.logInfo('starting dev geth node');
    let args = this.defaultDockerGethArgs;

    let addressesToUnlock: string;
    let sealerAddress: string;

    if (this.originChain === 'dev') {
      addressesToUnlock = AUXILIARY_ADDRESSES;
      sealerAddress = AUXILIARY_SEALER_ADDRESS;
    } else {
      addressesToUnlock = ORIGIN_ADDRESSES;
      sealerAddress = ORIGIN_SEALER_ADDRESS;
    }
    addressesToUnlock = `${addressesToUnlock},${sealerAddress}`;

    args = args.concat([
      '--minerthreads', '1',
      '--mine',
      '--etherbase',
      sealerAddress,
      '--unlock',
      addressesToUnlock,
      '--password', './chain_data/password.txt',
    ]);
    Shell.executeDockerCommand(args);
  }
}
