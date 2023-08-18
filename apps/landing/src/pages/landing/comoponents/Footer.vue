<script lang="ts" setup>
import useScreenDimentions from '@/composables/screenDimenstions'
const { screenWidth } = useScreenDimentions()
</script>

<template>
  <div class="">
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-[20px] border-b border-b-grey_3 pb-[5px]">
      <h5 class="text-[14px] font-[500]">
        Join Our Community
      </h5>

      <div class="flex items-center justify-between gap-[10px]">
        <!-- social -->
        <a
          href="http://"
          target="_blank"
        >
          <img
            src="/discord.svg"
            alt="Discord Logo"
            class="w-[18px]"
          >
        </a>

        <a
          href="http://"
          target="_blank"
        >
          <img
            src="/github.svg"
            alt="Github Logo"
            class="w-[18px]"
          >
        </a>

        <a
          href="http://"
          target="_blank"
        >
          <img
            src="/twitter_x_logo.png"
            alt="Twitter Logo"
            class="w-[16px]"
          >
        </a>
      </div>
    </div>

    <!-- Content -->
    <div
      class="flex items-start justify-between gap-[20px] py-[30px]"
      :class="screenWidth < 800? 'flex-wrap' : ''"
    >
      <div
        class=" text-left text-[14px] font-[400] text-grey_6 mt-[20px]"
        :class="screenWidth < 800? 'w-full' : 'max-w-[250px]'"
      >
        Join our community, as we strive for greatness. 
        We will keep you updated to our latest content and updates. We promise to get 
        back to you as soon as possible. Thank you!
      </div>

      <div class="flex flex-wrap items-start justify-around gap-[20px] text-left text-[14px] font-[400] text-grey_6 w-full">
        <div class="min-w-[100px] mt-[20px]">
          <h6 class="font-[500] mb-[10px]">
            Product
          </h6>
          <div class="flex flex-col gap-[10px]">
            <router-link to="">
              Features
            </router-link>
            <router-link to="">
              Roadmap
            </router-link>
            <router-link to="">
              Features
            </router-link>
            <router-link to="">
              Q&As
            </router-link>
            <router-link to="">
              Litepaper
            </router-link>
            <router-link to="">
              Casimir App
            </router-link>
          </div>
        </div>

        <div class="min-w-[100px] mt-[20px]">
          <h6 class="font-[500] mb-[10px]">
            About Us
          </h6>
          <div class="flex flex-col gap-[10px]">
            <router-link to="">
              Consensus Networks
            </router-link>
            <router-link to="">
              Development Team
            </router-link>
            <router-link to="">
              Contact Us
            </router-link>
            <router-link to="">
              Our Legal Team
            </router-link>
            <router-link to="">
              Careers
            </router-link>
          </div>
        </div>

        <div class="min-w-[100px] mt-[20px]">
          <h6 class="font-[500] mb-[10px]">
            Community
          </h6>
          <div class="flex flex-col gap-[10px]">
            <router-link to="">
              Ethereum
            </router-link>
            <router-link to="">
              SSV
            </router-link>
            <router-link to="">
              IoTeX
            </router-link>
          </div>
        </div>

        <div class="min-w-[100px] mt-[20px]">
          <h6 class="font-[500] mb-[10px]">
            Resourses
          </h6>
          <div class="flex flex-col gap-[10px]">
            <router-link to="">
              Casimir Effect
            </router-link>
            <router-link to="">
              New To The Field (Crypto)?
            </router-link>
            <router-link to="">
              Latest News
            </router-link>
            <router-link to="">
              Best Practices
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>


<style scoped></style>