<script lang="ts" setup>
  import { ref } from 'vue'
import NavBar from '../../components/nav/NavBar.vue'

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
  <div class="grid grid-cols-3 csm:grid-cols-2 gap-gutter h-full">
    <div class="bg-black col-span-2">
      <NavBar />
      <div class="px-margins mt-[100px]">
        <h2 class="font-regular text-grey_5">
          Simple self custody for all of your digital assets
        </h2>
        <h5 class="text-grey_2 mt-[40px]">
          Non-custodial staking and asset managment platform
        </h5>
      </div>
      <div class="px-margins mt-[45%]">
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
    <div class="csm:sr-only ">
      images
    </div>
  </div>
</template>
