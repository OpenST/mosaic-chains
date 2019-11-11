import {
  RedeemRequested as RedeemRequestedEvent,
  RedeemRevoked as RedeemRevokedEvent,
  RedeemRejected as RedeemRejectedEvent,
} from '../generated/Contract/RedeemPool';
import {
  RedeemRequested,
  RedeemRevoked,
  RedeemRejected,
} from '../generated/RedeemPoolSchema';

export function handleRedeemRequested(event: RedeemRequestedEvent): void {
  let entity = new RedeemRequested(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.amount = event.params.amount
  entity.beneficiary = event.params.beneficiary
  entity.gasPrice = event.params.gasPrice
  entity.gasLimit = event.params.gasLimit
  entity.nonce = event.params.nonce
  entity.redeemer = event.params.redeemer
  entity.redeemerProxy = event.params.redeemerProxy
  entity.cogateway = event.params.cogateway
  entity.redeemRequestHash = event.params.redeemRequestHash
  entity.blockNumber = event.block.number
  entity.blockHash = event.block.hash
  entity.contractAddress = event.address
  entity.uts = event.block.timestamp
  entity.save()
}

export function handleRedeemRevoked(event: RedeemRevokedEvent): void {
  let entity = new RedeemRevoked(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.redeemer = event.params.redeemer
  entity.redeemRequestHash = event.params.redeemRequestHash
  entity.blockNumber = event.block.number
  entity.blockHash = event.block.hash
  entity.contractAddress = event.address
  entity.uts = event.block.timestamp
  entity.save()
}

export function handleRedeemRejected(event: RedeemRejectedEvent): void {
  let entity = new RedeemRejected(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.redeemer = event.params.redeemer
  entity.redeemRequestHash = event.params.redeemRequestHash
  entity.blockNumber = event.block.number
  entity.blockHash = event.block.hash
  entity.contractAddress = event.address
  entity.uts = event.block.timestamp
  entity.save()
}
