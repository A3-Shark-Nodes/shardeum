import { Shardus } from '@shardus/core'
import * as crypto from '@shardus/crypto-utils'
import { Request, Response } from 'express'
import { getShardusAPI } from '../../../index'
import { networkAccount } from '../../../shardeum/shardeumConstants'

export const all = (dapp: Shardus) => async (_req: Request, res: Response): Promise<void> => {
  try {
    const network = await getShardusAPI().getLocalOrRemoteAccount(networkAccount)

    const issue = "data" in network
      && typeof network.data === "object"
      && "issue" in network.data
      ? network.data.issue : 0;

    const proposals = []
    for (let i = 1; i <= issue; i++) {
      const issue = await getShardusAPI().getLocalOrRemoteAccount(crypto.hash(`issue-${i}`))
      const proposalCount =
        typeof issue?.data == "object"
          && "proposalCount" in issue.data
          ? issue.data.proposalCount : 0;

      for (let j = 1; j <= proposalCount; j++) {
        const proposal = await getShardusAPI().getLocalOrRemoteAccount(crypto.hash(`issue-${i}-proposal-${j}`))
        if (proposal && proposal.data) {
          proposals.push(proposal.data)
        }
      }
    }
    res.json({ proposals })
  } catch (error) {
    dapp.log(error)
    res.json({ error })
  }
}