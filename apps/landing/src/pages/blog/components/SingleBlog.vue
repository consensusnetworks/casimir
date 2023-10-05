<script setup>
import { onMounted, ref, computed, watch } from 'vue'
import VueFeather from 'vue-feather'
import useBlogs from '@/composables/blogs.ts'

const {
    activeBlog,
    allBlogs,
    loadingBlogs,
} = useBlogs()

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

    <section>
      <div>
        single blog
      </div>
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