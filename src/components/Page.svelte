<script>
      import { fade } from "svelte/transition";
</script>

<page in:fade>
    <slot></slot>
</page>

<style>
    page {
        flex: 1 1 auto;
        display: flex;
        flex-direction: column;
    }
</style>