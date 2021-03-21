<script>
    import {ofp} from '../stores';
</script>

<div>
    <p><b>{$ofp.infos.flight}</b> {$ofp.infos.departure}-{$ofp.infos.destination}</p>
    <p>{$ofp.infos.date} {($ofp.infos.ofp.includes('/')) ? '' : 'ofp: '}{$ofp.infos.ofp}</p>
</div>

<style>
    div{
        display: none;
        flex-direction: column;
        margin-right: 1rem;
        font-size: small;
    }
    @media (min-width: 500px){
        div {
            display: flex;
        }
    }
    p{
        margin:0
    }
</style>