<script lang="ts" setup>
</script>
  
<template>
  <div class="loader_spinner">
    <div />
    <div />
    <div />
    <div />
    <div />
    <div />
    <div />
    <div />
    <div />
    <div />
    <div />
    <div />
  </div>
</template>


<style scoped>
.loader_spinner {
  color: official;
  display: inline-block;
  position: relative;
  width: 100%;
  height: 100%;
}

.loader_spinner div {
  transform-origin: 40px 20px;
  animation: loader_spinner 1.2s linear infinite;
}

.loader_spinner div:after {
  content: " ";
  display: block;
  position: absolute;
  top: 3px;
  left: 37px;
  width: 4px;
  height: 10px;
  border-radius: 999px;
  background: #0D5FFF;
  opacity: 0.4;
}

.loader_spinner div:nth-child(1) {
  transform: rotate(0deg);
  animation-delay: -1.1s;
}

.loader_spinner div:nth-child(2) {
  transform: rotate(30deg);
  animation-delay: -1s;
}

.loader_spinner div:nth-child(3) {
  transform: rotate(60deg);
  animation-delay: -0.9s;
}

.loader_spinner div:nth-child(4) {
  transform: rotate(90deg);
  animation-delay: -0.8s;
}

.loader_spinner div:nth-child(5) {
  transform: rotate(120deg);
  animation-delay: -0.7s;
}

.loader_spinner div:nth-child(6) {
  transform: rotate(150deg);
  animation-delay: -0.6s;
}

.loader_spinner div:nth-child(7) {
  transform: rotate(180deg);
  animation-delay: -0.5s;
}

.loader_spinner div:nth-child(8) {
  transform: rotate(210deg);
  animation-delay: -0.4s;
}

.loader_spinner div:nth-child(9) {
  transform: rotate(240deg);
  animation-delay: -0.3s;
}

.loader_spinner div:nth-child(10) {
  transform: rotate(270deg);
  animation-delay: -0.2s;
}

.loader_spinner div:nth-child(11) {
  transform: rotate(300deg);
  animation-delay: -0.1s;
}

.loader_spinner div:nth-child(12) {
  transform: rotate(330deg);
  animation-delay: 0s;
}

@keyframes loader_spinner {
  0% {
    opacity: 1;
  }

  100% {
    opacity: 0;
  }
}</style>