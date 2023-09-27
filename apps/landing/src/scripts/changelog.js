import snarkdown from "snarkdown";

const changelogs = document.querySelector(".vupdate__container");

async function getReleases() {
  const url = "https://api.github.com/repos/consensusnetworks/casimir/releases";
  const response = await fetch(url, {
    method: "GET",
  });

  const json = await response.json();

  if (!Array.isArray(json) || json.length === 0) {
    return null;
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
    };
  });

  return releases;
}

async function displayReleases(releases) {
  releases.shift();
  releases.forEach((r) => {
    const vupdate = document.createElement("div");
    const tag = document.createElement("h3");
    const title = document.createElement("span");
    const body = document.createElement("div");
    const releaseURL = document.createElement("a");

    const bodyHTML = snarkdown(r.body);

    tag.innerText = r.tagName;
    // TODO: get this from the release body, sync wth shane on this
    title.innerText = "Improving user wallet onboarding experience";
    body.innerHTML = bodyHTML;
    releaseURL.innerText = "View release commit";
    releaseURL.href = r.htmlURL;

    vupdate.classList.add("vupdate");
    tag.classList.add("vupdate__tag");
    title.classList.add("text-5");
    title.classList.add("bold");

    body.classList.add("vupdate__body");
    releaseURL.classList.add("vupdate__read");

    vupdate.appendChild(tag);
    vupdate.appendChild(title);
    vupdate.appendChild(body);
    vupdate.appendChild(releaseURL);
    changelogs.appendChild(vupdate);
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const releases = await getReleases();
  displayReleases(releases);
});
