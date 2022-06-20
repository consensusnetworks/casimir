import { onMounted, ref } from 'vue'

export default function useSlideshow() {
    const slideshowProgress = ref(0)
    const currentSlide = ref(2)
    onMounted(() => {
    setInterval(() => {
        slideshowProgress.value += 0.05
        if (slideshowProgress.value >= 100) {
        slideshowProgress.value = 0
        currentSlide.value =
            currentSlide.value + 1 !== 3 ? currentSlide.value + 1 : 0
        }
    }, 0.00000005)
    })

    return {
        slideshowProgress,
        currentSlide
    }
}