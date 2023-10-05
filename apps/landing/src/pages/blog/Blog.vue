<script setup>
import { onMounted, ref, computed, watch } from 'vue'
import snarkdown from 'snarkdown'

const loading = ref(true)

const activeHTMLBlog = ref(null)
const htmlBlogList = ref([])

async function getContentOfBlog(itemId) {

  const response = await fetch(`http://localhost:3003/api/hackmd/${itemId}`)
  const json = await response.json()
  const md = snarkdown(json.content)

  return md
}

const activeHTMLBlogContent = ref('')

watch(activeHTMLBlog, async () => {

  if (!activeHTMLBlog.value) return ''
  const content = await getContentOfBlog(activeHTMLBlog.value)
  activeHTMLBlogContent.value = content
})

onMounted(async () => {
  try {
    const response = await fetch('http://localhost:3003/api/hackmd')

    const jsonList = await response.json()
    let blogList = []

    for (let i = 0; i < jsonList.length; i++) {
      let title = jsonList[i].title
      let id = jsonList[i].id

      blogList.push(
        {
          title: title,
          id: id
        }
      )
    }

    htmlBlogList.value = blogList
    activeHTMLBlog.value = blogList[0].id
    loading.value = false
  } catch (error) {
    console.error('Error trying to fetch:', error)
  }
})

</script>

<template>
  <div>
    <nav class="nav">
      <div class="nav__container">
        <a href="/">
          <img
            class="logo"
            src="/logo.svg"
          >
        </a>
        <ul class="nav__links">
          <li>
            <a href="https://github.com/consensusnetworks/casimir#casimir">API Reference</a>
          </li>
          <li>
            <a href="/blog">Blog</a>
          </li>
          <li>
            <a href="/changelog">Changelog</a>
          </li>
          <li>
            <a href="https://consensusnetworks.com">Company</a>
          </li>
        </ul>
        <a
          href="https://app.dev.casimir.co"
          class="btn-primary-sm"
        >
          Launch App
        </a>
      </div>
    </nav>
    <section class="flex items-start justify-between max-w-[960px] mx-auto mt-[60px] h-[600px] relative overflow-auto">
      <div
        v-if="loading"
        class="absolute top-0 left-0 w-full h-full z-[2] rounded-[3px] overflow-hidden"
      >
        <div class="skeleton_box" />
      </div>
      <div class=" pr-10 w-[200px] h-full border-r sticky top-0 left-0">
        <h3>
          Anncouncements
        </h3>
        <div class="flex flex-col items-start content-start gap-5 mt-20">
          <button
            v-for="blog in htmlBlogList"
            :key="blog"
            class="text-9 cursor-pointer text-left w-full"
            :class="blog.id === activeHTMLBlog ? 'bg-blue-100' : ' bg-none'"
            @click="activeHTMLBlog = blog.id"
          >
            {{ blog.title }}
          </button>
        </div>
      </div>
      <div
        class="blog_content w-full h-full overflow-auto"
        v-html="activeHTMLBlogContent"
      />
    </section>

    <section class="footer">
      <div class="footer__container">
        <span class="c">© 2023 Casimir. All rights reserved.</span>
        <ul>
          <li>
            <a
              href="https://api.casimir.co"
              target="_blank"
            >API Reference</a>
          </li>
          <li>
            <a
              href="/"
              target="_blank"
            >Discord</a>
          </li>
          <li>
            <a
              href="https://github.com/consensusnetworks/casimir"
              target="_blank"
            >GitHub</a>
          </li>
          <li>
            <a
              href="/"
              target="_blank"
            >Contact Us</a>
          </li>
        </ul>
      </div>
    </section>
  </div>
</template>


<style lang="scss">
.blog_content {
  height: 100%;
  max-width: 960px;
  margin: auto;
  padding-left: 10px;
  display: flex;
  flex-direction: column;
  justify-content: start;
  align-items: start;
  gap: 10px;

  ul {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
    gap: 10px;
    padding: 0;
    margin: 0;
    margin-top: 20px;
    margin-left: 20px;
  }

  h1 {
    font-size: 2.488rem;
    font-weight: 400;
    letter-spacing: -1.2px;
    line-height: 1.38;
    color: hsl(210, 12%, 12.5%);
  }

  h2 {
    font-size: 1.728rem;
    font-weight: 400;
    letter-spacing: -0.41px;
    line-height: 1.38;
    color: hsl(210, 12%, 12.5%);
  }

  h3 {
    font-size: 1.44rem;
    font-weight: 400;
    letter-spacing: -0.21px;
    line-height: 1.38;
    color: hsl(210, 12%, 12.5%);
  }

  h4 {
    font-size: 1.2rem;
    font-weight: 400;
    line-height: 1.38;
    color: hsl(210, 12%, 12.5%);
  }

  h5 {
    font-size: 1rem;
    font-weight: 400;
    line-height: 1.38;
    color: hsl(210, 12%, 12.5%);
  }

  h6 {
    font-size: 0.92rem;
    font-weight: 400;
    line-height: 1.38;
    color: hsl(210, 12%, 12.5%);
  }

  p {
    font-size: 1rem;
    font-weight: 400;
    letter-spacing: -0.04px;
    line-height: 1.38;
    max-width: 520px;
    word-wrap: break-word;
  }

  span {
    font-size: 1rem;
    font-weight: 400;
  }
}

.blog_nav {
  margin: 60px auto;
  display: flex;
  flex-direction: column;
  justify-content: start;
  align-items: start;
}
</style>