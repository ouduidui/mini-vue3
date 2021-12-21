import { App } from './app.js';
import { createApp } from '../../dist/mini-vue.esm.js';

const rootContainer = document.querySelector('#app');
createApp(App).mount(rootContainer);
