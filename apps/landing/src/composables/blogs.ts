import { onMounted, onUnmounted, readonly, ref } from "vue"
import snarkdown from "snarkdown"

const initializeComposable = ref(false)

type blog = {
  title: string;
  content: string;
  timestamp: string;
  type: string;
  id: string;
};

const allBlogs = ref([] as blog[])
const loadingBlogs = ref(true)

export default function useBlogs() {
  async function getContentOfBlog(itemId: string) {
    const response = await fetch(`http://localhost:3003/api/hackmd/${itemId}`)
    const json = await response.json()
    const md = snarkdown(json.content)

    return md
  }

  onMounted(async () => {
    if (!initializeComposable.value) {
      loadingBlogs.value = true
      try {
        const response = await fetch("http://localhost:3003/api/hackmd")
        const jsonList = await response.json()
        const blogList = []

        for (let i = 0; i < jsonList.length; i++) {
          const title = jsonList[i].title
          const content = await getContentOfBlog(jsonList[i].id)
          const timestamp = jsonList[i].publishedAt
          const id = jsonList[i].id
          blogList.push({
            title: title,
            content: content,
            timestamp: timestamp,
            type: "Blog",
            id: id,
          })
        }

        allBlogs.value = blogList
        loadingBlogs.value = false
      } catch (error) {
        console.error("Error trying to fetch:", error)
        loadingBlogs.value = false
      }

      initializeComposable.value = true
    }
  })

  onUnmounted(() => {
    initializeComposable.value = false
  })

  return {
    allBlogs: readonly(allBlogs),
    loadingBlogs: readonly(loadingBlogs),
  }
}
