import { BigNumber, utils } from 'ethers';
import { keccak256 } from 'ethers/lib/utils.js';
import {
  BN_ZERO,
  CFG_ACTIVE,
  CFG_ASSERT_RESOLVER_SELECTOR,
  CFG_CHECK_KEEPER_MIN_CVP_DEPOSIT,
  CFG_USE_JOB_OWNER_CREDITS,
} from './Constants.js';
import { ParsedJobConfig, ParsedRawJob } from './Types.js';
import { getIcapAddress } from "@ethersproject/address/src.ts";

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms, []));
}

export function nowS(): number {
  return Math.floor(+new Date() / 1000);
}

export function nowMs(): number {
  return +new Date();
}

export function nowTimeString(): string {
  return (new Date()).toISOString().substring(11,24);
}

export function nowDateTimeString(): string {
  return (new Date()).toISOString();
}

export function toNumber(value: any): number {
  if (typeof value === 'number') {
    return value;
  } else if (BigNumber.isBigNumber(value)) {
    return value.toNumber();
  } else {
    throw new Error(`Utils.toNumber(): Value not a number: (typeof=${typeof value},value=${value})`);
  }
}

/**
 * Encode into PPAgentLite-compatible calldata
 * @param {string} address bytes20
 * @param {number} jobId uint32
 * @param {number} cfg uint8
 * @param {number} keeperId uint24
 * @param {string|null} calldata bytes (required only for resolver calldata type jobs)
 */
export function encodeExecute(address: string, jobId: number, cfg: number, keeperId: number, calldata?: string) {
  return `${utils.solidityPack(
    ['bytes4', 'address', 'uint24', 'uint8', 'uint24', 'bytes'],
    ['0x00000000', address, jobId.toString(), cfg.toString(), keeperId.toString(), calldata || '0x']
  )}`;
}

export function applyObjectProps(source: object, destination: object, props: string[]): void {
  for (const prop of props) {
    if (!(prop in source)) {
      throw new Error(`Utils.applyObjectProps(): Missing property '${prop} in object ${source}`);
    }
  }
}

// WARNING: Does support only simple types like bytes32, uint256, address.
// Do not use this function with more complex types or indexed events.
export function buildSignature(abiItem: any): string {
  return `${abiItem.name}(${abiItem.inputs.map((item: any) => {
    if (!['bytes32', 'uint256', 'address'].includes(item.internalType)) {
      throw new Error(`Utils.buildSignature(): Unsupported type: ${item.internalType}`);
    }
    return item.internalType;
  }).join(',')})`;
}

export function buildAbiSelector(signature: string): string {
  return keccak256(utils.toUtf8Bytes(signature)).slice(0, 10);
}

export function parseRawJob(rawJob: string): ParsedRawJob {
  if (typeof rawJob !== 'string') {
    throw new Error(['Utils.parseRawJob(): rawJob is not a string:', rawJob, typeof rawJob].join(' '));
  }
  if (!rawJob.startsWith('0x')) {
    throw new Error(['Utils.parseRawJob(): rawJob should start with 0x prefix:', rawJob].join(' '));
  }
  if (rawJob.length !== 66) {
    throw new Error(`Utils.parseRawJob(): rawJob has length ${rawJob.length}, but expecting the length of 66`);
  }

  const lastExecutionAt = Number(`0x${rawJob.substring(2, 10)}`);
  const intervalSeconds = Number(`0x${rawJob.substring(11, 16)}`);
  const calldataSource = Number(`0x${rawJob.substring(17, 18)}`);
  const fixedReward = Number(`0x${rawJob.substring(19, 26)}`);
  const rewardPct = Number(`0x${rawJob.substring(27, 30)}`);
  const maxBaseFeeGwei = Number(`0x${rawJob.substring(31, 34)}`);
  const nativeCredits = BigNumber.from(`0x${rawJob.substring(35, 56)}`);
  const selector = `0x${rawJob.substring(57, 64)}`;
  const config = `0x${rawJob.substring(65, 66)}`;

  return {
    lastExecutionAt,
    intervalSeconds,
    calldataSource,
    fixedReward,
    rewardPct,
    maxBaseFeeGwei,
    nativeCredits,
    selector,
    config,
  }
}
export function parseConfig(config: BigNumber): ParsedJobConfig {
  return {
    isActive: !(config.and(CFG_ACTIVE)).eq(BN_ZERO),
    useJobOwnerCredits: !(config.and(CFG_USE_JOB_OWNER_CREDITS)).eq(BN_ZERO),
    assertResolverSelector: !(config.and(CFG_ASSERT_RESOLVER_SELECTOR)).eq(BN_ZERO),
    checkKeeperMinCvpDeposit: !(config.and(CFG_CHECK_KEEPER_MIN_CVP_DEPOSIT)).eq(BN_ZERO)
  }
}

export function fbReasonStringToHexString(reason: string): string {
  const  buff = Uint8Array.from(reason, e => e.charCodeAt(0) )
  return '0x' + [...new Uint8Array(buff)]
    .map(x => x.toString(16).padStart(2, '0'))
    .join('');
}

export function toChecksummedAddress(address: string): string {
  return utils.getAddress(address);
}
