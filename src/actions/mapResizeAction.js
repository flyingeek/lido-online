export default function mapResizeAction(node, map) {
    let currentMap = map;
    const resizeMap = () => currentMap && currentMap.resize() /* && console.log('map resized') */;
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
        update(map) {
            currentMap = map;
        },
        destroy() {
            observer.unobserve(node);
            observer.disconnect();
            window.removeEventListener("orientationchange", orientationChange);
            if (currentMap) currentMap.remove();
            //console.log('map removed');
        }
    }
}