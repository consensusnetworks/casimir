<script lang="ts" setup>
import VueFeather from 'vue-feather'
import useBlog from '@/composables/blog.ts'

const {
    articles,
    loadingArticle,
} = useBlog()

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
    <section class="max-w-[960px] mx-auto mt-[60px] min-h-[650px] relative overflow-auto">
      <div
        v-if="loadingArticle"
        class="absolute top-0 left-0 w-full h-full z-[2] rounded-[3px] overflow-hidden"
      >
        <div class="skeleton_box" />
      </div>
      <router-link
        v-for="article in articles"
        :key="article"
        :to="`/blog/${article.id}`"
        class="blog_card flex flex-col mb-[50px]"
      >
        <div class="flex items-center gap-5">
          <span class="text-[0.833rem] font-[500]">
            {{ article.type }} •
          </span>
          <span class="text-8">
            {{ new Date(article.timestamp).toDateString() }}
          </span>
        </div>

        <div class="text-[1.574rem] font-[600] py-10">
          {{ article.title }}
        </div>


        <div class="h-full  w-full overflow-hidden  ">
          <div
            class="overview_blog_content"
            v-html="article.content"
          />
        </div>

        <div class="h-[100px] flex items-end text-8 highlight ">
          <div class="flex items-center gap-3">
            Read More
            <vue-feather
              type="arrow-right"
              class="h-[0.92rem]"
            />
          </div>
        </div>
      </router-link>
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
.blog_card {
    background-color: rgb(242, 242, 245);
    border: 1px solid hsl(236, 10.6%, 87.9%);
    width: 100%;
    height: 320px;
    overflow: hidden;
    cursor: pointer;
    border-radius: 8px;
    padding: 30px 30px 30px 30px;
}

.blog_card:hover {
    box-shadow: inset 0px 1px 0px rgba(0, 0, 0, 0.1),
        inset 0px -1px 0px 1px rgba(0, 0, 0, 0.1);
}

.overview_blog_content {
    font-size: 1.074rem;
    font-weight: 300;

    h1,
    ul,
    il,
    img {
        display: none;
        width: 0;
        height: 0;
    }

}
</style>