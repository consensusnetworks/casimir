<script lang="ts" setup>
import { onMounted, ref, watch } from "vue"
import VueFeather from "vue-feather"
import useBlog from "@/composables/blog"
import router from "@/composables/router"
import { Article } from "@casimir/types"

const appUrl = import.meta.env.PUBLIC_APP_URL || "https://app.dev.casimir.co"
const docsUrl = import.meta.env.PUBLIC_DOCS_URL || "https://docs.dev.casimir.co"
const {
  articles,
  loadingArticles,
} = useBlog()

const article = ref<Article>()

function getActiveArticle(activeRoute: string) {
  const activeArticle = articles.value.filter(item => item.id === activeRoute)[0]
  article.value = activeArticle
}

onMounted(() => {
  let currentRoutes = router.currentRoute.value.fullPath.split("/")
  let activeRoute = currentRoutes[currentRoutes.length - 1]

  // Finds active blog based on route 
  if (!loadingArticles) getActiveArticle(activeRoute)
})

watch([articles, loadingArticles], () => {

  let currentRoutes = router.currentRoute.value.fullPath.split("/")
  let activeRoute = currentRoutes[currentRoutes.length - 1]

  // Finds active blog based on route 
  getActiveArticle(activeRoute)
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
            <a href="/blog">Blog</a>
          </li>
          <li>
            <a href="/changelog">Changelog</a>
          </li>
          <li>
            <a href="https://consensusnetworks.com">Company</a>
          </li>
          <li>
            <a :href="docsUrl">Docs</a>
          </li>
        </ul>
        <a
          :href="appUrl"
          class="btn-primary-sm"
        >
          Launch App
        </a>
      </div>
    </nav>

    <section class="w-full max-w-[960px] mx-auto my-[60px] h-full min-h-[600px] relative">
      <div
        v-if="!article"
        class="absolute top-0 left-0 w-full h-full z-[2] rounded-[3px] overflow-hidden"
      >
        <div class="skeleton_box" />
      </div>
      <div
        v-else
        class="flex items-start min-h-[600px] h-full w-full"
      >
        <div class="h-full w-[200px] pr-[50px] min-h-[600px]">
          <div class="mb-[20px]">
            <router-link
              to="/blog"
              class=""
            >
              <div class="text-[0.833rem;] font-[400] highlight flex items-center gap-5 tracking-wide">
                <vue-feather
                  type="arrow-left"
                  class="h-[0.92rem] mb-3"
                />
                Blogs
              </div>
            </router-link>
          </div>
          <div class="mb-[300px]">
            <h5 class="text-[16px] font-[500] tracking-wide flex items-center">
              ConsensusNetworks
            </h5>
            <h6 class="text-[16px] font-[400] tracking-wide opacity-[0.75]">
              Team
            </h6>
          </div>

          <div>
            <h5 class="text-[16px] font-[500] tracking-wide flex items-center">
              {{ article.type }}
            </h5>
            <h6 class="text-[16px] font-[400] tracking-wide opacity-[0.75]">
              {{ new Date(article.timestamp).toDateString() }}
            </h6>
          </div>
        </div>

        <div class="w-full border-l h-full pl-[50px] min-h-[600px]">
          <div
            class="activeblog_content"
            v-html="article.content"
          />
        </div>
      </div>
    </section>

    <section class="footer">
      <div class="footer__container">
        <span class="c">© 2023 Casimir. All rights reserved.</span>
        <ul>
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


<style>
.activeblog_content {
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding-bottom: 50px;

    font-size: 1.074rem;
    font-weight: 300;
}

.activeblog_content ul {
    margin-left: 20px;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.activeblog_content img {
    width: 100%;
    height: 100%;
}

.activeblog_content h1 {

    font-size: 1.574rem;
    font-weight: 600;
    letter-spacing: -0.75px;
    color: hsl(210, 12%, 12.5%);
}
</style>