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

export class StakeRequested extends EthereumEvent {
  get params(): StakeRequested__Params {
    return new StakeRequested__Params(this);
  }
}

export class StakeRequested__Params {
  _event: StakeRequested;

  constructor(event: StakeRequested) {
    this._event = event;
  }

  get amount(): BigInt {
    return this._event.parameters[0].value.toBigInt();
  }

  get beneficiary(): Address {
    return this._event.parameters[1].value.toAddress();
  }

  get gasPrice(): BigInt {
    return this._event.parameters[2].value.toBigInt();
  }

  get gasLimit(): BigInt {
    return this._event.parameters[3].value.toBigInt();
  }

  get nonce(): BigInt {
    return this._event.parameters[4].value.toBigInt();
  }

  get staker(): Address {
    return this._event.parameters[5].value.toAddress();
  }

  get stakerProxy(): Address {
    return this._event.parameters[6].value.toAddress();
  }

  get gateway(): Address {
    return this._event.parameters[7].value.toAddress();
  }

  get stakeRequestHash(): Bytes {
    return this._event.parameters[8].value.toBytes();
  }
}

export class StakeRevoked extends EthereumEvent {
  get params(): StakeRevoked__Params {
    return new StakeRevoked__Params(this);
  }
}

export class StakeRevoked__Params {
  _event: StakeRevoked;

  constructor(event: StakeRevoked) {
    this._event = event;
  }

  get staker(): Address {
    return this._event.parameters[0].value.toAddress();
  }

  get stakeRequestHash(): Bytes {
    return this._event.parameters[1].value.toBytes();
  }
}

export class StakeRejected extends EthereumEvent {
  get params(): StakeRejected__Params {
    return new StakeRejected__Params(this);
  }
}

export class StakeRejected__Params {
  _event: StakeRejected;

  constructor(event: StakeRejected) {
    this._event = event;
  }

  get staker(): Address {
    return this._event.parameters[0].value.toAddress();
  }

  get stakeRequestHash(): Bytes {
    return this._event.parameters[1].value.toBytes();
  }
}

export class Contract__stakeRequestsResult {
  value0: BigInt;
  value1: Address;
  value2: BigInt;
  value3: BigInt;
  value4: BigInt;
  value5: Address;
  value6: Address;

  constructor(
    value0: BigInt,
    value1: Address,
    value2: BigInt,
    value3: BigInt,
    value4: BigInt,
    value5: Address,
    value6: Address
  ) {
    this.value0 = value0;
    this.value1 = value1;
    this.value2 = value2;
    this.value3 = value3;
    this.value4 = value4;
    this.value5 = value5;
    this.value6 = value6;
  }

  toMap(): TypedMap<string, EthereumValue> {
    let map = new TypedMap<string, EthereumValue>();
    map.set("value0", EthereumValue.fromUnsignedBigInt(this.value0));
    map.set("value1", EthereumValue.fromAddress(this.value1));
    map.set("value2", EthereumValue.fromUnsignedBigInt(this.value2));
    map.set("value3", EthereumValue.fromUnsignedBigInt(this.value3));
    map.set("value4", EthereumValue.fromUnsignedBigInt(this.value4));
    map.set("value5", EthereumValue.fromAddress(this.value5));
    map.set("value6", EthereumValue.fromAddress(this.value6));
    return map;
  }
}

export class Contract extends SmartContract {
  static bind(address: Address): Contract {
    return new Contract("Contract", address);
  }

  stakeRequests(param0: Bytes): Contract__stakeRequestsResult {
    let result = super.call("stakeRequests", [
      EthereumValue.fromFixedBytes(param0)
    ]);
    return new Contract__stakeRequestsResult(
      result[0].toBigInt(),
      result[1].toAddress(),
      result[2].toBigInt(),
      result[3].toBigInt(),
      result[4].toBigInt(),
      result[5].toAddress(),
      result[6].toAddress()
    );
  }

  organization(): Address {
    let result = super.call("organization", []);
    return result[0].toAddress();
  }

  stakerProxies(param0: Address): Address {
    let result = super.call("stakerProxies", [
      EthereumValue.fromAddress(param0)
    ]);
    return result[0].toAddress();
  }

  stakeRequestHashes(param0: Address, param1: Address): Bytes {
    let result = super.call("stakeRequestHashes", [
      EthereumValue.fromAddress(param0),
      EthereumValue.fromAddress(param1)
    ]);
    return result[0].toBytes();
  }

  activeStakeRequestCount(param0: Address): BigInt {
    let result = super.call("activeStakeRequestCount", [
      EthereumValue.fromAddress(param0)
    ]);
    return result[0].toBigInt();
  }

  STAKEREQUEST_INTENT_TYPEHASH(): Bytes {
    let result = super.call("STAKEREQUEST_INTENT_TYPEHASH", []);
    return result[0].toBytes();
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

  get _organization(): Address {
    return this._call.inputValues[0].value.toAddress();
  }
}

export class ConstructorCall__Outputs {
  _call: ConstructorCall;

  constructor(call: ConstructorCall) {
    this._call = call;
  }
}

export class RequestStakeCall extends EthereumCall {
  get inputs(): RequestStakeCall__Inputs {
    return new RequestStakeCall__Inputs(this);
  }

  get outputs(): RequestStakeCall__Outputs {
    return new RequestStakeCall__Outputs(this);
  }
}

export class RequestStakeCall__Inputs {
  _call: RequestStakeCall;

  constructor(call: RequestStakeCall) {
    this._call = call;
  }

  get _amount(): BigInt {
    return this._call.inputValues[0].value.toBigInt();
  }

  get _beneficiary(): Address {
    return this._call.inputValues[1].value.toAddress();
  }

  get _gasPrice(): BigInt {
    return this._call.inputValues[2].value.toBigInt();
  }

  get _gasLimit(): BigInt {
    return this._call.inputValues[3].value.toBigInt();
  }

  get _nonce(): BigInt {
    return this._call.inputValues[4].value.toBigInt();
  }

  get _gateway(): Address {
    return this._call.inputValues[5].value.toAddress();
  }
}

export class RequestStakeCall__Outputs {
  _call: RequestStakeCall;

  constructor(call: RequestStakeCall) {
    this._call = call;
  }

  get stakeRequestHash_(): Bytes {
    return this._call.outputValues[0].value.toBytes();
  }
}

export class AcceptStakeRequestCall extends EthereumCall {
  get inputs(): AcceptStakeRequestCall__Inputs {
    return new AcceptStakeRequestCall__Inputs(this);
  }

  get outputs(): AcceptStakeRequestCall__Outputs {
    return new AcceptStakeRequestCall__Outputs(this);
  }
}

export class AcceptStakeRequestCall__Inputs {
  _call: AcceptStakeRequestCall;

  constructor(call: AcceptStakeRequestCall) {
    this._call = call;
  }

  get _stakeRequestHash(): Bytes {
    return this._call.inputValues[0].value.toBytes();
  }

  get _hashLock(): Bytes {
    return this._call.inputValues[1].value.toBytes();
  }
}

export class AcceptStakeRequestCall__Outputs {
  _call: AcceptStakeRequestCall;

  constructor(call: AcceptStakeRequestCall) {
    this._call = call;
  }

  get messageHash_(): Bytes {
    return this._call.outputValues[0].value.toBytes();
  }
}

export class RevokeStakeRequestCall extends EthereumCall {
  get inputs(): RevokeStakeRequestCall__Inputs {
    return new RevokeStakeRequestCall__Inputs(this);
  }

  get outputs(): RevokeStakeRequestCall__Outputs {
    return new RevokeStakeRequestCall__Outputs(this);
  }
}

export class RevokeStakeRequestCall__Inputs {
  _call: RevokeStakeRequestCall;

  constructor(call: RevokeStakeRequestCall) {
    this._call = call;
  }

  get _stakeRequestHash(): Bytes {
    return this._call.inputValues[0].value.toBytes();
  }
}

export class RevokeStakeRequestCall__Outputs {
  _call: RevokeStakeRequestCall;

  constructor(call: RevokeStakeRequestCall) {
    this._call = call;
  }
}

export class RejectStakeRequestCall extends EthereumCall {
  get inputs(): RejectStakeRequestCall__Inputs {
    return new RejectStakeRequestCall__Inputs(this);
  }

  get outputs(): RejectStakeRequestCall__Outputs {
    return new RejectStakeRequestCall__Outputs(this);
  }
}

export class RejectStakeRequestCall__Inputs {
  _call: RejectStakeRequestCall;

  constructor(call: RejectStakeRequestCall) {
    this._call = call;
  }

  get _stakeRequestHash(): Bytes {
    return this._call.inputValues[0].value.toBytes();
  }
}

export class RejectStakeRequestCall__Outputs {
  _call: RejectStakeRequestCall;

  constructor(call: RejectStakeRequestCall) {
    this._call = call;
  }
}

export class RemoveStakerProxyCall extends EthereumCall {
  get inputs(): RemoveStakerProxyCall__Inputs {
    return new RemoveStakerProxyCall__Inputs(this);
  }

  get outputs(): RemoveStakerProxyCall__Outputs {
    return new RemoveStakerProxyCall__Outputs(this);
  }
}

export class RemoveStakerProxyCall__Inputs {
  _call: RemoveStakerProxyCall;

  constructor(call: RemoveStakerProxyCall) {
    this._call = call;
  }

  get _owner(): Address {
    return this._call.inputValues[0].value.toAddress();
  }
}

export class RemoveStakerProxyCall__Outputs {
  _call: RemoveStakerProxyCall;

  constructor(call: RemoveStakerProxyCall) {
    this._call = call;
  }
}
