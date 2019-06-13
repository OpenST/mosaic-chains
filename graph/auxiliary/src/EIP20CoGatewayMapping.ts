import {
  StakeIntentConfirmed as StakeIntentConfirmedEvent,
  MintProgressed as MintProgressedEvent,
  RevertStakeIntentConfirmed as RevertStakeIntentConfirmedEvent,
  RevertStakeProgressed as RevertStakeProgressedEvent,
  RedeemIntentDeclared as RedeemIntentDeclaredEvent,
  RedeemProgressed as RedeemProgressedEvent,
  RevertRedeemDeclared as RevertRedeemDeclaredEvent,
  RedeemReverted as RedeemRevertedEvent,
  GatewayProven as GatewayProvenEvent,
  BountyChangeInitiated as BountyChangeInitiatedEvent,
  BountyChangeConfirmed as BountyChangeConfirmedEvent,
} from '../generated/Contract/EIP20CoGateway';
import {
  StakeIntentConfirmed,
  MintProgressed,
  RevertStakeIntentConfirmed,
  RevertStakeProgressed,
  RedeemIntentDeclared,
  RedeemProgressed,
  RevertRedeemDeclared,
  RedeemReverted,
  GatewayProven,
  BountyChangeInitiated,
  BountyChangeConfirmed,
} from '../generated/EIP20CoGatewaySchema';

export function handleStakeIntentConfirmed(
    event: StakeIntentConfirmedEvent
): void {
  let entity = new StakeIntentConfirmed(
      event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity._messageHash = event.params._messageHash
  entity._staker = event.params._staker
  entity._stakerNonce = event.params._stakerNonce
  entity._beneficiary = event.params._beneficiary
  entity._amount = event.params._amount
  entity._blockHeight = event.params._blockHeight
  entity._hashLock = event.params._hashLock
  entity.save()
}

export function handleMintProgressed(event: MintProgressedEvent): void {
  let entity = new MintProgressed(
      event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity._messageHash = event.params._messageHash
  entity._staker = event.params._staker
  entity._beneficiary = event.params._beneficiary
  entity._stakeAmount = event.params._stakeAmount
  entity._mintedAmount = event.params._mintedAmount
  entity._rewardAmount = event.params._rewardAmount
  entity._proofProgress = event.params._proofProgress
  entity._unlockSecret = event.params._unlockSecret
  entity.save()
}

export function handleRevertStakeIntentConfirmed(
    event: RevertStakeIntentConfirmedEvent
): void {
  let entity = new RevertStakeIntentConfirmed(
      event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity._messageHash = event.params._messageHash
  entity._staker = event.params._staker
  entity._stakerNonce = event.params._stakerNonce
  entity._amount = event.params._amount
  entity.save()
}

export function handleRevertStakeProgressed(
    event: RevertStakeProgressedEvent
): void {
  let entity = new RevertStakeProgressed(
      event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity._messageHash = event.params._messageHash
  entity._staker = event.params._staker
  entity._stakerNonce = event.params._stakerNonce
  entity._amount = event.params._amount
  entity.save()
}

export function handleRedeemIntentDeclared(
    event: RedeemIntentDeclaredEvent
): void {
  let entity = new RedeemIntentDeclared(
      event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity._messageHash = event.params._messageHash
  entity._redeemer = event.params._redeemer
  entity._redeemerNonce = event.params._redeemerNonce
  entity._beneficiary = event.params._beneficiary
  entity._amount = event.params._amount
  entity.save()
}

export function handleRedeemProgressed(event: RedeemProgressedEvent): void {
  let entity = new RedeemProgressed(
      event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity._messageHash = event.params._messageHash
  entity._redeemer = event.params._redeemer
  entity._redeemerNonce = event.params._redeemerNonce
  entity._amount = event.params._amount
  entity._proofProgress = event.params._proofProgress
  entity._unlockSecret = event.params._unlockSecret
  entity.save()
}

export function handleRevertRedeemDeclared(
    event: RevertRedeemDeclaredEvent
): void {
  let entity = new RevertRedeemDeclared(
      event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity._messageHash = event.params._messageHash
  entity._redeemer = event.params._redeemer
  entity._redeemerNonce = event.params._redeemerNonce
  entity._amount = event.params._amount
  entity.save()
}

export function handleRedeemReverted(event: RedeemRevertedEvent): void {
  let entity = new RedeemReverted(
      event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity._messageHash = event.params._messageHash
  entity._redeemer = event.params._redeemer
  entity._redeemerNonce = event.params._redeemerNonce
  entity._amount = event.params._amount
  entity.save()
}

export function handleGatewayProven(event: GatewayProvenEvent): void {
  let entity = new GatewayProven(
      event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity._gateway = event.params._gateway
  entity._blockHeight = event.params._blockHeight
  entity._storageRoot = event.params._storageRoot
  entity._wasAlreadyProved = event.params._wasAlreadyProved
  entity.save()
}

export function handleBountyChangeInitiated(
    event: BountyChangeInitiatedEvent
): void {
  let entity = new BountyChangeInitiated(
      event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity._currentBounty = event.params._currentBounty
  entity._proposedBounty = event.params._proposedBounty
  entity._unlockHeight = event.params._unlockHeight
  entity.save()
}

export function handleBountyChangeConfirmed(
    event: BountyChangeConfirmedEvent
): void {
  let entity = new BountyChangeConfirmed(
      event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity._currentBounty = event.params._currentBounty
  entity._changedBounty = event.params._changedBounty
  entity.save()
}
