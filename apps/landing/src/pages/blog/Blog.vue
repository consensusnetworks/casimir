<script setup>
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
            <a href="/blog/announcements">Blog</a>
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
        <div>
          <router-view />
        </div>
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


<style scoped>
</style>