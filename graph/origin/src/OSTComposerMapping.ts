import {
  StakeRequested as StakeRequestedEvent,
  StakeRevoked as StakeRevokedEvent,
  StakeRejected as StakeRejectedEvent,
} from '../generated/Contract/OSTComposer';
import {
  StakeRequested,
  StakeRevoked,
  StakeRejected,
} from '../generated/OSTComposerSchema';

export function handleStakeRequested(event: StakeRequestedEvent): void {
  let entity = new StakeRequested(
      event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.amount = event.params.amount
  entity.beneficiary = event.params.beneficiary
  entity.gasPrice = event.params.gasPrice
  entity.gasLimit = event.params.gasLimit
  entity.nonce = event.params.nonce
  entity.staker = event.params.staker
  entity.stakerProxy = event.params.stakerProxy
  entity.gateway = event.params.gateway
  entity.stakeRequestHash = event.params.stakeRequestHash
  entity.blockNumber = event.block.number
  entity.blockHash = event.block.hash
  entity.contractAddress = event.address
  entity.uts = event.block.timestamp
  entity.save()
}

export function handleStakeRevoked(event: StakeRevokedEvent): void {
  let entity = new StakeRevoked(
      event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.staker = event.params.staker
  entity.stakeRequestHash = event.params.stakeRequestHash
  entity.blockNumber = event.block.number
  entity.blockHash = event.block.hash
  entity.contractAddress = event.address
  entity.uts = event.block.timestamp
  entity.save()
}

export function handleStakeRejected(event: StakeRejectedEvent): void {
  let entity = new StakeRejected(
      event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.staker = event.params.staker
  entity.stakeRequestHash = event.params.stakeRequestHash
  entity.blockNumber = event.block.number
  entity.blockHash = event.block.hash
  entity.contractAddress = event.address
  entity.uts = event.block.timestamp
  entity.save()
}
