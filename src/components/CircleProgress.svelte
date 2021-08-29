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
    <line x1="54" y1="36" x2="54" y2="72" />
    <polyline points="36 54, 54 72, 72 54" />
    <line x1="54" y1="36" x2="54" y2="72" />
    <polyline points="36 54, 54 72, 72 54" />
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
        stroke: var(--progress-circleoutline, black);
        stroke-width: 4px;
    }
    path:first-of-type {
        stroke: var(--progress-trackcolor, var(--bs-gray-500));
        stroke-width: var(--progress-trackwidth, 14px);
    }
    path:last-of-type {
        stroke: var(--progress-color, yellow);
        stroke-width: var(--progress-width, 14px);
    }
    line:last-of-type, polyline:last-of-type {
        stroke: var(--progress-arrowstroke, black);
        stroke-width: var(--progress-arrowwidth, 10px);
    }
    line:first-of-type, polyline:first-of-type {
        stroke: var(--progress-arrowoutline, var(--progress-circleoutline, black));
        stroke-width: calc(var(--progress-arrowwidth, 10px) + 4px);
    }
</style>