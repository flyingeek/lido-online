import {focusMap} from '../components/utils';

export default function blurAction(node) {
    // const observer = new IntersectionObserver((entries) => {
    //     entries.forEach(entry => {
    //     if(entry.intersectionRatio!==1){
    //         node.blur();
    //     }
    // });
    // }, {threshold: 1});
    // observer.observe(node);
    const handleVisibilityChange = () =>{
        if (document && document.visibilityState && document.visibilityState !== 'visible') {
            if(node && node.blur) {
                node.blur();
                focusMap();
            }
        }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange, false);

    return {
        destroy() {
            // observer.unobserve(node);
            // observer.disconnect();
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        }
    }
}
