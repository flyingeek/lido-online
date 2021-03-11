/** Dispatch event on click outside of node */
export default function clickOutside(node) {
    //console.log('click outside installed')
    const handleClick = event => {
        if (node && !node.contains(event.target) && !event.defaultPrevented) {
            node.dispatchEvent(
                new CustomEvent('click_outside', node)
            )
            //console.log('click outside')
        }
    }

    document.addEventListener('click', handleClick, true);

    return {
        destroy() {
            document.removeEventListener('click', handleClick, true);
            //console.log('click outside removed')
        }
    }
}