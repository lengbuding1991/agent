<template>
  <transition name="notification-slide">
    <div 
      v-if="visible" 
      class="notification"
      :class="[type, { 'notification-enter': enter }]"
      @click="handleClick"
    >
      <div class="notification-icon">
        <span v-if="type === 'success'">✅</span>
        <span v-else-if="type === 'error'">❌</span>
        <span v-else-if="type === 'warning'">⚠️</span>
        <span v-else>ℹ️</span>
      </div>
      <div class="notification-content">
        <div class="notification-title">{{ title }}</div>
        <div class="notification-message">{{ message }}</div>
      </div>
      <button class="notification-close" @click="hide">
        <span>×</span>
      </button>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Props {
  type?: 'success' | 'error' | 'warning' | 'info'
  title?: string
  message: string
  duration?: number
  autoClose?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'info',
  title: '',
  duration: 3000,
  autoClose: true
})

const emit = defineEmits<{
  click: []
  close: []
}>()

const visible = ref(false)
const enter = ref(false)
let timer: number | null = null

const show = () => {
  visible.value = true
  enter.value = true
  
  if (props.autoClose && props.duration > 0) {
    timer = window.setTimeout(() => {
      hide()
    }, props.duration)
  }
}

const hide = () => {
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
  enter.value = false
  setTimeout(() => {
    visible.value = false
    emit('close')
  }, 300)
}

const handleClick = () => {
  emit('click')
  if (props.autoClose) {
    hide()
  }
}

onMounted(() => {
  show()
})

defineExpose({
  show,
  hide
})
</script>

<style scoped>
.notification {
  position: fixed;
  top: 20px;
  right: 20px;
  min-width: 300px;
  max-width: 400px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  border-left: 4px solid #007bff;
  z-index: 1000;
  display: flex;
  align-items: flex-start;
  padding: 16px;
  gap: 12px;
  transition: all 0.3s ease;
  transform: translateX(400px);
  opacity: 0;
}

.notification-enter {
  transform: translateX(0);
  opacity: 1;
}

.notification.success {
  border-left-color: #28a745;
}

.notification.error {
  border-left-color: #dc3545;
}

.notification.warning {
  border-left-color: #ffc107;
}

.notification.info {
  border-left-color: #007bff;
}

.notification-icon {
  font-size: 20px;
  flex-shrink: 0;
  margin-top: 2px;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-weight: 600;
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
}

.notification-message {
  font-size: 13px;
  color: #666;
  line-height: 1.4;
}

.notification-close {
  background: none;
  border: none;
  font-size: 18px;
  color: #999;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.2s;
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.notification-close:hover {
  background: #f0f0f0;
  color: #666;
}

.notification-slide-enter-active,
.notification-slide-leave-active {
  transition: all 0.3s ease;
}

.notification-slide-enter-from {
  transform: translateX(400px);
  opacity: 0;
}

.notification-slide-enter-to {
  transform: translateX(0);
  opacity: 1;
}

.notification-slide-leave-from {
  transform: translateX(0);
  opacity: 1;
}

.notification-slide-leave-to {
  transform: translateX(400px);
  opacity: 0;
}
</style>