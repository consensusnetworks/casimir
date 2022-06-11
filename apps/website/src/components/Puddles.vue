<script lang="ts" setup>
import { ref, onMounted } from 'vue'
const puddleStyles = ref([]) as any
const stylesArray = new Array(56).fill({
  'fill': 'rgba(196, 196, 196, 0.10)',
  'filter': 'drop-shadow( 10px 0px 2px rgba(0, 0, 0, .25))',
})
puddleStyles.value = stylesArray

onMounted(() => {
  setInterval(() => {
    puddleStyles.value = new Array(56).fill({
      'fill': 'rgba(196, 196, 196, 0.10)',
      'filter': 'drop-shadow( 10px 0px 2px rgba(0, 0, 0, .25))'
    })
    const randomPuddle = Math.floor(Math.random() * puddleStyles.value.length)
    puddleStyles.value[randomPuddle] = {
      'fill': 'rgba(249, 158, 76, 0.80)',
      'filter': 'drop-shadow( 12px 0px 2px rgba(0, 0, 0, .45))',
      'transition': ' all 3.5s ease-out',
    }
  }, 3000)
})



</script>

<template>
  <div>
    <svg
      width="650"
      height="470"
      viewBox="0 0 2530 1460"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        r="72.5557"
        transform="matrix(0.317039 0.682961 -1.18303 -0.183027 1055.17 99.1054)"
        :style="puddleStyles[0]"
        class="puddle-animation"
      />
      <circle
        r="72.5557"
        transform="matrix(0.317039 0.682961 -1.18303 -0.183027 1923.29 600.267)"
        :style="puddleStyles[1]"
        class="puddle-animation"
      />
      <circle
        r="72.5557"
        transform="matrix(0.317039 0.682961 -1.18303 -0.183027 1706.26 474.976)"
        :style="puddleStyles[2]"
        class="puddle-animation"
      />
      <circle
        r="72.5557"
        transform="matrix(0.317039 0.682961 -1.18303 -0.183027 1489.23 349.686)"
        fill="#F36F38"
        :style="puddleStyles[3]"
        class="puddle-animation"
      />
      <circle
        r="72.5557"
        transform="matrix(0.317039 0.682961 -1.18303 -0.183027 1272.2 224.396)"
        :style="puddleStyles[4]"
        class="puddle-animation"
      />
      <circle
        r="72.5557"
        transform="matrix(0.317039 0.682961 -1.18303 -0.183027 767.342 515.851)"
        :style="puddleStyles[5]"
        class="puddle-animation"
      />
      <circle
        r="72.5557"
        transform="matrix(0.317039 0.682961 -1.18303 -0.183027 984.371 641.142)"
        :style="puddleStyles[6]"
        class="puddle-animation"
      />
      <circle
        r="72.5557"
        transform="matrix(0.317039 0.682961 -1.18303 -0.183027 1201.4 766.432)"
        :style="puddleStyles[7]"
        class="puddle-animation"
      />
      <circle
        r="72.5557"
        transform="matrix(0.317039 0.682961 -1.18303 -0.183027 1418.43 891.722)"
        :style="puddleStyles[8]"
        class="puddle-animation"
      />
      <circle
        r="72.5557"
        transform="matrix(0.317039 0.682961 -1.18303 -0.183027 1635.45 1017.01)"
        :style="puddleStyles[9]"
        class="puddle-animation"
      />
      <circle
        r="72.5557"
        transform="matrix(0.317039 0.682961 -1.18303 -0.183027 1852.48 1142.3)"
        :style="puddleStyles[10]"
        class="puddle-animation"
      />
      <circle
        r="72.5557"
        transform="matrix(0.317039 0.682961 -1.18303 -0.183027 550.315 390.561)"
        :style="puddleStyles[11]"
        class="puddle-animation"
      />
      <circle
        r="72.5557"
        transform="matrix(0.317039 0.682961 -1.18303 -0.183027 2014.1 798.421)"
        :style="puddleStyles[12]"
        class="puddle-animation"
      />
      <circle
        r="72.5557"
        transform="matrix(0.317039 0.682961 -1.18303 -0.183027 2231.13 923.711)"
        :style="puddleStyles[13]"
        class="puddle-animation"
      />
      <circle
        r="72.5557"
        transform="matrix(0.317039 0.682961 -1.18303 -0.183027 928.96 171.969)"
        :style="puddleStyles[14]"
        class="puddle-animation"
      />
      <circle
        r="72.5557"
        transform="matrix(0.317039 0.682961 -1.18303 -0.183027 1797.07 673.131)"
        :style="puddleStyles[15]"
        class="puddle-animation"
      />
      <circle
        r="72.5557"
        transform="matrix(0.317039 0.682961 -1.18303 -0.183027 1580.04 547.84)"
        :style="puddleStyles[16]"
        class="puddle-animation"
      />
      <circle
        r="72.5557"
        transform="matrix(0.317039 0.682961 -1.18303 -0.183027 1363.02 422.55)"
        :style="puddleStyles[17]"
        class="puddle-animation"
      />
      <circle
        r="72.5557"
        transform="matrix(0.317039 0.682961 -1.18303 -0.183027 1145.99 297.26)"
        :style="puddleStyles[18]"
        class="puddle-animation"
      />
      <circle
        r="72.5557"
        transform="matrix(0.317039 0.682961 -1.18303 -0.183027 641.128 588.715)"
        :style="puddleStyles[19]"
        class="puddle-animation"
      />
      <circle
        r="72.5557"
        transform="matrix(0.317039 0.682961 -1.18303 -0.183027 858.156 714.005)"
        :style="puddleStyles[20]"
        class="puddle-animation"
      />
      <circle
        r="72.5557"
        transform="matrix(0.317039 0.682961 -1.18303 -0.183027 1075.18 839.296)"
        :style="puddleStyles[21]"
        class="puddle-animation"
      />
      <circle
        r="72.5557"
        transform="matrix(0.317039 0.682961 -1.18303 -0.183027 1292.21 964.586)"
        :style="puddleStyles[22]"
        class="puddle-animation"
      />
      <circle
        r="72.5557"
        transform="matrix(0.317039 0.682961 -1.18303 -0.183027 1509.24 1089.88)"
        :style="puddleStyles[23]"
        class="puddle-animation"
      />
      <circle
        r="72.5557"
        transform="matrix(0.317039 0.682961 -1.18303 -0.183027 1726.27 1215.17)"
        :style="puddleStyles[24]"
        class="puddle-animation"
      />
      <circle
        r="72.5557"
        transform="matrix(0.317039 0.682961 -1.18303 -0.183027 424.1 463.425)"
        :style="puddleStyles[25]"
        class="puddle-animation"
      />
      <circle
        r="72.5557"
        transform="matrix(0.317039 0.682961 -1.18303 -0.183027 1887.88 871.285)"
        :style="puddleStyles[26]"
        class="puddle-animation"
      />
      <circle
        r="72.5557"
        transform="matrix(0.317039 0.682961 -1.18303 -0.183027 2104.91 996.575)"
        :style="puddleStyles[27]"
        class="puddle-animation"
      />
      <circle
        r="72.5557"
        transform="matrix(0.317039 0.682961 -1.18303 -0.183027 802.745 244.833)"
        :style="puddleStyles[28]"
        class="puddle-animation"
      />
      <circle
        r="72.5557"
        transform="matrix(0.317039 0.682961 -1.18303 -0.183027 1670.86 745.994)"
        :style="puddleStyles[29]"
        class="puddle-animation"
      />
      <circle
        r="72.5557"
        transform="matrix(0.317039 0.682961 -1.18303 -0.183027 1453.83 620.704)"
        :style="puddleStyles[30]"
        class="puddle-animation"
      />
      <circle
        r="72.5557"
        transform="matrix(0.317039 0.682961 -1.18303 -0.183027 2140.32 725.557)"
        :style="puddleStyles[31]"
        class="puddle-animation"
      />
      <circle
        r="72.5557"
        transform="matrix(0.317039 0.682961 -1.18303 -0.183027 2357.34 850.847)"
        :style="puddleStyles[32]"
        class="puddle-animation"
      />
      <circle
        r="72.5557"
        transform="matrix(0.317039 0.682961 -1.18303 -0.183027 1236.8 495.414)"
        :style="puddleStyles[33]"
        class="puddle-animation"
      />
      <circle
        r="72.5557"
        transform="matrix(0.317039 0.682961 -1.18303 -0.183027 1019.77 370.123)"
        :style="puddleStyles[34]"
        class="puddle-animation"
      />
      <circle
        r="72.5557"
        transform="matrix(0.317039 0.682961 -1.18303 -0.183027 514.913 661.579)"
        :style="puddleStyles[35]"
        class="puddle-animation"
      />
      <circle
        r="72.5557"
        transform="matrix(0.317039 0.682961 -1.18303 -0.183027 731.941 786.869)"
        :style="puddleStyles[36]"
        class="puddle-animation"
      />
      <circle
        r="72.5557"
        transform="matrix(0.317039 0.682961 -1.18303 -0.183027 948.969 912.16)"
        :style="puddleStyles[37]"
        class="puddle-animation"
      />
      <circle
        r="72.5557"
        transform="matrix(0.317039 0.682961 -1.18303 -0.183027 1166 1037.45)"
        :style="puddleStyles[38]"
        class="puddle-animation"
      />
      <circle
        r="72.5557"
        transform="matrix(0.317039 0.682961 -1.18303 -0.183027 1383.03 1162.74)"
        :style="puddleStyles[39]"
        class="puddle-animation"
      />
      <circle
        r="72.5557"
        transform="matrix(0.317039 0.682961 -1.18303 -0.183027 1600.05 1288.03)"
        :style="puddleStyles[40]"
        class="puddle-animation"
      />
      <circle
        r="72.5557"
        transform="matrix(0.317039 0.682961 -1.18303 -0.183027 297.885 536.289)"
        :style="puddleStyles[41]"
        class="puddle-animation"
      />
      <circle
        r="72.5557"
        transform="matrix(0.317039 0.682961 -1.18303 -0.183027 1761.67 944.149)"
        :style="puddleStyles[42]"
        class="puddle-animation"
      />
      <circle
        r="72.5557"
        transform="matrix(0.317039 0.682961 -1.18303 -0.183027 1978.7 1069.44)"
        :style="puddleStyles[43]"
        class="puddle-animation"
      />
      <circle
        r="72.5557"
        transform="matrix(0.317039 0.682961 -1.18303 -0.183027 676.53 317.697)"
        :style="puddleStyles[44]"
        class="puddle-animation"
      />
      <circle
        r="72.5557"
        transform="matrix(0.317039 0.682961 -1.18303 -0.183027 1544.64 818.858)"
        :style="puddleStyles[45]"
        class="puddle-animation"
      />
      <circle
        r="72.5557"
        transform="matrix(0.317039 0.682961 -1.18303 -0.183027 1327.61 693.568)"
        :style="puddleStyles[46]"
        class="puddle-animation"
      />
      <circle
        r="72.5557"
        transform="matrix(0.317039 0.682961 -1.18303 -0.183027 1110.59 568.278)"
        :style="puddleStyles[47]"
        class="puddle-animation"
      />
      <circle
        r="72.5557"
        transform="matrix(0.317039 0.682961 -1.18303 -0.183027 893.558 442.987)"
        :style="puddleStyles[48]"
        class="puddle-animation"
      />
      <circle
        r="72.5557"
        transform="matrix(0.317039 0.682961 -1.18303 -0.183027 388.698 734.443)"
        :style="puddleStyles[49]"
        class="puddle-animation"
      />
      <circle
        r="72.5557"
        transform="matrix(0.317039 0.682961 -1.18303 -0.183027 605.726 859.733)"
        :style="puddleStyles[50]"
        class="puddle-animation"
      />
      <circle
        r="72.5557"
        transform="matrix(0.317039 0.682961 -1.18303 -0.183027 822.755 985.023)"
        :style="puddleStyles[51]"
        class="puddle-animation"
      />
      <circle
        r="72.5557"
        transform="matrix(0.317039 0.682961 -1.18303 -0.183027 1039.78 1110.31)"
        :style="puddleStyles[52]"
        class="puddle-animation"
      />
      <circle
        r="72.5557"
        transform="matrix(0.317039 0.682961 -1.18303 -0.183027 1256.81 1235.6)"
        :style="puddleStyles[53]"
        class="puddle-animation"
      />
      <circle
        r="72.5557"
        transform="matrix(0.317039 0.682961 -1.18303 -0.183027 1473.84 1360.89)"
        :style="puddleStyles[54]"
        class="puddle-animation"
      />
      <circle
        r="72.5557"
        transform="matrix(0.317039 0.682961 -1.18303 -0.183027 171.67 609.153)"
        :style="puddleStyles[55]"
        class="puddle-animation"
      />
    </svg>
  </div>
</template>

<style>
@keyframes appear {
  0% {
    opacity: 0;
  }

  100% {
    opacity: 1;
  }
}

.puddle-animation {
  animation: appear 4.5s ease-in-out;
  animation-delay: -4.3s;
}
</style>
