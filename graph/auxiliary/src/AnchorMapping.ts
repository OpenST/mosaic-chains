import { StateRootAvailable as StateRootAvailableEvent } from '../generated/Contract/Anchor';
import { StateRootAvailable } from '../generated/AnchorSchema';

export function handleStateRootAvailable(event: StateRootAvailableEvent): void {
  let entity = new StateRootAvailable(
      event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity._blockHeight = event.params._blockHeight
  entity._stateRoot = event.params._stateRoot
  entity.save()
}