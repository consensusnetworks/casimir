<script lang="ts" setup>

// import { ArrowLeftIcon , DownloadIcon } from '@heroicons/vue/outline'
</script>

<template>
  <div class="">
    <div class="relative">
      <img
        src="/blob.svg"
        alt=""
        class="absolute -top-20 right-0 -z-1 w-[75%]"
      >
    </div>
    <div class="bg-black px-[50px] py-[100px] text-white">
      <h1 class=" pdf-header max-w-[800px] mb-[100px]">
        <span
          class="mr-2 hover:text-[#F36F38] cursor-pointer"
          @click="$router.push('/')"
        >Casimir</span>  protocol: Whitepaper
      </h1>
      <span>Infrastructure to manage and discover your digital assets</span> <br>
      <!-- <button
        class="flex bg-white rounded-md px-4 py-2 text-black button mt-[100px] hover:bg-[#F36F38] opacity-40"
        disabled
      >
        Download PDF <DownloadIcon class="w-[24px] ml-4" />
      </button> -->
      <h1 class="py-4 flex text-xl">
        Coming soon!
      </h1>
    </div>
  </div>
</template>

<style>
.pdf-header {
  font-family: Inter;
  font-style: normal;
  font-size: 85px;
  font-weight: 900;
  line-height: 105px;
  letter-spacing: 0em;
  text-align: left;
}

.button {
  font-family: Inter;
  font-style: normal;
  font-weight: 700;
  font-size: 16px;
  line-height: 24px;
}

</style>