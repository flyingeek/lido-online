export default function clickOnEnterKey(node) {
    const clickOnEnter = (event) =>  {
        if(event.keyCode === 13){
            // Cancel the default action, if needed
            // event.preventDefault();
            // Trigger the button element with a click
            node.click();
        }
    };
    node.addEventListener("keyup", clickOnEnter);

    return {
        destroy() {
            node.removeEventListener("keyup", clickOnEnter);
        }
    }
}