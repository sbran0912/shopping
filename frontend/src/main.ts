import { App } from './App';

const appContainer = document.getElementById('app');

if (!appContainer) {
  throw new Error('App container not found');
}

new App(appContainer);
