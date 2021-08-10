<script>
    import { slide } from 'svelte/transition';
    let visible = false;
    let promise;
    export const show = async () => {
        visible = true;
        promise = fetch('./CHANGELOG.json').then(response => {
            if(response.ok) {
                return response.json();
            } else {
                throw new Error('CHANGELOG.json not available');
            }
        });
    };
    const translation = {
        "ADDED": "Ajouté",
        "FIXED": "Corrigé",
        "DEPRECATED": "Obsolète",
        "CHANGED": "Modifié",
        "REMOVED": "Supprimé",
        "SECURITY": "Sécurité"
    };
    const _ = text => translation[text.toUpperCase()] || text;
    function parseMarkdown(markdownText) {
        const htmlText = markdownText
            //.replace(/^### (.*$)/gim, '<h3>$1</h3>')
            //.replace(/^## (.*$)/gim, '<h2>$1</h2>')
            //.replace(/^# (.*$)/gim, '<h1>$1</h1>')
            //.replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>')
            .replace(/\*\*(.*)\*\*/gim, '<b>$1</b>')
            //.replace(/\*(.*)\*/gim, '<i>$1</i>')
            //.replace(/!\[(.*?)\]\((.*?)\)/gim, "<img alt='$1' src='$2' />")
            .replace(/\[(.*?)\]\((.*?)\)/gim, "<a href='$2' rel='noreferrer' target='_blank'>$1</a>")
            .replace(/^$/g, '<br />')

        return htmlText.trim()
    }

</script>

{#if visible}
    <div class="modal" tabindex="-1" role="dialog" in:slide>
        <div class="modal-dialog" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">CHANGELOG</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close" on:click={() => visible = false}>
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body">
                    {#await promise}
                    <p>chargement...</p>
                {:then json}
                    <ul>
                    {#each Object.entries(json.CHANGELOG) as [title, section]}
                        {#if title !== "raw"}
                            <li>
                                <h2>{title}</h2>
                                {#each Object.entries(section) as [category, content]}
                                    {#if category !== "raw"}
                                        <h3>{_(category)}</h3>
                                        {#each content.raw.replace(/^\n\n|\n\n$/, '').split('\n') as item}
                                            <div class="changelog">{@html parseMarkdown(item)}</div>
                                        {/each}
                                    {:else}
                                        <div class="changelog">{@html parseMarkdown(content)}</div>
                                    {/if}
                                {/each}
                            </li>
                        {/if}
                    {/each}
                    </ul> 
                {/await}
                </div>
            </div>
        </div>
    </div>
{/if}

<style>
    @media (min-width: 576px) {
        .modal-dialog {
            max-width: 80vw;
        }
    }
    .modal {
        display: block;
    }
    .modal-body {
        overflow-y: auto;
        max-height: 80vh;
    }
    .modal-body li{
        list-style: square;
    }
    .modal-body h3{
        font-size: 1.1rem;
        font-variant: all-petite-caps;
        text-decoration: underline;
    }
    .modal-body h2{
        font-size: 1.5rem;
    }
    .changelog {
        margin-bottom: 0.5rem;
        margin-left: 0.5rem;
    }
</style>