import { http, createConfig } from 'wagmi'
import { localhost } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'

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