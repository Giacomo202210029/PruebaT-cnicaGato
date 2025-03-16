import router from './router';
import 'primeicons/primeicons.css';
import PrimeVue from 'primevue/config';
import './style.css'
import {createApp} from "vue";
import App from "./App.vue";

import Carousel from 'primevue/carousel';


const app = createApp(App);
app.use(router);
app.use(PrimeVue);
app.component('Carousel', Carousel);


app.mount('#app');
