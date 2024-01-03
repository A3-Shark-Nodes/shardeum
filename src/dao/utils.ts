import * as crypto from '@shardus/crypto-utils'
import { daoConfig } from '../config/dao'
import { Shardus } from '@shardus/core'
import { UserAccount } from './accounts/userAccount'
import { DaoGlobalAccount } from './accounts/networkAccount'
import { IssueAccount } from './accounts/issueAccount'
import { DevIssueAccount } from './accounts/devIssueAccount'
import { DeveloperPayment } from './types'
import { TimestampReceipt } from '@shardus/core/dist/shardus/shardus-types'
import { Issue } from './tx/issue'
import { Transaction, TransactionType } from '@ethereumjs/tx'
import { bytesToHex, toAscii } from '@ethereumjs/util'
import { logFlags } from '..'

export const maintenanceAmount = (
  timestamp: number,
  account: UserAccount,
  network: DaoGlobalAccount
): number => {
  let amount: number
  if (timestamp - account.lastMaintenance < network.current.maintenanceInterval) {
    amount = 0
  } else {
    amount =
      account.data.balance *
      (1 -
        Math.pow(
          1 - network.current.maintenanceFee,
          (timestamp - account.lastMaintenance) / network.current.maintenanceInterval
        ))
    account.lastMaintenance = timestamp
  }
  if (typeof amount === 'number') return amount
  else return 0
}

// HELPER METHOD TO WAIT
export async function _sleep(ms = 0): Promise<NodeJS.Timeout> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// NODE_REWARD TRANSACTION FUNCTION
export function nodeReward(address: string, nodeId: string, dapp: Shardus): void {
  const tx = {
    type: 'node_reward',
    nodeId: nodeId,
    from: address,
    to: process.env.PAY_ADDRESS || address,
    timestamp: Date.now(),
  }
  dapp.put(tx)
  dapp.log('GENERATED_NODE_REWARD: ', nodeId)
}

// ISSUE TRANSACTION FUNCTION
export async function generateIssue(address: string, nodeId: string, dapp: Shardus): Promise<void> {
  const account = await dapp.getLocalOrRemoteAccount(daoConfig.daoAccount)
  const network = account.data as DaoGlobalAccount
  const tx = new Issue({
    nodeId,
    from: address,
    issue: crypto.hash(`issue-${network.issue}`),
    proposal: crypto.hash(`issue-${network.issue}-proposal-1`),
    timestamp: Date.now(),
  })
  dapp.put(tx)
  dapp.log('GENERATED_ISSUE: ', nodeId)
}

// DEV_ISSUE TRANSACTION FUNCTION
export async function generateDevIssue(address: string, nodeId: string, dapp: Shardus): Promise<void> {
  const account = await dapp.getLocalOrRemoteAccount(daoConfig.daoAccount)
  const network = account.data as DaoGlobalAccount
  const tx = {
    type: 'dev_issue',
    nodeId,
    from: address,
    devIssue: crypto.hash(`dev-issue-${network.devIssue}`),
    timestamp: Date.now(),
  }
  dapp.put(tx)
  dapp.log('GENERATED_DEV_ISSUE: ', nodeId)
}

// TALLY TRANSACTION FUNCTION
export async function tallyVotes(address: string, nodeId: string, dapp: Shardus): Promise<void> {
  console.log(`GOT TO TALLY_VOTES FN ${address} ${nodeId}`)
  try {
    const network = await dapp.getLocalOrRemoteAccount(daoConfig.daoAccount)
    const networkAccount = network.data as DaoGlobalAccount
    const account = await dapp.getLocalOrRemoteAccount(crypto.hash(`issue-${networkAccount.issue}`))
    if (!account) {
      await _sleep(500)
      return tallyVotes(address, nodeId, dapp)
    }
    const issue = account.data as IssueAccount
    const tx = {
      type: 'tally',
      nodeId,
      from: address,
      issue: issue.id,
      proposals: issue.proposals,
      timestamp: Date.now(),
    }
    dapp.put(tx)
    dapp.log('GENERATED_TALLY: ', nodeId)
  } catch (err) {
    dapp.log('ERR: ', err)
    await _sleep(1000)
    return tallyVotes(address, nodeId, dapp)
  }
}

// DEV_TALLY TRANSACTION FUNCTION
export async function tallyDevVotes(address: string, nodeId: string, dapp: Shardus): Promise<void> {
  try {
    const network = await dapp.getLocalOrRemoteAccount(daoConfig.daoAccount)
    const networkAccount = network.data as DaoGlobalAccount
    const account = await dapp.getLocalOrRemoteAccount(crypto.hash(`dev-issue-${networkAccount.devIssue}`))
    if (!account) {
      await _sleep(500)
      return tallyDevVotes(address, nodeId, dapp)
    }
    const devIssue = account.data as DevIssueAccount
    const tx = {
      type: 'dev_tally',
      nodeId,
      from: address,
      devIssue: devIssue.id,
      devProposals: devIssue.devProposals,
      timestamp: Date.now(),
    }
    dapp.put(tx)
    dapp.log('GENERATED_DEV_TALLY: ', nodeId)
  } catch (err) {
    dapp.log('ERR: ', err)
    await _sleep(1000)
    return tallyDevVotes(address, nodeId, dapp)
  }
}

// APPLY_PARAMETERS TRANSACTION FUNCTION
export async function applyParameters(address: string, nodeId: string, dapp: Shardus): Promise<void> {
  const account = await dapp.getLocalOrRemoteAccount(daoConfig.daoAccount)
  const network = account.data as DaoGlobalAccount
  const tx = {
    type: 'parameters',
    nodeId,
    from: address,
    issue: crypto.hash(`issue-${network.issue}`),
    timestamp: Date.now(),
  }
  dapp.put(tx)
  dapp.log('GENERATED_APPLY: ', nodeId)
}

// APPLY_DEV_PARAMETERS TRANSACTION FUNCTION
export async function applyDevParameters(address: string, nodeId: string, dapp: Shardus): Promise<void> {
  const account = await dapp.getLocalOrRemoteAccount(daoConfig.daoAccount)
  const network = account.data as DaoGlobalAccount
  const tx = {
    type: 'dev_parameters',
    nodeId,
    from: address,
    devIssue: crypto.hash(`dev-issue-${network.devIssue}`),
    timestamp: Date.now(),
  }
  dapp.put(tx)
  dapp.log('GENERATED_DEV_APPLY: ', nodeId)
}

// RELEASE DEVELOPER FUNDS FOR A PAYMENT
export function releaseDeveloperFunds(
  payment: DeveloperPayment,
  address: string,
  nodeId: string,
  dapp: Shardus
): void {
  const tx = {
    type: 'developer_payment',
    nodeId,
    from: address,
    developer: payment.address,
    payment: payment,
    timestamp: Date.now(),
  }
  dapp.put(tx)
  dapp.log('GENERATED_DEV_PAYMENT: ', nodeId)
}

export function getAccountType(data): unknown {
  if (data == null) {
    return 'undetermined'
  }

  if (data.type != null) {
    return data.type
  }

  //make sure this works on old accounts with no type
  if (data.alias !== undefined) {
    return 'UserAccount'
  }
  if (data.nodeRewardTime !== undefined) {
    return 'NodeAccount'
  }
  if (data.inbox !== undefined) {
    return 'AliasAccount'
  }
  if (data.devProposals !== undefined) {
    return 'DevIssueAccount'
  }
  if (data.proposals !== undefined) {
    return 'IssueAccount'
  }
  if (data.devWindows !== undefined) {
    return 'NetworkAccount'
  }
  if (data.totalVotes !== undefined) {
    if (data.power !== undefined) {
      return 'ProposalAccount'
    }
    if (data.payAddress !== undefined) {
      return 'DevProposalAccount'
    }
  }
  return 'undetermined'
}

interface TimestampedTx {
  tx: {
    timestamp?: number
  }
  timestampReceipt: TimestampReceipt
}
export function getInjectedOrGeneratedTimestamp(timestampedTx: TimestampedTx, dapp: Shardus): number {
  const { tx, timestampReceipt } = timestampedTx
  let txnTimestamp: number

  if (tx.timestamp) {
    txnTimestamp = tx.timestamp
    dapp.log(`Timestamp ${txnTimestamp} is extracted from the injected tx.`)
  } else if (timestampReceipt && timestampReceipt.timestamp) {
    txnTimestamp = timestampReceipt.timestamp
    dapp.log(`Timestamp ${txnTimestamp} is generated by the network nodes.`)
  }
  return txnTimestamp
}

export function decodeDaoTxFromEVMTx(
  transaction: Transaction[TransactionType.Legacy] | Transaction[TransactionType.AccessListEIP2930]
): unknown {
  const daoTxString = toAscii(bytesToHex(transaction.data))
  /* prettier-ignore */ if (logFlags.verbose) console.log(`daoTxString`, daoTxString)
  return JSON.parse(daoTxString)
}
