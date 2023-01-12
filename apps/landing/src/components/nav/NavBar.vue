<template>
  <div class="grid grid-cols-6 px-margins py-y-spacer h-full bg-black">
    <div class="h-full col-span-4 csm-md:col-span-6">
      <div class="flex mb-[65px]">
        <RouterLink 
          to="/"
        >
          <img
            src="/casimir.svg"
            alt="Casimir Logo"
            class="nav-imgs"
          >
        </RouterLink>
        <!-- Will add these links once the pages get added as well -->
        <RouterLink 
          to="/why-casimir"
          class="my-auto"
        >
          <h6
            class="nav-links"
            :class="$route.fullPath.split('/')[1] === 'why-casimir'? 'nav-links-selected' : ''"
          >
            Why Casimir?
          </h6>
        </RouterLink>

        <!-- <RouterLink
          to="community"
          class="my-auto"
        >
          <h6
            class="nav-links"
            :class="$route.fullPath.split('/')[1] === 'community'? 'nav-links-selected' : ''"
          >
            Community
          </h6>
        </RouterLink>  -->
      </div>
      <div 
        v-show="$route.fullPath.split('/')[1] === ''"
        class="w-full h-[150px] side-anim"
      >
        <h2 class="font-regular text-grey_5 home-nav-dynamic-text">
          <!-- sm:text-[36px] truncate -->
          Simple self-custody for all of your digital assets
        </h2>
      </div>
      <div 
        v-show="$route.fullPath.split('/')[1] === 'why-casimir'"
        class="w-full h-[120px] overflow-hidden side-anim"
      >
        <h3 class="font-medium text-white mb-[25px] nav-xsm:text-[24px] nav-xsm:leading-[30px] nav-xsm:font-semibold">
          Why We're Building Casimir
        </h3>
        <h5 class="text-blue_1 font-light nav-xsm:text-[16px] nav-xsm:leading-[20px]">
          Written by Nathan Miller
        </h5>
      </div>
      <div
        v-show="$route.fullPath.split('/')[1] === 'community'"
        class="w-full h-[150px] overflow-hidden side-anim"
      >
        <h3 class="font-medium text-blue_3 mb-[25px]">
          Casimir Connect
        </h3>
        <h4 class="text-white font-medium sm:sr-only">
          Welecomes you to our community
        </h4>
      </div>
    </div>
    <div class="col-span-2 csm-md:sr-only">
      <div
        v-show="$route.fullPath.split('/')[1] === 'why-casimir'"
        class="h-full flex justify-center"
      >
        <img
          src="./components/shapes.svg"
          alt="Blurred Shapes"
          class=" w-[300px]"
        >
      </div>
      <div
        v-show="$route.fullPath.split('/')[1] === 'community'"
        class="h-full flex justify-center"
      >
        <img
          src="./components/polygons.svg"
          alt="Polygon in a Circle"
          class="w-[250px] rotate-anim"
        >
      </div>
    </div>
  </div>
</template>