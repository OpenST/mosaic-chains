import GethNode from './GethNode';
import Shell from '../Shell';

export default class DevGethNode extends GethNode {
  /**
   * Starts the container that runs this chain node.
   */
  public start(): void {
    super.initializeDirectories();
    super.ensureNetworkExists();

    this.logInfo('starting dev geth node');
    let args = this.defaultDockerGethArgs;
    if (this.chain === 'dev') {
      args = args.concat([
        '--minerthreads', '1',
        '--mine',
        '--unlock',
        '0x76a313020034b955C4a030761B75E7021d13dF68,0x40ebe1ce3428b9cbaddbc20af27f1c4780b7d49f,0x970cadd1c487c66b05ef108e506ae16ae471cf04,0xaf9327b0a8f1af06992ff7f24eca6541c5653b30,0xeca13364a7c4aba548bdfc20d27751869b85854a,0x206a3effd972aa17a609d7708cc2b4ed1f2ff8d5,0x21b5c4ac39a15c4a4a33606a848aa7d8b00298e1,0xbb84f0861325e77397ec42ade981cef2358ebf2c,0x9dc82f76b2985851ea5c73ea8368137cbc143c4a,0x6725a1becba2c74dda4ab86876527d53e36648b4,0x22365c6a6d377effe262896fa7b34d5d12e96f87,0xfe7147289537c23be75da959576d03f31a5e942f,0x6142ae2e46a9675cfb62e290dded0dae870ef538,0xcb91e14adda50c059e1f2bcf973f057984cf8414,0xa2bdfcb744a7032a2a3808f365fe12454a496442,0x26b207c59253fc9e1213e5a237ff189261ee5f26,0x8af0deae57623ee9e8cf25026092b6edba188267,0x39ac06efaef9a4f4b8fd8e2d8dc938166245f4c4,0x0db3406ed416725256ff1f171b86bb41cf67e920,0xef464575795f60a0a0752a7d5317f417a77f0e6b',
        '--password', './chain_data/password.txt',
      ]);
    }
    Shell.executeDockerCommand(args);
  }
}
