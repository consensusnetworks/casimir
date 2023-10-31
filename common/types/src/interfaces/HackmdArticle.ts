export interface HackmdArticle {
    id: string
    title: string
    tags: string[]
    createdAt: number
    titleUpdatedAt: number
    tagsUpdatedAt: number
    publishType: string
    publishedAt: number
    permalink: string
    publishLink: string
    shortId: string
    content: string
    lastChangedAt: number
    lastChangeUser: null
    userPath: null
    teamPath: string
    readPermission: string
    writePermission: string
}