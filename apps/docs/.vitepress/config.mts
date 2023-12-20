import { withMermaid } from 'vitepress-plugin-mermaid'

export default withMermaid({
    title: "Casimir Docs",
    head: [['link', { rel: 'icon', href: '/favicon.ico' }]],
    cleanUrls: true,
    lastUpdated: true,
    markdown: {
        math: true
    },
    srcDir: 'src',
    outDir: './dist',
    themeConfig: {
        nav: [
            { text: 'App', link: process.env.APP_URL || 'https://app.dev.casimir.co' },
            { text: 'Website', link: process.env.WEBSITE_URL || 'https://dev.casimir.co' },
        ],
        logo: '/casimir.svg',
        search: {
            provider: 'local'
        },
        sidebar: [
            {
                text: 'Introduction',
                items: [
                    { text: 'What is Casimir?', link: '/introduction/what-is-casimir' },
                    { text: 'Architecture', link: '/introduction/architecture' },
                    { text: 'Stake Configs', link: '/introduction/stake-configs' },
                    { text: 'User Accounts', link: '/introduction/user-accounts' }
                ]
            },
            {
                text: 'Guide',
                items: [
                    { text: 'Staking', link: '/guide/staking' },
                    { text: 'Operating', link: '/guide/operating' },
                    { text: 'Troubleshooting', link: '/guide/troubleshooting' }
                ]
            },
            {
                text: 'Reference',
                items: [
                    { text: 'Address Registry', link: '/reference/address-registry' },
                    { text: 'Solidity API', link: '/reference/solidity-api' },
                    { text: 'Contract Source', link: 'https://github.com/consensusnetworks/casimir/tree/master/contracts/ethereum/src/v1' },
                    { text: 'Hacken Audit', link: `${process.env.DOCS_URL}/hacken-audit.pdf` }
                ]
            }
        ],
        socialLinks: [
            { icon: 'github', link: 'https://github.com/consensusnetworks/casimir' }
        ]
    }
})
