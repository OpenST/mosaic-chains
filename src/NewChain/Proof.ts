/**
 * Proof is a container for data that is required for a gateway merkle proof.
 */
export default class Proof {
  public blockNumber;
  public accountData;
  public accountProof;
  public storageProof;
  public stateRoot;
}
