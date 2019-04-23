/**
 * Proof is a container for data that is required for a gateway merkle proof.
 */
export default class Proof {
  readonly blockNumber: number;
  readonly accountData: string;
  readonly accountProof: string;
  readonly storageProof: string;
  readonly stateRoot: string;
}
