import { createApp, h, ref } from 'vue'
import Notification from '../components/Notification.vue'

interface NotificationOptions {
  type?: 'success' | 'error' | 'warning' | 'info'
  title?: string
  message: string
  duration?: number
  autoClose?: boolean
}

interface NotificationInstance {
  hide: () => void
}

const notifications = ref<NotificationInstance[]>([])

const showNotification = (options: NotificationOptions): NotificationInstance => {
  const container = document.createElement('div')
  document.body.appendChild(container)
  
  let hideFunction: () => void
  
  const app = createApp({
    setup() {
      const hide = () => {
        app.unmount()
        document.body.removeChild(container)
        const index = notifications.value.findIndex(n => n.hide === hideFunction)
        if (index > -1) {
          notifications.value.splice(index, 1)
        }
      }
      
      hideFunction = hide
      
      return () => h(Notification, {
        ...options,
        onClose: hide
      })
    }
  })
  
  app.mount(container)
  
  const instance = { hide: hideFunction! }
  notifications.value.push(instance)
  
  return instance
}

const notification = {
  success: (message: string, title?: string) => 
    showNotification({ type: 'success', message, title }),
  
  error: (message: string, title?: string) => 
    showNotification({ type: 'error', message, title }),
  
  warning: (message: string, title?: string) => 
    showNotification({ type: 'warning', message, title }),
  
  info: (message: string, title?: string) => 
    showNotification({ type: 'info', message, title }),
  
  show: (options: NotificationOptions) => showNotification(options),
  
  hideAll: () => {
    notifications.value.forEach(instance => instance.hide())
    notifications.value = []
  }
}

export default notification