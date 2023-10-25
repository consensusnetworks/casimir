import { withMermaid } from 'vitepress-plugin-mermaid'

export default withMermaid({
    title: "Casimir Docs",
    head: [['link', { rel: 'icon', href: '/favicon.ico' }]],
    rewrites: {
        'index.md': 'introduction/what-is-casimir.md',
    },
    cleanUrls: true,
    lastUpdated: true,
    markdown: {
        math: true
    },
    srcDir: 'src',
    outDir: './dist',
    themeConfig: {
        logo: '/casimir.svg',
        search: {
            provider: 'local'
        },
        sidebar: [
            {
                text: 'Introduction',
                items: [
                    { text: 'What is Casimir?', link: '/introduction/what-is-casimir' },
                    { text: 'Architecture', link: '/introduction/architecture' }
                ]
            },
            {
                text: 'Guide',
                items: [
                    { text: 'Accounts', link: '/guide/accounts' },
                    { text: 'Strategies', link: '/guide/strategies' },
                    { text: 'Staking', link: '/guide/staking' },
                    { text: 'Operating', link: '/guide/operating' }
                ]
            },
            {
                text: 'Reference',
                items: [
                    { text: 'Address Registry', link: '/reference/address-registry' },
                    { text: 'Solidity API', link: '/reference/solidity-api' },
                    { text: 'Contract Source', link: 'https://github.com/consensusnetworks/casimir/tree/master/contracts/ethereum/src/v1' }
                ]
            },
            {
                text: 'Troubleshooting',
                items: [
                    { text: 'Operator Issues', link: '/troubleshooting/operator-issues' },
                    { text: 'Wallet Issues', link: '/troubleshooting/wallet-issues' }
                ]
            }
        ],
        socialLinks: [
            { icon: 'github', link: 'https://github.com/consensusnetworks/casimir' }
        ]
    }
})
