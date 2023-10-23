import { withMermaid } from 'vitepress-plugin-mermaid'

// https://vitepress.dev/reference/site-config
export default withMermaid({
    title: "Casimir Docs",
    head: [['link', { rel: 'icon', href: '/favicon.ico' }]],
    rewrites: {
        'index.md': 'introduction/what-is-casimir.md',
    },
    cleanUrls: true,
    markdown: {
        math: true
    },
    srcDir: 'src',
    outDir: './dist',
    themeConfig: {
        // https://vitepress.dev/reference/default-theme-config
        logo: '/casimir.svg',
        search: {
            provider: 'local'
        },
        sidebar: [
            {
                text: 'Introduction',
                base: '/introduction',
                items: [
                    { text: 'What is Casimir?', link: '/what-is-casimir' },
                    { text: 'Architecture', link: '/architecture' }
                ]
            },
            {
                text: 'Guide',
                base: '/guide',
                items: [
                    { text: 'Accounts', link: '/accounts' },
                    { text: 'Staking', link: '/staking' },
                    { text: 'Operating', link: '/operating' }
                ]
            },
            {
                text: 'Reference',
                base: '/reference',
                items: [
                    { text: 'Contract Addresses', link: '/contract-addresses' },
                    { text: 'Solidity API', link: '/solidity-api' }
                ]
            },
            {
                text: 'Troubleshooting',
                base: '/troubleshooting',
                items: [
                    { text: 'Operator Issues', link: '/operator-issues' },
                    { text: 'Wallet Issues', link: '/wallet-issues' }
                ]
            }
        ],
        socialLinks: [
            { icon: 'github', link: 'https://github.com/consensusnetworks/casimir' }
        ]
    }
})
