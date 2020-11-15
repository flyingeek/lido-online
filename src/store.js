import { writable } from 'svelte/store';

export const swDismiss = writable(false);
export const sidebar = writable(false);
export const online = writable(navigator.onLine);