<script lang="ts" setup>
import VueFeather from 'vue-feather'
import useQuestionsAndAnswers from '@/composables/questionsAndAnswers'
import { ref } from 'vue'

const {questionsAndAnswers} = useQuestionsAndAnswers()
const openTab = ref(-1)
const showMore = ref(false)
</script>

<template>
  <div class="my-[60px]">
    <div class="text-center my-[60px]">
      <h1 class="text-[36px] font-[600] mt-[20px]">
        Frequently Asked Questions
      </h1>
      <p class="text-[16px] font-[400] text-grey_4">
        Everything you need to know, in one place!
      </p>
    </div>
    <div class="px-[10%] flex flex-wrap justify-center">
      <div
        v-for="(item, index) in questionsAndAnswers"
        :key="index"
        class="w-full max-w-[800px]"
      >
        <div 
          v-if="showMore? true : index < 5? true: false"
          class="w-full max-w-[800px] border-b border-b-grey_1 pb-[20px] mb-[20px]"
        >
          <button 
            class="w-full flex gap-[10px] items-start justify-between text-grey_6 hover:text-grey_3"
            @click="openTab === index? openTab = -1 : openTab = index"
          >
            <h6 class="text-[14px] font-[500] text-left w-[90%]">
              {{ item.question }}
            </h6>
            <vue-feather
              :type="openTab === index? 'minus-circle':'plus-circle'"
              class="icon w-[20px]"
            />
          </button>
          <div
            v-show="openTab === index"
            class="text-[12px] text-left text-grey_4 mt-[15px]"
          >
            {{ item.answer }}
            <div class="mt-[5px] flex justify-center">
              <a
                v-show="item.link != ''"
                class="text-primary outline-none hover:text-blue_4"
                :href="item.link"
                target="_blank"
              >
                Resourse
                <vue-feather
                  type="link"
                  class="w-[12px]"
                />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
    <button
      class="flex items-center gap-[10px] justify-center w-full text-primary text-[12px] font-[500] hover:text-blue_4"
      @click="showMore = !showMore"
    >
      {{ showMore? 'Show Less' : 'Show More' }}
      <vue-feather
        :type="showMore? 'chevron-up' : 'chevron-down'"
        class="icon w-[20px]"
      />
    </button>
  </div>
</template>


<style scoped></style>