<script setup lang="ts">
import { remove } from '@vue/shared'
import { ref, onMounted } from 'vue'

// eslint-disable-next-line no-undef
const props = defineProps({
    phrases: {
        type: Array,
        required: true,
    },
    repeat: {
        type: Boolean,
        required: true
    },
    delay: {
        type: Number,
        default: 3000
    },
    textClass: {
        type: String,
        required: true
    },
    transformTimer: {
        type: Number, 
        default: 0
    }
})

const text = ref('')
onMounted(() => {
    // const phrases = [
    // 'Stake any amount.',
    // 'Across any wallet.',
    // 'The first non-custodial platform.',
    // ]
    let chars = '!<>-_\\/[]{}—=+*^?#________'
    let counter = 0
    const next = ()=> {
        
        // let newText = (Math.floor(Math.random() * (3300 - 100) + 100) / 100).toString()
        let newText = props.phrases[counter]
        let oldText = text.value

        const randomChar = () => {
            return chars[Math.floor(Math.random() * chars.length)]
        }

        let from = oldText.split('')
        let to = newText.split('')
        if(from.length >= to.length){
            const replace = () => {
                let textValue = text.value.split('')
                let toValue = newText.split('')
                if(text.value != newText){
                    let index = Math.floor(Math.random() * toValue.length)
                    textValue[index] = toValue[index]
                    text.value = textValue.join('')
                    textValue.splice(index, 1)
                    toValue.splice(index, 1)
                    setTimeout(() => {
                        replace()
                    }, props.transformTimer)
                }else{
                    if(props.repeat){
                        setTimeout(() => {
                            next()
                        }, 3000)    
                    }
                }
            }
            // remove random chars until lengths match
            const remove = () => {
                if(text.value.length > to.length){
                    const index = Math.floor(Math.random() * text.value.length)
                    let newValue = text.value.split('')
                    newValue.splice(index, 1)
                    text.value = newValue.join('')
                    setTimeout(() => {
                        remove()
                    },  props.transformTimer)
                } else {
                    replace()
                }
            }
            // update text.value to random chars
            const update = () =>{
                let possibleIndexes = []
                for (let i = 0; i < text.value.length; i++) {
                    if(oldText.includes(text.value.split('')[i])){
                        possibleIndexes.push(i)
                    }
                }
                const checkIfTextIncludes = () => {
                    for (let i = 0; i < text.value.length; i++) {
                        if(oldText.includes(text.value.split('')[i])) return true
                    }
                    return false
                }
                if(checkIfTextIncludes()){
                    let char = randomChar()
                    let index = Math.floor(Math.random() * possibleIndexes.length)
                    from[possibleIndexes[index]] = char
                    possibleIndexes.splice(index, 1)
                    text.value = from.join('')
                    setTimeout(() => {
                        update()
                    },  props.transformTimer)
                } else {
                    remove()
                }
            }

            update()
            // replace random chars until texts match
        } else {
            const replace = () => {
                let textValue = text.value.split('')
                let toValue = newText.split('')
                if(text.value != newText){
                    let index = Math.floor(Math.random() * toValue.length)
                    textValue[index] = toValue[index]
                    text.value = textValue.join('')
                    textValue.splice(index, 1)
                    toValue.splice(index, 1)
                    setTimeout(() => {
                        replace()
                    },  props.transformTimer)
                }else{
                    if(props.repeat){
                        setTimeout(() => {
                            next()
                        }, 3000)    
                    }
                }
            }
            const update = () => {
                if(from.length < to.length){
                    let char = randomChar()
                    let index = Math.floor(Math.random() * from.length)
                    from.splice(index ,0, char)
                    text.value = from.join('')
                    setTimeout(() => {
                        update()
                    },  props.transformTimer)
                } else {
                    replace()
                }
            }
            update()

            
        }
        counter = (counter + 1) % props.phrases.length
    }
    
    setTimeout(()=>{
        next()
    }, props.delay)
    
    
})
</script>

<template>
  <div>
    <span :class="props.textClass">
      {{ text }}
    </span>
  </div>
</template>
  
<style>
</style>

  