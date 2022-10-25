<script lang="ts" setup>
  import { ref } from 'vue'

  const socialMedia =  ref([
    {
      name: 'discord',
      content: 'Join discussions on our Discord!',
      link: 'https://discord.gg/hkJD9gnN'
    },
    {
      name: 'twitter',
      content: 'Follow our Twitter for updates and upcoming events!',
      link: 'https://mobile.twitter.com/CasimirAssets'
    },
    {
      name: 'github',
      content: 'Follow our development progress on GitHub!',
      link: 'https://github.com/consensusnetworks/casimir'
    },
    {
      name: 'google',
      content: 'Contact us at Info@conensusnetworks.com!',
      link: 'mailto:Info@consensusnetworks.com?subject=Me&body=Dear Casimir Dev Team!'
    },
  ])

  const selectedMedia = ref(-1)

</script>

<template>
  <div class="grid grid-cols-6">
    <div class="bg-black col-span-4 csm-md:col-span-6 h-routerview">
      <div class="px-margins mt-[20px]">
        <h5 class="text-grey_2">
          Non-custodial staking and asset managment platform
        </h5>
      </div>
      <div class="px-margins mt-[200px]">
        <a
          v-for="(item, i) in socialMedia"
          :key="i"
          class="social-button mr-gutter"
          :href="item.link"
          target="_blank"
          @mouseenter="selectedMedia = i"
          @mouseleave="selectedMedia = -1"
        >
          <div class="flex align-middle">
            <i
              :class="'iconoir-' + item.name"
              class="mr-gutter"
            />
            <div 
              v-if="selectedMedia === i"
              class="my-auto text-grey_8 w-full text-right"
            >
              <h6 class="font-medium my-auto"> {{ item.content }} </h6> 
            </div>
          </div>
        </a>
      </div>
    </div>
    <div class="col-span-2 csm-md:sr-only bg-black">
      <div class="absolute w-[34vw] h-screen top-0 right-0 bg-white">
        <img
          src="./components/landing-img.svg"
          alt="Landing Page Image"
          class="w-[100%] h-[100%]"
        >
      </div>
    </div>
  </div>
</template>
