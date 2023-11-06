import { onMounted, onUnmounted, readonly, ref } from "vue"
import snarkdown from "snarkdown"
import { Article } from "@casimir/types"

const initializeComposable = ref(false)

const blogUrl = import.meta.env.PUBLIC_BLOG_URL || "http://localhost:4001"
const articles = ref([] as Article[])
const loadingArticles = ref(true)

export default function useBlog() {
  async function getArticleContent(itemId: string) {
    const response = await fetch(`${blogUrl}/articles/${itemId}`)
    const json = await response.json()
    const md = snarkdown(json.content)
    return md
  }

  onMounted(async () => {
    if (!initializeComposable.value) {
      loadingArticles.value = true
      try {
        const response = await fetch(`${blogUrl}/articles`)
        const jsonList = await response.json()
        const articleList = []

        for (let i = 0; i < jsonList.length; i++) {
          const title = jsonList[i].title
          const content = await getArticleContent(jsonList[i].id)
          const timestamp = jsonList[i].publishedAt
          const id = jsonList[i].id
          articleList.push({
            title: title,
            content: content,
            timestamp: timestamp,
            type: "Blog",
            id: id,
          })
        }

        articles.value = articleList
        loadingArticles.value = false
      } catch (error) {
        console.log("Error fetching articles", error)
        loadingArticles.value = false
      }

      initializeComposable.value = true
    }
  })

  onUnmounted(() => {
    initializeComposable.value = false
  })

  return {
    articles: readonly(articles),
    loadingArticles: readonly(loadingArticles),
  }
}
