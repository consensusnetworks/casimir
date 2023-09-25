const slots = document.querySelector(".slots");
const newsletterInput = document.querySelector("#newsletter-input");
const newsletterSubmit = document.querySelector("#newsletter-submit");


if (newsletterInput && newsletterSubmit) {
  newsletterSubmit.addEventListener("click", (event) => {
    event.preventDefault();
    const email = newsletterInput.value;
    console.log(email);
    newsletterInput.value = "";
  });
}

const eventTypes = ["transaction", "transfer", "deposit", "withdrawal", "Restaking", "Staking"];

const events = Array.from({ length: 12 }, () => {
  return {
    type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
    amount: Math.floor(Math.random() * 1000),
    date: "2021-01-01",
    from: "0x" + Math.floor(Math.random() * 16777215).toString(16),
    to: "0x" + Math.floor(Math.random() * 16777215).toString(16),
  };
});


function newSlot() {
  const randomEvent = Math.floor(Math.random() * events.length);
  const event = events[randomEvent];


  const slot = document.createElement("div");
  const pill = document.createElement("span");
  const slotObj = document.createElement("div");
  const key = document.createElement("span");
  const value = document.createElement("span");

  slot.classList.add("slot");
  pill.classList.add("pill");
  slotObj.classList.add("slot__obj");
  key.classList.add("text-9");
  value.classList.add("text-9");


  pill.innerText = event.type;
  key.innerText = "From";
  value.innerText = event.from;

  slotObj.appendChild(key);
  slotObj.appendChild(value);
  slot.appendChild(pill);
  slot.appendChild(slotObj);
  slots.appendChild(slot);
}

[...Array(12)].forEach((_, i) => {
  newSlot();
});