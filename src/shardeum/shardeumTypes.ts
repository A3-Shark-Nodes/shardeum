import { Account, Address, BN, bufferToHex, toBuffer } from 'ethereumjs-util'

import { Transaction, AccessListEIP2930Transaction } from '@ethereumjs/tx'
import { TxReceipt } from '@ethereumjs/vm/dist/types'
import { ShardusTypes } from '@shardus/core'

export enum AccountType {
  Account, //  EOA or CA
  ContractStorage, // Contract storage key value pair
  ContractCode, // Contract code bytes
  Receipt, //This holds logs for a TX
  Debug,
  NetworkAccount,
  NodeAccount,
  NodeRewardReceipt
}

export interface BaseAccount {
  accountType: AccountType
}

/**
 * Still working out the details here.
 * This has become a variant data type now that can hold an EVM account or a key value pair from CA storage
 * I think that is the shortest path for now to get syncing and repair functionality working
 *
 * Long term I am not certain if we will be able to hold these in memory.  They may have to be a temporary thing
 * that is held in memory for awhile but eventually cleared.  This would mean that we have to be able to pull these
 * from disk again, and that could be a bit tricky.
 */
export interface WrappedEVMAccount extends BaseAccount {
  // accountType: AccountType // determines how the shardus address will be computed and what variant data is present
  ethAddress: string //account address in EVM space. can have different meanings depending on account type
  hash: string //account hash
  timestamp: number //account timestamp.  last time a TX changed it

  //variant data: account
  account?: Account //actual EVM account. if this is type Account
  //variant data: contract storage
  key?: string //EVM CA storage key
  value?: Buffer //EVM buffer value if this is of type CA_KVP
  //variant data: Contract code related and addresses
  codeHash?: Buffer
  codeByte?: Buffer
  contractAddress?: string
  //variant data: Receipt related
  receipt?: TxReceipt
  readableReceipt?: ReadableReceipt
  txId?: string
  txFrom?: string
  balance?: number // For debug tx
}

export interface WrappedEVMAccountMap {
  [id: string]: WrappedEVMAccount
}

export interface EVMAccountInfo {
  type: AccountType
  evmAddress: string
  contractAddress?: string
}

export enum InternalTXType {
  SetGlobalCodeBytes,
  InitNetwork,
  NodeReward,
  ChangeConfig,
  ApplyChangeConfig
}

export enum DebugTXType {
  Create,
  Transfer,
}

/**
 * InternalTx is a non EVM TX that shardeum can use for utility task such as global changes
 *
 */
export interface InternalTxBase {
  isInternalTx: boolean
  internalTXType: InternalTXType
}

export interface InternalTx extends InternalTxBase {
  timestamp: number
  from?: string
  to?: string
  accountData?: WrappedEVMAccount
  network?: string // Network Account
  nodeId?: string, // Node Account
  change?: any // change config
  cycle?: number // change config
  config?: any // change config
  sign: ShardusTypes.Sign
}

export interface DebugTx {
  isDebugTx: boolean
  debugTXType: DebugTXType
  timestamp: number
  from: string
  to?: string
  accountData?: WrappedEVMAccount
}

export interface WrappedAccount {
  accountId: string
  stateId: string
  data: any
  timestamp: number
  accountCreated?: boolean
}

export interface WrappedStates {
  [id: string]: WrappedAccount
}

export interface OurAppDefinedData {
  globalMsg: {
    address: string
    value: {
      isInternalTx: boolean
      internalTXType: InternalTXType
      timestamp: number
      accountData?: WrappedEVMAccount
      from?: string
      change?: {
        cycle: ShardusTypes.Cycle,
        change: any
      }
    }
    when: number
    source: string
  }
}

export interface ReadableReceipt {
  status?: boolean | string 
  transactionHash: string
  transactionIndex: string
  blockNumber: string
  nonce: string
  blockHash: string
  cumulativeGasUsed: string
  gasUsed: string
  logs: any[]
  contractAddress: string | null
  from: string
  to: string
  value: string
  data: string
}

export interface NetworkAccount extends BaseAccount {
  id: string
  current: NetworkParameters
  listOfChanges: Array<{
    cycle: number
    change: any
  }>
  next: NetworkParameters | {}
  hash: string
  timestamp: number
}

export interface NetworkParameters {
  title: string
  description: string
  nodeRewardInterval: number
  nodeRewardAmount: number
  nodePenalty: number
  stakeRequired: number
  maintenanceInterval: number
  maintenanceFee: number
}

export interface NodeAccount extends BaseAccount {
  id: string
  balance: number
  nodeRewardTime: number
  hash: string
  timestamp: number
}

export interface ChangeConfig {
  type: string
  from: string
  cycle: number
  config: string
  timestamp: number
}

export interface ApplyChangeConfig {
  type: string
  change: any
  timestamp: number
}