// @ts-ignore
import { createApp } from 'vue'
// @ts-ignore
import { createPinia } from 'pinia'
// @ts-ignore
import type { App as VueApp } from 'vue'
import App from './App.vue'
// @ts-ignore
import router from './router'

const app: VueApp = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')