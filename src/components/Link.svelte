<script>
    export let href;
    const isExternal = href && !href.startsWith('#');
    const props = (isExternal) ? Object.assign({rel: "noreferrer", target: "_blank"}, $$restProps): $$restProps;
</script>
<!-- svelte-ignore a11y-missing-attribute -->
<a {href} {...props}><slot></slot></a>