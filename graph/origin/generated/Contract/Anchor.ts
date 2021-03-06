// THIS IS AN AUTOGENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY.

import {
  EthereumCall,
  EthereumEvent,
  SmartContract,
  EthereumValue,
  JSONValue,
  TypedMap,
  Entity,
  EthereumTuple,
  Bytes,
  Address,
  BigInt
} from "@graphprotocol/graph-ts";

export class StateRootAvailable extends EthereumEvent {
  get params(): StateRootAvailable__Params {
    return new StateRootAvailable__Params(this);
  }
}

export class StateRootAvailable__Params {
  _event: StateRootAvailable;

  constructor(event: StateRootAvailable) {
    this._event = event;
  }

  get _blockHeight(): BigInt {
    return this._event.parameters[0].value.toBigInt();
  }

  get _stateRoot(): Bytes {
    return this._event.parameters[1].value.toBytes();
  }
}

export class Contract extends SmartContract {
  static bind(address: Address): Contract {
    return new Contract("Contract", address);
  }

  organization(): Address {
    let result = super.call("organization", []);
    return result[0].toAddress();
  }

  coAnchor(): Address {
    let result = super.call("coAnchor", []);
    return result[0].toAddress();
  }

  getStateRoot(_blockHeight: BigInt): Bytes {
    let result = super.call("getStateRoot", [
      EthereumValue.fromUnsignedBigInt(_blockHeight)
    ]);
    return result[0].toBytes();
  }

  getLatestStateRootBlockHeight(): BigInt {
    let result = super.call("getLatestStateRootBlockHeight", []);
    return result[0].toBigInt();
  }

  getRemoteChainId(): BigInt {
    let result = super.call("getRemoteChainId", []);
    return result[0].toBigInt();
  }
}

export class ConstructorCall extends EthereumCall {
  get inputs(): ConstructorCall__Inputs {
    return new ConstructorCall__Inputs(this);
  }

  get outputs(): ConstructorCall__Outputs {
    return new ConstructorCall__Outputs(this);
  }
}

export class ConstructorCall__Inputs {
  _call: ConstructorCall;

  constructor(call: ConstructorCall) {
    this._call = call;
  }

  get _remoteChainId(): BigInt {
    return this._call.inputValues[0].value.toBigInt();
  }

  get _blockHeight(): BigInt {
    return this._call.inputValues[1].value.toBigInt();
  }

  get _stateRoot(): Bytes {
    return this._call.inputValues[2].value.toBytes();
  }

  get _maxStateRoots(): BigInt {
    return this._call.inputValues[3].value.toBigInt();
  }

  get _organization(): Address {
    return this._call.inputValues[4].value.toAddress();
  }
}

export class ConstructorCall__Outputs {
  _call: ConstructorCall;

  constructor(call: ConstructorCall) {
    this._call = call;
  }
}

export class SetCoAnchorAddressCall extends EthereumCall {
  get inputs(): SetCoAnchorAddressCall__Inputs {
    return new SetCoAnchorAddressCall__Inputs(this);
  }

  get outputs(): SetCoAnchorAddressCall__Outputs {
    return new SetCoAnchorAddressCall__Outputs(this);
  }
}

export class SetCoAnchorAddressCall__Inputs {
  _call: SetCoAnchorAddressCall;

  constructor(call: SetCoAnchorAddressCall) {
    this._call = call;
  }

  get _coAnchor(): Address {
    return this._call.inputValues[0].value.toAddress();
  }
}

export class SetCoAnchorAddressCall__Outputs {
  _call: SetCoAnchorAddressCall;

  constructor(call: SetCoAnchorAddressCall) {
    this._call = call;
  }

  get success_(): boolean {
    return this._call.outputValues[0].value.toBoolean();
  }
}

export class AnchorStateRootCall extends EthereumCall {
  get inputs(): AnchorStateRootCall__Inputs {
    return new AnchorStateRootCall__Inputs(this);
  }

  get outputs(): AnchorStateRootCall__Outputs {
    return new AnchorStateRootCall__Outputs(this);
  }
}

export class AnchorStateRootCall__Inputs {
  _call: AnchorStateRootCall;

  constructor(call: AnchorStateRootCall) {
    this._call = call;
  }

  get _blockHeight(): BigInt {
    return this._call.inputValues[0].value.toBigInt();
  }

  get _stateRoot(): Bytes {
    return this._call.inputValues[1].value.toBytes();
  }
}

export class AnchorStateRootCall__Outputs {
  _call: AnchorStateRootCall;

  constructor(call: AnchorStateRootCall) {
    this._call = call;
  }

  get success_(): boolean {
    return this._call.outputValues[0].value.toBoolean();
  }
}
