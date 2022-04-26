import { MsgGrant, MsgRevoke } from 'cosmjs-types/cosmos/authz/v1beta1/tx'
import { MsgGrantAllowance, MsgRevokeAllowance } from 'cosmjs-types/cosmos/feegrant/v1beta1/tx'
import { GenericAuthorization } from 'cosmjs-types/cosmos/authz/v1beta1/authz';
import { Registry } from '@cosmjs/proto-signing'
import { SigningStargateClient, isBroadcastTxSuccess } from '@cosmjs/stargate';
import axios from 'axios';

export const stakebotUrl = "https://stakebot.plural.to"

const authzGrantMsgType = "/cosmos.authz.v1beta1.MsgGrant"
const authzRevokeMsgType = "/cosmos.authz.v1beta1.MsgRevoke"
const feegrantAllowMsgType = "/cosmos.feegrant.v1beta1.MsgGrantAllowance"
const feegrantRevokeMsgType = "/cosmos.feegrant.v1beta1.MsgRevokeAllowance"
const withdawRewardMsgType = "/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward"
const delegateMsgType = "/cosmos.staking.v1beta1.MsgDelegate"
const genericAuthzMsgType = "/cosmos.authz.v1beta1.GenericAuthorization"



export async function registerAddress(offlineSigner, rpc, userAddress, botAddress, frequency, tolerance, denom) {
    const registry = new Registry()
    registry.register(authzGrantMsgType, MsgGrant)
    registry.register(authzRevokeMsgType, MsgRevoke)
    registry.register(feegrantAllowMsgType, MsgGrantAllowance)
    registry.register(feegrantRevokeMsgType, MsgRevokeAllowance)
    const client = await SigningStargateClient.connectWithSigner(
      rpc,
      offlineSigner,
      { registry: registry}
    )
    const msgs = []
    msgs.push({ 
        typeUrl: authzGrantMsgType,
        value: createGrantMsg(userAddress, botAddress, withdawRewardMsgType)
    })
    msgs.push({
        typeUrl: authzGrantMsgType,
        value: createGrantMsg(userAddress, botAddress, delegateMsgType)
    })
    msgs.push({
        typeUrl: authzGrantMsgType,
        value: createGrantMsg(userAddress, botAddress, delegateMsgType)
    })
    const resp = await client.signAndBroadcast(userAddress, msgs, { 
        amount: [{
            denom: denom,
            amount: "0",
        }],
        gas: "100000",
    })
    if (!isBroadcastTxSuccess(resp)) {
        throw new Error(resp.rawLog)
    }

    axios.get()
}

function createGrantMsg(granter, grantee, msgType) {
    const genericAuthMsg = {
        msg: msgType
    }
    
    return {
        granter: granter,
        grantee: grantee,
        grant: {
            authorization: {
                typeUrl: genericAuthzMsgType,
                value: GenericAuthorization.encode(genericAuthMsg).finish()
            },
            // it's currently not possible to have no expiration so we set something
            // far in the future (10 years)
            expiration: setExpiry(10), 
        }
    }
}

function setExpiry(years) {
    const d = new Date()
    const y = d.getFullYear()
    const months = d.getMonth()
    const days = d.getDay()
    return new Date(y + years, months, days)
}