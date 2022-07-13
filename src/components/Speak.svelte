<script>
    export let value="";
    function speak() {
        const synth = window.speechSynthesis;
        if (synth && value) {
            const utterance = new SpeechSynthesisUtterance(value);
            speechSynthesis.speak(utterance);
        }
    }
</script>
<!-- svelte-ignore a11y-missing-attribute -->
<a on:click|preventDefault={speak}><slot>Hello World</slot></a>
<style>
a::after {
  content: "🔊";
}
a {
    text-decoration: none;
}
</style>
