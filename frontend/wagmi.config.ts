import { http, createConfig } from 'wagmi'

import { injected } from 'wagmi/connectors'

const localhost = {
    id: 31337,
    name: 'Localhost',
    network: 'anvil',
    nativeCurrency: {
        decimals: 18,
        name: 'Ether',
        symbol: 'ETH',
    },
    rpcUrls: {
        default: { http: ['http://127.0.0.1:8545'] },
    },
}

export const config = createConfig({
    chains: [localhost],
    transports: {
        [localhost.id]: http(),
    },
    connectors: [
        injected({
            target: 'metaMask',
        }),
    ],
})