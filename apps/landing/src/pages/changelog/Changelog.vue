<script lang="ts" setup>
import snarkdown from 'snarkdown'




async function getReleases() {
  const url = 'https://api.github.com/repos/consensusnetworks/casimir/releases'
  const response = await fetch(url, {
    method: 'GET',
  })

  const json = await response.json()

  if (!Array.isArray(json) || json.length === 0) {
    return null
  }

  const releases = json.map((r) => {
    return {
      htmlURL: r.html_url,
      tagName: r.tag_name,
      publishedAt: r.published_at,
      body: r.body,
      author: {
        name: r.author.login,
        avatar: r.author.avatar_url,
        htmlURL: r.author.html_url,
      },
    }
  })

  return releases
}

async function displayReleases(releases) {
  releases.shift()
  const changelogs = document.querySelector('.vupdate__container')
  releases.forEach((r) => {
    const vupdate = document.createElement('div')
    const tag = document.createElement('h3')
    const title = document.createElement('span')
    const body = document.createElement('div')
    const releaseURL = document.createElement('a')

    const bodyHTML = snarkdown(r.body)

    tag.innerText = r.tagName
    // TODO: get this from the release body, sync wth shane on this
    title.innerText = 'Improving user wallet onboarding experience'
    body.innerHTML = bodyHTML
    releaseURL.innerText = 'View release commit'
    releaseURL.href = r.htmlURL

    vupdate.classList.add('vupdate')
    tag.classList.add('vupdate__tag')
    title.classList.add('text-5')
    title.classList.add('bold')

    body.classList.add('vupdate__body')
    releaseURL.classList.add('vupdate__read')

    vupdate.appendChild(tag)
    vupdate.appendChild(title)
    vupdate.appendChild(body)
    vupdate.appendChild(releaseURL)
    changelogs.appendChild(vupdate)
  })
}

document.addEventListener('DOMContentLoaded', async () => {
  const releases = await getReleases()
  console.log(releases)
  displayReleases(releases)
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
            <a
              class="text-9"
              href="https://github.com/consensusnetworks/casimir#casimir"
            >
              API Reference
            </a>
          </li>
          <li><a href="/blog">Blog</a></li>
          <li>
            <a
              class="active"
              href="/changelog"
            >Changelog</a>
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

    <section class="changelog">
      <div class="changelog__header">
        <h1>Changelog</h1>
        <span class="text-7">Latest public releases and product update</span>
      </div>
      <div class="changelog__container">
        <div class="vupdate__container" />
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


<style scoped></style>