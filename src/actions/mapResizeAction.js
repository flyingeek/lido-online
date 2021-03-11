export default function mapResizeAction(node, [getMap, destroyMap]) {
    const resizeMap = () => getMap() && getMap().resize() /* && console.log('map resized') */;
    const observer = new IntersectionObserver((entries, observer) => { 
        entries.forEach(entry => {
        if(entry.intersectionRatio===1){
            resizeMap();
        }
    });
    }, {threshold: 1});
    observer.observe(node);
    const orientationChange = (e) => {
        resizeMap();
    };
    window.addEventListener("orientationchange", orientationChange);

    return {
        destroy() {
            observer.unobserve(node);
            observer.disconnect();
            window.removeEventListener("orientationchange", orientationChange);
            destroyMap();
            //console.log('map removed');
        }
    }
}