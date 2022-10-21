<template>
  <div class="flex w-fit px-margins py-y-spacer align-middle">
    <RouterLink 
      to="/"
    >
      <img
        src="/casimir.svg"
        alt="Casimir Logo"
        class="nav-imgs"
      >
    </RouterLink>
    
    <!-- Will comment these back in once we get the pages ready -->
    <!-- <RouterLink 
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

    <RouterLink
      to="community"
      class="my-auto"
    >
      <h6
        class="nav-links"
        :class="$route.fullPath.split('/')[1] === 'community'? 'nav-links-selected' : ''"
      >
        Community
      </h6>
    </RouterLink> -->
  </div>
</template>
  