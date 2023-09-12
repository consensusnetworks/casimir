import { animate } from "motion";

const slots = document.querySelector(".slots");
const newsletterInput = document.querySelector("#newsletter-input");
const newsletterSubmit = document.querySelector("#newsletter-submit");

newsletterSubmit.addEventListener("click", (event) => {
  event.preventDefault();
  const email = newsletterInput.value;
  console.log(email);
  newsletterInput.value = "";
});

function newSlot() {
  const slot = document.createElement("div");
  const span = document.createElement("span");
  const p = document.createElement("p");

  slot.classList.add("slot");
  span.classList.add("highlight");
  span.classList.add("text-10");

  p.textContent = "Some article description stuff.";
  span.textContent = "New Transaction";

  slot.appendChild(span);
  slot.appendChild(p);
  slots.appendChild(slot);
}

[...Array(12)].forEach((_, i) => {
  newSlot();
});

slots.childNodes.forEach(slot => {
  slot.addEventListener("mouseenter", (event) => {
    animate(slot, {
      x: -50,
      y: -45,
      rotate: -2,
    });
  });

  slot.addEventListener("mouseleave", (event) => {
    animate(slot, {
      x: 0,
      y: 0,
      rotate: 0,
    });
  });
});
