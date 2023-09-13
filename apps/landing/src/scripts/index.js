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

  span.textContent = "New Transaction";


  slot.classList.add("slot");
  span.classList.add("highlight");
  span.classList.add("text-10");

  slot.appendChild(span);
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
