<script>
    import {shareAppLink} from './utils';
</script>

<button tabindex="0" class="share btn btn-outline-secondary btn-sm" on:click={shareAppLink}><svg><use xlink:href="#share-symbol" /></svg><!-- Partager --></button>

<style>
    .share::before{
        content: "Partager";
    }
    .share svg {
        display: none;
    }
    @media (min-width: 992px) {
        .share::before{
            content: "Partager l'App";
        }
        .share svg {
            display: inline-block;
            width: calc(1rem * 1.2);
            height: calc(1rem * 1.2);
            margin-bottom: 3px;
        }
    }
</style>