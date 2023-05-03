<script lang="ts" setup>
import LineChartJS from '@/components/charts/LineChartJS.vue'
import { onMounted } from 'vue'

onMounted(() => {
    // Needed for new Icon Library
    // eslint-disable-next-line no-undef
    feather.replace()
})
</script>

<template>
  <div class="card_container pt-[42px] pb-[34px] text-black">
    <div class="px-[32px]">
      <div class="flex justify-between items-start pb-[20px] border-b border-b-[#EAECF0] ">
        <div>
          <div class="flex items-center gap-[8px]">
            <h6 class="card_title">
              Staking Providers
            </h6>
            <div class="provider_amount_pill">
              25 providers
            </div>
          </div>
          <div class="card_subtitle mt-[4px]">
            Keep track of vendor and their security ratings
          </div>
        </div>
        <div class="flex items-start gap-[12px]">
          <button class="flex items-center gap-[8px] export_button">
            <i
              data-feather="upload-cloud" 
              class="w-[17px] h-min"
            />
            Export
          </button>

          <button class="flex items-center gap-[8px] add_vendor_button">
            <i
              data-feather="plus" 
              class="w-[16px] h-min"
            />
            Add vendor
          </button>
        </div>
      </div>
      <div class="flex justify-between items-center h-[64px] border-b border-b-[#EAECF0]">
        <div class="grouped_buttons overflow-hidden">
          <button class="timeframe_button">
            View all
          </button>
          <button class="timeframe_button border-x border-x-[#D0D5DD] bg-[#F3F3F3]">
            Monitored
          </button>
          <button class="timeframe_button">
            Unmonitored
          </button>
        </div>

        <div class="flex items-center gap-[12px]">
          <div class="flex items-center gap-[8px] search_bar">
            <i
              data-feather="search" 
              class="w-[20px] h-min text-[#667085]"
            />
            <input
              type="text"
              class="w-full outline-none"
              placeholder="Search"
            >
          </div>

          <button class="filters_button">
            <i
              data-feather="search" 
              class="w-[20px] h-min"
            />
            Filters
          </button>
        </div>
      </div>
    </div>
    <table
      class="w-full"
    >
      <thead>
        <tr class="bg-[#FCFCFD] border-b border-b-[#EAECF0]">
          <th class="w-[218px]">
            <div class="table_header flex items-center">
              <button class="checkbox_button mr-[12px]">
                <i
                  data-feather="minus" 
                  class="w-[14px] h-min"
                />
              </button>
              Vendor
              <button class="ml-[4px]">
                <i
                  data-feather="arrow-down" 
                  class="w-[16px] h-min text-[#667085]"
                />
              </button>
            </div>
          </th>
          <th class="w-[290px]">
            <div class="table_header">
              Rating
            </div>
          </th>
          <th class="w-[128px]">
            <div class="table_header">
              Last assessed
            </div>
          </th>
          <th class="w-[163px]">
            <div class="table_header">
              Status
            </div>
          </th>
        </tr>
      </thead>
      <tbody
        class="w-full"
      >
        <tr
          v-for="item in 7"
          :key="item"
          class="w-full text-grey_5 text-body border-b border-grey_2"
        >
          <td class="px-[24px] py-[12px]">
            <div class="flex gap-[12px] items-center">
              <button class="checkbox_button mr-[12px]">
                <i
                  data-feather="check" 
                  class="w-[14px] h-min"
                />
              </button>
              <img
                src="/Avatar.svg"
                alt="Avatar "
                class="w-[40px] h-[40px] rounded-[999px]"
              >
              <h6 class="vendor_name">
                Catalog
              </h6>
            </div>
          </td>
          <td class="pl-[24px] py-[12px]">
            <div class="flex items-center gap-[8px]">
              <div class="flex items-center gap-[12px]">
                <div class="w-[157px] bg-[#EAECF0] rounded-[4px] overflow-hidden h-[8px]">
                  <div class="w-[67%] bg-[#4B5059] rounded-[4px] h-full" />
                </div>
                <span class="rating_text">
                  67
                </span>
              </div>
              <div class="flex gap-[4px] items-center text-[#027A48] px-[6px] py-[5px] rounded-[16px] bg-[#ECFDF3]">
                <i
                  data-feather="arrow-up" 
                  class="w-[12px] h-min text-[#12B76A]"
                />
                <span class="rating_percentage">
                  5%
                </span>
              </div>
            </div>
          </td>
          <td class="pl-[24px] py-[12px]">
            <div class="flex items-center gap-[8px]">
              <span class="last_assessed_text">
                22 Jan 2022
              </span>
            </div>
          </td>
          <td class="pl-[24px] py-[12px]">
            <div class="flex items-center gap-[7px] status_pill w-min">
              <div class="w-[6px] h-[6px] rounded-[999px] bg-[#12B76A]" />
              <span>
                Active
              </span>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
    <div class="flex justify-between items-center mt-[12px]">
      <div class="page_number ml-[56px]">
        Page 1 of 10
      </div>
      <div class="flex items-center gap-[12px]">
        <button class="pagination_button">
          Previous
        </button>
        <button class="pagination_button mr-[33px]">
          Next
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.status_pill{
    font-family: 'IBM Plex Sans';
    font-style: normal;
    font-weight: 500;
    font-size: 12px;
    line-height: 18px;
    text-align: center;
    color: #027A48;
    padding: 2px 8px 2px 6px;
    background: #ECFDF3;
    border-radius: 16px;
}
.last_assessed_text{
    font-family: 'IBM Plex Sans';
    font-style: normal;
    font-weight: 400;
    font-size: 14px;
    line-height: 20px;
    color: #667085;
}
.rating_percentage{
    font-family: 'Inter';
    font-style: normal;
    font-weight: 500;
    font-size: 12px;
    line-height: 18px;
    text-align: center;
    color: #027A48;
}
.rating_text{
    font-family: 'IBM Plex Sans';
    font-style: normal;
    font-weight: 500;
    font-size: 14px;
    line-height: 20px;
    color: #344054;
}
.vendor_name{
    font-family: 'IBM Plex Sans';
    font-style: normal;
    font-weight: 500;
    font-size: 14px;
    line-height: 20px;
    color: #101828;
}
.checkbox_button{
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    width: 20px;
    height: 20px;
    background: #F5F8FF;
    border: 1px solid #ACBFDC;
    border-radius: 6px;
    color: #7D8398;
}
.table_header{
    padding: 12px 24px;
    font-family: 'IBM Plex Sans';
    font-style: normal;
    font-weight: 500;
    font-size: 12px;
    line-height: 18px;
    color: #667085;
    text-align: left;
}
.pagination_button{
    font-family: 'IBM Plex Sans';
    font-style: normal;
    font-weight: 500;
    font-size: 14px;
    line-height: 20px;
    color: #344054;
    padding: 6px 12px;
    background: #FFFFFF;
    border: 1px solid #D0D5DD;
    box-shadow: 0px 1px 2px rgba(16, 24, 40, 0.05);
    border-radius: 8px;
}
.page_number{
    font-family: 'IBM Plex Sans';
    font-style: normal;
    font-weight: 500;
    font-size: 14px;
    line-height: 20px;
    color: #344054;
}
.filters_button {
    font-family: 'IBM Plex Sans';
    font-style: normal;
    font-weight: 500;
    font-size: 14px;
    line-height: 20px;
    color: #344054;
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    padding: 10px 16px;
    gap: 8px;
    width: 101px;
    height: 40px;
    background: #FFFFFF;
    border: 1px solid #D0D5DD;
    box-shadow: 0px 1px 2px rgba(16, 24, 40, 0.05);
    border-radius: 8px;
}
.search_bar{
    width: 316px;
    height: 34px;
    background: #FFFFFF;
    border: 1px solid #D0D5DD;
    box-shadow: 0px 1px 2px rgba(16, 24, 40, 0.05);
    border-radius: 8px;
    padding: 5px 12px;
}
.search_bar input{
    font-family: 'IBM Plex Sans';
    font-style: normal;
    font-weight: 400;
    font-size: 14px;
    line-height: 24px;
    color: #667085;
}
.timeframe_button{
    padding: 5px 10px;
    background: #FFFFFF;
    align-items: center;
}
.grouped_buttons{
    border: 1px solid #D0D5DD;
    filter: drop-shadow(0px 1px 2px rgba(16, 24, 40, 0.05));
    border-radius: 8px;
    font-family: 'IBM Plex Sans';
    font-style: normal;
    font-weight: 500;
    font-size: 12px;
    line-height: 20px;
    color: #344054;
}
.add_vendor_button{
    font-family: 'IBM Plex Sans';
    font-style: normal;
    font-weight: 500;
    font-size: 14px;
    line-height: 20px;
    color: #FFFFFF;
    padding: 8px 10px;
    background: #0F6AF2;
    border: 1px solid #0F6AF2;
    box-shadow: 0px 1px 2px rgba(16, 24, 40, 0.05);
    border-radius: 8px;
}
.export_button{
    background: #FFFFFF;
    border: 1px solid #D0D5DD;
    box-shadow: 0px 1px 2px rgba(16, 24, 40, 0.05);
    border-radius: 8px;
    font-family: 'IBM Plex Sans';
    font-style: normal;
    font-weight: 500;
    font-size: 14px;
    line-height: 20px;
    color: #344054;
    padding: 8px 10px;
}
.card_subtitle{
    font-family: 'IBM Plex Sans';
    font-style: normal;
    font-weight: 400;
    font-size: 14px;
    line-height: 20px;
    color: #667085;
}
.provider_amount_pill{
    font-family: 'IBM Plex Sans';
    font-style: normal;
    font-weight: 500;
    font-size: 12px;
    line-height: 18px;
    color: #344054;
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    padding: 2px 8px;
    background: #F2F4F7;
    border-radius: 16px;
}
.card_title{
    font-family: 'IBM Plex Sans';
    font-style: normal;
    font-weight: 500;
    font-size: 18px;
    line-height: 28px;
    color: #101828;
}
.card_container{
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    background: #FFFFFF;
    border: 1px solid #D0D5DD;
    box-shadow: 0px 12px 16px -4px rgba(16, 24, 40, 0.04);
    border-radius: 3px;
}
</style>