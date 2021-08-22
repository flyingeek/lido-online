<script>
    export let value = 0;
    export let max = 100;
    $: progressPath = () => {
        if (value <= 0) {
            return "";
        } else if (value >= max) {
            return "M50,5A45 45 0 1 1 49.9999 5";
        } else {
            const angle = Math.PI * 2 * (value / max);
            const x = 50 + Math.cos(angle - Math.PI / 2) * 45;
            const y = 50 + Math.sin(angle - Math.PI / 2) * 45;
            let path = "M50,5";
            if (angle > Math.PI) {
                path += "A45 45 0 0 1 50 95";
            }
            path += `A45 45 0 0 1 ${x} ${y}`;
            return path;
        }
    };
</script>

<svg viewBox="0 0 108 108">
    <circle cx="54" cy="54" r="50"/>
    <path d="M50,5A45 45 0 1 1 49.9999 5" transform="translate(4,4)"/>
    <path d="{progressPath()}" transform="translate(4,4)"/>
</svg>
<slot></slot>

<style>
    svg {
        fill: var(--progress-fill, transparent);
        height: var(--progress-height, 24px);
        stroke-linecap: var(--progress-linecap, round);
        width: var(--progress-width, 24px);
    }
    circle {
        fill: var(--progress-circlefill, transparent);
        stroke: var(--progress-circlestroke, white);
        stroke-width: 8px;
    }
    path:first-of-type {
        stroke: var(--progress-trackcolor, var(--bs-gray-500));
        stroke-width: var(--progress-trackwidth, 10px);
    }
    path:last-child {
        stroke: var(--progress-color, yellow);
        stroke-width: var(--progress-width, 12px);
    }
</style>