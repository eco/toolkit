import { encodePacked, encodeAbiParameters, keccak256 } from "viem";
import { RouteType, RewardType, IntentType } from "@eco-foundation/routes";

const RouteStruct = [
  { name: 'salt', type: 'bytes32' },
  { name: 'source', type: 'uint256' },
  { name: 'destination', type: 'uint256' },
  { name: 'inbox', type: 'address' },
  {
    name: 'calls',
    type: 'tuple[]',
    components: [
      { name: 'target', type: 'address' },
      { name: 'data', type: 'bytes' },
      { name: 'value', type: 'uint256' },
    ],
  },
]

const RewardStruct = [
  { name: 'creator', type: 'address' },
  { name: 'prover', type: 'address' },
  { name: 'deadline', type: 'uint256' },
  { name: 'nativeValue', type: 'uint256' },
  {
    name: 'tokens',
    type: 'tuple[]',
    components: [
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
  },
]

export function encodeRoute(route: RouteType) {
  return encodeAbiParameters(
    [{ type: 'tuple', components: RouteStruct }],
    [route],
  )
}

export function encodeReward(reward: RewardType) {
  return encodeAbiParameters(
    [{ type: 'tuple', components: RewardStruct }],
    [reward],
  )
}

export function encodeIntent(intent: IntentType) {
  return encodePacked(
    ['bytes32', 'bytes32'],
    [keccak256(encodeRoute(intent.route)), keccak256(encodeReward(intent.reward))],
  )
}
